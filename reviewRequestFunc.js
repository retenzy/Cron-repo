// const { reviewRequestMailSend } = require('../controllers/Merchant/review-request-cron');
const db = require('./models');
const moment = require('moment');
const { Op } = require('sequelize');
const helper = require('./helper/app-helper'); 
const CONFIG = require('./config');
exports.insertEmailLogs = async ({
  store_id,
  email_type,
  sent_type,
  email_sent_date,
  message,
  email_message_id,
  order_id = null,
  email_client = 'Retenzy',
  event_type = null,
}) => {
  try {
    const emailLogRes = await db.EmailLogs.create({
      store_id,
      email_type,
      sent_type,
      email_sent_date,
      message,
      email_message_id,
      email_client,
      order_id,
      event_type,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.reviewRequestFunc = async (data) => {
  console.log('in reviewrequestfun');
  try {
    let orderItems = [];
    let products = [];
    for (let item of data.order_items) {
      // console.log("item.review_status", item.review_status)
      if (item.review_status == '0') {
        orderItems.push(item.line_item_id);
        let responseData = await db.Products.findOne({
          where: { store_id: data.store_id, product_id: item.product_id },
          attributes: ['id', 'title', 'product_id', 'handle', 'description'],
          include: [
            {
              model: db.ProductImages,
              attributes: ['image_url'],
              limit: 1,
            },
          ],
        });
        // console.log("responseData", responseData)
        if (responseData) {
          const base64Encode = (data) =>
            Buffer.from(JSON.stringify(data)).toString('base64');
          const reviewData = {
            productId: item.product_id,
            productName: responseData?.title,
            productHandle: responseData?.handle,
            productImgUrl: responseData.product_images[0]
              ? responseData.product_images[0].image_url
              : null,
            // customerEmail: customer.customer_email,
            // customerName: `${customer?.first_name || ""} ${
            //   customer?.last_name || ""
            // }`.trim(),
            // orderId,
            line_item_id: item.line_item_id,
            shop: data.store.main_domain || data.store.domain,
          };
          const encryptedData = base64Encode(reviewData);
          let object = {
            title: responseData.title,
            image_url: responseData.product_images[0]
              ? responseData.product_images[0].image_url
              : null,
            product_url: `https://${data.domain}/products/${responseData.handle}`,
            reviewUrl: `${CONFIG.shopify.appUrl}/admin/write-review?data=${encryptedData}`,
          };
          products.push(object);
        }
      }
    }
    if (orderItems.length > 0) {
      let customerResponse = await db.Customers.findOne({
        where: { store_id: data.store_id, customer_id: data.customer_id },
        attributes: ['first_name', 'last_name', 'customer_email'],
      });
      if (
        customerResponse &&
        customerResponse.customer_email &&
        products.length > 0
      ) {
        let customer_name = helper.customername(
          customerResponse.first_name,
          customerResponse.last_name
        );

        let key =
          data.type == 'review_request_reminder_cron'
            ? 'review_reminder'
            : 'review_request';
        console.log('key', key);
        let mailObject = {
          store: data.store,
          customer: customerResponse,
          type: key,
          products: products,
          order: { name: data.order_name },
          customArgs: {
            email_type: key,
            campaign_name: 'review_campaign',
          },
          category: [data?.store?.username],
        };
        let emailResponse = await helper.reviewRequest(mailObject);
        console.log('mailresponce in reviewRequestFunc==>', emailResponse);
        if (!emailResponse?.status) {
          throw new CustomError(400, 'Error to send Email');
        }
        if (data.type == 'review_request_reminder_cron') {
          console.log('In if case');
          // await this.insertEmailLogs(
          //   data.store_id,
          //   "review",
          //   "auto",
          //   new Date(),
          //   `Reminder-mail | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`
          // );
          let emailLogsObj = {
            store_id: data.store.id,
            email_type: 'Review',
            sent_type: 'auto',
            email_sent_date: new Date(),
            message: `Reminder-mail from cron| order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`,
            email_message_id: emailResponse?.message_id,
            order_id: data.order_id,
            email_client: emailResponse?.mailClient,
            event_type: key,
          };
          await this.insertEmailLogs(emailLogsObj);
          for (let item of data.order_items) {
            await db.OrderItems.update(
              {
                email_reminder_date: new Date(),
                email_reminder_count: item.email_reminder_count + 1,
              },
              { where: { line_item_id: item.line_item_id } }
            );
          }
        } else {
          console.log('In else case', new Date());
          let type = data.type == 'review_request_cron' ? 'auto' : 'manual';
          // await this.insertEmailLogs(
          //   data.store_id,
          //   "review",
          //   type,
          //   new Date(),
          //   `Send by merchant - ${type} | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`
          // );
          let emailLogsObj = {
            store_id: data.store.id,
            email_type: 'Review',
            sent_type: type,
            email_sent_date: new Date(),
            message: `Send by merchant from cron- ${type} | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`,
            email_message_id: emailResponse?.message_id,
            order_id: data.order_id,
            email_client: emailResponse?.mailClient,
            event_type: key,
          };
          await this.insertEmailLogs(emailLogsObj);

          await db.OrderItems.update(
            {
              review_status: '1',
              review_date: new Date(),
              email_sent_date: new Date(),
            },
            { where: { line_item_id: { [Op.in]: orderItems } } }
          );
        }
      }
    }
    return {
      status: 200,
      message: 'Success',
    };
  } catch (error) {
    console.log('error in reviewRequestFunc', error);
    return {
      status: 500,
      error: error,
    };
  }
}; 