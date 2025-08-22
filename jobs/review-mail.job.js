// const { reviewRequestMailSend } = require('../controllers/Merchant/review-request-cron');
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const helper = require('../helper/app-helper'); // adjust path if needed
const { reviewRequestFunc } = require('../reviewRequestFunc');
module.exports.reviewRequestMailSend = async () => {
  try {
    console.log('review request email cron');
    let reviewSettings = await db.ReviewSetting.findAll({
      where: {
        store_id: {
          [Op.ne]: null,
        },
        key: 'review_request_email_timing',
      },
      include: {
        model: db.Store,
        where: {
          is_uninstalled: '0',
          email_enable: '1',
        },
      },
    });
    // console.log("reviewSettings", reviewSettings);
    for (let setting of reviewSettings) {
      let shop = setting.store;
      let value = JSON.parse(setting.value);
      const ismailReached = await helper.isMailLimitReached(shop);
      if (value.emailTiming >= 0 && !ismailReached) {
        let date = moment().subtract(value.emailTiming, 'days').toDate();
        date = moment(date).format('YYYY-MM-DD');
        const { start, end } = helper.GetStartEndDate(date, date);
        let options = {};
        let date2 = moment()
          .subtract(2 * value.emailTiming, 'days')
          .toDate();
        date2 = moment(date2).format('YYYY-MM-DD');
        const dateObj = helper.GetStartEndDate(date2, date2);

        let orderIdArray = await db.Order.findAll({
          where: {
            fulfillment_status: {
              [Op.in]: ['FULFILLED', 'PARTIAL'],
            },
            [Op.and]: [
              {
                order_updated_at: {
                  // [Op.gte]: dateObj.end,
                  [Op.gte]: '2025-01-01',
                },
              },
              {
                order_updated_at: {
                  [Op.lte]: end,
                },
              },
            ],
            // order_cancelled_at
            // created_at:{[Op.gte]:"2025-01-09"},
            store_id: shop.id,
          },
          attributes: ['id'],
        });
        orderIdArray = orderIdArray.map((order) => order.id);
        options.store_id = shop.id;
        options.review_status = '0';
        options.is_review = '0';
        options.order_id = orderIdArray;
        let lineItemsData = await db.OrderItems.findAll({
          where: options,
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
        for (let item of lineItemsData) {
          let order = item.order;
          // data == {customer_id,order_items:[{line_items_id,product_id,review_status}]}
          if (order.customer_email) {
            let tempCheck = false;
            if (
              value.orderStatus == 'delivered' &&
              item.shipment_status == 'delivered'
            )
              tempCheck = true;
            if (
              value.orderStatus == 'fulfilled' &&
              item.fulfillment_status == 'fulfilled'
            )
              tempCheck = true;
            tempCheck = true;
            if (tempCheck) {
              let orderData = lineItemsData.filter((element) => {
                return (
                  item.order_id == element.order_id &&
                  item.isSelected == undefined
                );
              });
              if (orderData.length < 1) continue;
              let notReviewedItems = [];
              orderData.map((item) => {
                item.isSelected = true;
                notReviewedItems.push({
                  line_item_id: item.line_item_id,
                  product_id: item.product_id,
                  review_status: item.review_status,
                });
              });
              if (notReviewedItems.length > 0) {
                let data = {
                  store_id: shop.id,
                  shop: shop.username,
                  type: 'review_request_cron',
                  domain: shop.main_domain || shop.domain,
                  customer_id: order.customer_id,
                  order_name: order.order_name,
                  order_id: order.order_id,
                  orderId: order.id,
                  order_items: notReviewedItems,
                  store: shop,
                };
                console.log('review request cron  data==>', {
                  ...data,
                  store: 'skipped store',
                });
                let returnResp = await reviewRequestFunc(data);
                if (returnResp.error)
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

exports.reviewRequestReminderEmail = async () => {
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

/////////////////////////////////////////////////

// exports.reviewRequestReminderEmail = async () => {
//   try {
//     // console.log("review request email reminder cron");
//     let reviewSettingData = await db.ReviewSetting.findOne({
//       where: {
//         store_id: null,
//         key: "review_request_email_reminder",
//       },
//     });
//     let storeData = await db.Store.findAll({
//       where: {
//         is_uninstalled: "0",
//         email_enable: "1",
//       },
//       include: {
//         model: db.ReviewSetting,
//         required: false,
//         where: {
//           key: "review_request_email_reminder",
//         },
//       },
//     });
//     for (let store of storeData) {
//       let notReviewSend = null;
//       if (!store.review_settings.length > 0) {
//         store.review_settings.push(reviewSettingData);
//       }
//       let reviewSetting = store.review_settings[0];
//       let value = JSON.parse(reviewSetting.value);
//       if (value.emailReminderTiming >= 0) {
//         let orderItems = await db.OrderItems.findAll({
//           where: {
//             store_id: store.id,
//             review_status: "1",
//             is_review: "0",
//             email_reminder_count: {
//               [Op.lt]: value.emailReminderCount,
//             },
//           },
//           include: {
//             model: db.Order,
//             attributes: [
//               "id",
//               "customer_id",
//               "order_name",
//               "customer_email",
//               "order_id",
//             ],
//           },
//         });
//         let date = moment()
//           .subtract(value.emailReminderTiming, "days")
//           .toDate();
//         date = moment(date).format("YYYY-MM-DD");
//         //  console.log("date=>>>", date);
//         for (let item of orderItems) {
//           let orderData = item.order;
//           console.log("orderDataorderData", orderData);
//           if (notReviewSend) {
//             console.log("notReviewSend==>", notReviewSend);
//             if (notReviewSend.order_id == item.order_id) {
//               let orderItem = checkItem(date, item,value.emailReminderTiming);
//               if (orderItem) {
//                 notReviewSend.order_items.push(orderItem);
//               }
//               continue;
//             } else {
//               let returnResp = await reviewRequestFunc(notReviewSend);
//               if (returnResp.error)
//                 throw new CustomError(500, "Error to send email");
//               notReviewSend = null;
//               let orderItem = checkItem(date, item,value.emailReminderTiming);
//               if (orderItem) {
//                 notReviewSend = insertOrderData(orderData, store);
//                 notReviewSend.order_items = [orderItem];
//               }
//               continue;
//             }
//           } else {
//             let orderItem = checkItem(date, item,);
//             console.log("inside elseee",orderItem);
//             if (orderItem) {
//               notReviewSend = insertOrderData(orderData, store);
//               notReviewSend.order_items = [orderItem];
//             }
//             continue;
//           }
//         }
//         if (notReviewSend) {
//           let returnResp = await reviewRequestFunc(notReviewSend);
//           if (returnResp.error)
//             throw new CustomError(500, "Error to send email");
//           notReviewSend = null;
//         }
//       }
//     }
//   } catch (error) {
//     console.log("Error to send review request email send=>>", error);
//     throw error;
//   }
// };

// const checkItem = (date, item,emailReminderTiming) => {
//   let object = null;
//   try {
//     let mailSendDate;
//     if (item.email_reminder_count > 0) {
//       mailSendDate = moment(item.email_reminder_date).format("YYYY-MM-DD");
//     } else {
//       mailSendDate = moment(item.email_sent_date).format("YYYY-MM-DD");
//     }
//     const currentDate = moment();
//     const lastEmailDate = item.email_reminder_count > 0
//     ? moment(item.email_reminder_date)
//     : moment(item.email_sent_date);
//   // Calculate days elapsed since last email
//   const daysElapsed = currentDate.diff(lastEmailDate, 'days');

//     if (date == mailSendDate || daysElapsed>=emailReminderTiming) {
//       object = {
//         line_item_id: item.line_item_id,
//         product_id: item.product_id,
//         review_status: "0",
//         email_reminder_count: item.email_reminder_count,
//       };
//     }
//     return object;
//   } catch (error) {
//     console.log("checkItem error", error);
//     return object;
//   }
// };
// const insertOrderData = (order, shop) => {
//   try {
//     let orderObject = {
//       store: shop,
//       store_id: shop.id,
//       order_id: order.order_id,
//       orderId: order.id,
//       shop: shop.username,
//       domain: shop.main_domain || shop.domain,
//       customer_id: order.customer_id,
//       order_name: order.order_name,
//       type: "review_request_reminder_cron",
//     };
//     return orderObject;
//   } catch (error) {
//     console.log("insertOrderData error", error);
//     throw error;
//   }
// };
