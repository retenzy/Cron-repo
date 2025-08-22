// const { reviewRequestMailSend } = require('../controllers/Merchant/review-request-cron');
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const helper = require('../helper/app-helper'); // adjust path if needed
const { reviewRequestFunc } = require('../reviewRequestFunc');
module.exports.reviewRequestReminderEmail = async () => {
  try {
    const reviewSettingData = await db.ReviewSetting.findOne({
      where: {
        store_id: null,
        key: 'review_request_email_reminder',
      },
    });

    const storeData = await db.Store.findAll({
      where: {
        is_uninstalled: '0',
        email_enable: '1',
      },
      include: {
        model: db.ReviewSetting,
        required: false,
        where: {
          key: 'review_request_email_reminder',
        },
      },
    });

    for (let store of storeData) {
      if (!store.review_settings.length > 0) {
        store.review_settings.push(reviewSettingData);
      }
      const reviewSetting = store.review_settings[0];
      const value = JSON.parse(reviewSetting.value);
      console.log('store.id', store.id, store.username);
      const ismailReached = await helper.isMailLimitReached(store);
      if (value.emailReminderTiming >= 0 && !ismailReached) {
        // Get all eligible order items
        const orderItems = await db.OrderItems.findAll({
          where: {
            store_id: store.id,
            review_status: '1',
            is_review: '0',
            email_reminder_count: {
              [Op.lt]: value.emailReminderCount,
            },
            created_at: { [Op.gte]: '2025-01-01' },
          },
          include: {
            model: db.Order,
            attributes: [
              'id',
              'customer_id',
              'order_name',
              'customer_email',
              'order_id',
            ],
          },
        });
        // Group items by order_id
        const orderGroups = {};
        const currentDate = moment();

        for (const item of orderItems) {
          const lastEmailDate =
            item.email_reminder_count > 0
              ? moment(item.email_reminder_date)
              : moment(item.email_sent_date);

          // Calculate days elapsed since last email
          const daysElapsed = currentDate.diff(lastEmailDate, 'days');
          if (daysElapsed >= value.emailReminderTiming) {
            const orderItem = {
              line_item_id: item.line_item_id,
              product_id: item.product_id,
              review_status: '0',
              email_reminder_count: item.email_reminder_count,
            };

            if (!orderGroups[item.order_id]) {
              orderGroups[item.order_id] = {
                orderData: insertOrderData(item.order, store),
                items: [],
              };
            }

            orderGroups[item.order_id].items.push(orderItem);
          }
        }

        // Send one email per order with all eligible items
        for (const [orderId, data] of Object.entries(orderGroups)) {
          if (data.items.length > 0) {
            const emailData = {
              ...data.orderData,
              order_items: data.items,
            };

            if (emailData?.order_items?.length > 0) {
              console.log('review reminder cron  data==>', {
                ...emailData,
                store: 'skipped store',
              });
              let returnResp = await reviewRequestFunc(emailData);
              if (returnResp.error) {
                throw new CustomError(400, 'Error to send email');
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Error to send review request email send=>>', error);
    throw error;
  }
};
const insertOrderData = (order, shop) => {
  try {
    return {
      store: shop,
      store_id: shop.id,
      order_id: order.order_id,
      orderId: order.id,
      shop: shop.username,
      domain: shop.main_domain || shop.domain,
      customer_id: order.customer_id,
      order_name: order.order_name,
      type: 'review_request_reminder_cron',
    };
  } catch (error) {
    console.log('insertOrderData error', error);
    throw error;
  }
};


// exports.reviewRequestFunc = async (data) => {
//   console.log('in reviewrequestfun');
//   try {
//     let orderItems = [];
//     let products = [];
//     for (let item of data.order_items) {
//       // console.log("item.review_status", item.review_status)
//       if (item.review_status == '0') {
//         orderItems.push(item.line_item_id);
//         let responseData = await db.Products.findOne({
//           where: { store_id: data.store_id, product_id: item.product_id },
//           attributes: ['id', 'title', 'product_id', 'handle', 'description'],
//           include: [
//             {
//               model: db.ProductImages,
//               attributes: ['image_url'],
//               limit: 1,
//             },
//           ],
//         });
//         // console.log("responseData", responseData)
//         if (responseData) {
//           const base64Encode = (data) =>
//             Buffer.from(JSON.stringify(data)).toString('base64');
//           const reviewData = {
//             productId: item.product_id,
//             productName: responseData?.title,
//             productHandle: responseData?.handle,
//             productImgUrl: responseData.product_images[0]
//               ? responseData.product_images[0].image_url
//               : null,
//             // customerEmail: customer.customer_email,
//             // customerName: `${customer?.first_name || ""} ${
//             //   customer?.last_name || ""
//             // }`.trim(),
//             // orderId,
//             line_item_id: item.line_item_id,
//             shop: data.store.main_domain || data.store.domain,
//           };
//           const encryptedData = base64Encode(reviewData);
//           let object = {
//             title: responseData.title,
//             image_url: responseData.product_images[0]
//               ? responseData.product_images[0].image_url
//               : null,
//             product_url: `https://${data.domain}/products/${responseData.handle}`,
//             reviewUrl: `${CONFIG.shopify.appUrl}/admin/write-review?data=${encryptedData}`,
//           };
//           products.push(object);
//         }
//       }
//     }
//     if (orderItems.length > 0) {
//       let customerResponse = await db.Customers.findOne({
//         where: { store_id: data.store_id, customer_id: data.customer_id },
//         attributes: ['first_name', 'last_name', 'customer_email'],
//       });
//       if (
//         customerResponse &&
//         customerResponse.customer_email &&
//         products.length > 0
//       ) {
//         let customer_name = helper.customername(
//           customerResponse.first_name,
//           customerResponse.last_name
//         );

//         let key =
//           data.type == 'review_request_reminder_cron'
//             ? 'review_reminder'
//             : 'review_request';
//         console.log('key', key);
//         let mailObject = {
//           store: data.store,
//           customer: customerResponse,
//           type: key,
//           products: products,
//           order: { name: data.order_name },
//           customArgs: {
//             email_type: key,
//             campaign_name: 'review_campaign',
//           },
//           category: [data?.store?.username],
//         };
//         let emailResponse = await helper.reviewRequest(mailObject);
//         console.log('mailresponce in reviewRequestFunc==>', emailResponse);
//         if (!emailResponse?.status) {
//           throw new CustomError(400, 'Error to send Email');
//         }
//         if (data.type == 'review_request_reminder_cron') {
//           console.log('In if case');
//           // await this.insertEmailLogs(
//           //   data.store_id,
//           //   "review",
//           //   "auto",
//           //   new Date(),
//           //   `Reminder-mail | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`
//           // );
//           let emailLogsObj = {
//             store_id: data.store.id,
//             email_type: 'Review',
//             sent_type: 'auto',
//             email_sent_date: new Date(),
//             message: `Reminder-mail from cron| order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`,
//             email_message_id: emailResponse?.message_id,
//             order_id: data.order_id,
//             email_client: emailResponse?.mailClient,
//             event_type: key,
//           };
//           await this.insertEmailLogs(emailLogsObj);
//           for (let item of data.order_items) {
//             await db.OrderItems.update(
//               {
//                 email_reminder_date: new Date(),
//                 email_reminder_count: item.email_reminder_count + 1,
//               },
//               { where: { line_item_id: item.line_item_id } }
//             );
//           }
//         } else {
//           console.log('In else case', new Date());
//           let type = data.type == 'review_request_cron' ? 'auto' : 'manual';
//           // await this.insertEmailLogs(
//           //   data.store_id,
//           //   "review",
//           //   type,
//           //   new Date(),
//           //   `Send by merchant - ${type} | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`
//           // );
//           let emailLogsObj = {
//             store_id: data.store.id,
//             email_type: 'Review',
//             sent_type: type,
//             email_sent_date: new Date(),
//             message: `Send by merchant from cron- ${type} | order: ${mailObject.order.name} | customer: ${mailObject.customer.customer_email}`,
//             email_message_id: emailResponse?.message_id,
//             order_id: data.order_id,
//             email_client: emailResponse?.mailClient,
//             event_type: key,
//           };
//           await this.insertEmailLogs(emailLogsObj);

//           await db.OrderItems.update(
//             {
//               review_status: '1',
//               review_date: new Date(),
//               email_sent_date: new Date(),
//             },
//             { where: { line_item_id: { [Op.in]: orderItems } } }
//           );
//         }
//       }
//     }
//     return {
//       status: 200,
//       message: 'Success',
//     };
//   } catch (error) {
//     console.log('error in reviewRequestFunc', error);
//     return {
//       status: 500,
//       error: error,
//     };
//   }
// };