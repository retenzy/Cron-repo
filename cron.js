const cron = require('node-cron');
const { creditLogsData } = require('../controllers/Merchant/credit-controller');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const {
  checkPlan,
  createUsageCharges,
  updateBillingDatesForPaidStores,
} = require('../controllers/Merchant/pricePlan-controller');
const helper = require('../helper/app-helper');
const {
  reviewRequestMailSend,
  reviewRequestReminderEmail,
} = require('../controllers/Merchant/review-request-cron');
const {
  checkExtensionStatus,
  checkForFile,
} = require('../controllers/Merchant/codeInstallUninstall-controller');
const CONFIG = require('../config');
// const { refreshToken } = require("../controllers/auth-controller");

const { parse } = require('json2csv');
const sgMail = require('@sendgrid/mail');
const { generateXML } = require('../helper/productReviewService');
const config = require('../config');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const { default: axios } = require('axios');
const {
  callGraphqlQuery,
} = require('../controllers/bulkOpration/bulkOpration-controller');
const {
  RewardPointEmail,
  sendExpiryEmails,
  rewardExpiryReminderEmail,
} = require('../controllers/Merchant/redeem-rules-controller');

const {
  creditExpiryReminderEmail,
} = require('./jobs/credit-reminder.job');

let defaultClient = SibApiV3Sdk.ApiClient.instance;

const Sentry = require('@sentry/node');
const {
  expireCoupons,
} = require('../controllers/Customer/discount_code-controller');
// Instrument the node-cron library with Sentry
const cronWithCheckIn = Sentry.cron.instrumentNodeCron(cron);
// // Schedule a task with Sentry monitoring
// cronWithCheckIn.schedule(
//   "* * * * *", // Run every minute
//   () => {
//     console.log("Running a task every minute");
//     // Your task logic here
//   },
//   {
//     name: "my-cron-job", // Unique name for the monitor
//     timezone: "Asia/Kolkata", // Optional: Specify timezone
//   }
// );

module.exports = () => {
  // cron.schedule('0 0 * * *', async function () {
  //   try {
  //     const stores = await db.Settings.findAll({
  //       where: { key: 'point_expiry' },
  //     });

  //     for (const store of stores) {
  //       const storeId = store.store_id;
  //       let config;

  //       try {
  //         config = JSON.parse(store.value);
  //       } catch (err) {
  //         continue;
  //       }

  //       if (!config || config.active !== 1) {
  //         continue;
  //       }

  //       const monthsToExpire = Number(config.time);
  //       const expiryCutoffDate = moment()
  //         .subtract(monthsToExpire, 'months')
  //         .format('YYYY-MM-DD');

  //       const creditUsers = await db.CreditLogs.findAll({
  //         where: {
  //           store_id: storeId,
  //           created_at: { [Op.lt]: expiryCutoffDate },
  //           is_expired: '0',
  //           action_type: ['credit', 'redeem'],
  //         },
  //         attributes: ['customer_credit_id', 'customer_email'],
  //         group: ['customer_credit_id', 'customer_email'],
  //       });

  //       for (const user of creditUsers) {
  //         const userId = user.customer_credit_id;

  //         const avilablePoints = await db.CreditLogs.sum('credit', {
  //           where: {
  //             store_id: storeId,
  //             customer_credit_id: userId,
  //           },
  //         });

  //         if (avilablePoints > 0) {
  //           await db.CreditLogs.create({
  //             store_id: storeId,
  //             customer_credit_id: userId,
  //             customer_email: user.customer_email,
  //             credit: -Number(avilablePoints),
  //             available: -Number(avilablePoints),
  //             is_expired: 1,
  //             expiry_date: null,
  //             action_type: 'expired',
  //             comment: `Expired ${avilablePoints} point(s) `,
  //             is_email_send: 1,
  //             created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  //           });
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.log('error', err);
  //   }
  // });

  cronWithCheckIn.schedule(
    '0 0 * * *',
    async function () {
      try {
        const BATCHSIZE = 100;
        const stores = await db.Settings.findAll({
          where: { key: 'point_expiry' },
        });

        for (const store of stores) {
          const storeId = store.store_id;
          let config;

          try {
            config = JSON.parse(store.value);
          } catch (err) {
            continue;
          }

          if (!config || config.active !== 1) {
            continue;
          }

          const monthsToExpire = Number(config.time);
          const expiryCutoffDate = moment()
            .subtract(monthsToExpire, 'months')
            .format('YYYY-MM-DD');

          const creditUsers = await db.CreditLogs.findAll({
            where: {
              store_id: storeId,
              created_at: { [Op.lt]: expiryCutoffDate },
              is_expired: '0',
              action_type: ['credit', 'redeem'],
            },
            attributes: ['customer_credit_id', 'customer_email'],
            group: ['customer_credit_id', 'customer_email'],
          });

          // ✅ Process in batches of 100
          for (let i = 0; i < creditUsers.length; i += BATCHSIZE) {
            const batch = creditUsers.slice(i, i + BATCHSIZE);

            await Promise.all(
              batch.map(async (user) => {
                const userId = user.customer_credit_id;

                const availablePoints = await db.CreditLogs.sum('credit', {
                  where: {
                    store_id: storeId,
                    customer_credit_id: userId,
                  },
                });

                if (availablePoints > 0) {
                  const x = await db.CreditLogs.create({
                    store_id: storeId,
                    customer_credit_id: userId,
                    customer_email: user.customer_email,
                    credit: -Number(availablePoints),
                    available: -Number(availablePoints),
                    is_expired: 1,
                    expiry_date: null,
                    action_type: 'expired',
                    comment: `Expired ${availablePoints} point(s)`,
                    is_email_send: 1,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                  });
                  console.log('x', x);
                }
              })
            );
          }
        }
      } catch (err) {
        console.log('❌ Error in point expiry cron:', err);
      }
    },
    {
      name: 'point-expiry-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  cronWithCheckIn.schedule(
    '0 0 * * *',
    async () => {
      try {
        await creditExpiryReminderEmail();
      } catch (error) {
        console.error('Error in daily cron:', error);
      }
    },
    {
      name: 'credit-expiration-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  // birthday credit cron
  cronWithCheckIn.schedule(
    '0 0 * * *',
    async function () {
      try {
        let date = moment(new Date()).format('DD');
        let month = moment(new Date()).format('MM');
        let creditRulesResp = await db.CreditRules.findOne({
          where: { rule_type: 'birthday', is_active: '1' },
        });
        let shop = await db.Store.findOne({
          where: { id: creditRulesResp.store_id },
        });
        if (creditRulesResp) {
          let customerData = await db.sequelize.query(
            `select * from customers where DAY(date_of_birth) = ${date} and MONTH(date_of_birth) = ${month}`,
            { type: QueryTypes.SELECT }
          );
          for (let i = 0; i < customerData.length; i++) {
            creditLogsData(
              shop,
              creditRulesResp.id,
              customerData[i].customer_id
            );
          }
        }
      } catch (error) {
        console.log('cron for birthday credits Error==>>', error);
      }
    },
    {
      name: 'birthday-credit-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  \
  // SignUp aniversary reward
  cronWithCheckIn.schedule(
    '0 1 * * *',
    async function () {
      try {
        let date = moment(new Date()).format('DD');
        let month = moment(new Date()).format('MM');
        let creditRulesResp = await db.CreditRules.findOne({
          where: { rule_type: 'anniversary', is_active: '1' },
        });
        if (creditRulesResp) {
          let shop = await db.Store.findOne({
            where: { id: creditRulesResp.store_id },
          });
          let customerData = await db.sequelize.query(
            `select * from customers where DAY(created_at) = ${date} and MONTH(created_at) = ${month}`,
            { type: QueryTypes.SELECT }
          );
          for (let i = 0; i < customerData.length; i++) {
            creditLogsData(
              shop,
              creditRulesResp.id,
              customerData[i].customer_id
            );
          }
        }
      } catch (error) {
        console.log('cron for signup aniversary credits Error==>>', error);
      }
    },
    {
      name: 'signup-anniversary-credit-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  // deals cron
  cronWithCheckIn.schedule(
    '*/10 * * * *',
    async function () {
      try {
        const currentDate = moment().format('YYYY-MM-DD');

        let endDeals = await db.Offers.findAll({
          where: {
            // end_date: {
            //   [Op.lte]: currentDate,
            // },
            store_id: {
              [Op.ne]: null,
            },
            is_active: ['1', '2'],
          },
          include: {
            model: db.Store,
            attributes: ['id', 'iana_timezone'],
          },
        });

        // console.log("End deals:", endDeals)

        if (endDeals.length > 0) {
          for (let i = 0; i < endDeals.length; i++) {
            const store = endDeals[i].store;
            // console.log("Store:", store)
            const storeTimezone = store.iana_timezone;
            const currentTimeInStoreTimezone = momentTimezone()
              .tz(storeTimezone)
              .format('HH:mm');

            // console.log("Current time in store's timezone:", currentTimeInStoreTimezone);
            // console.log("Deal end time:", endDeals[i].end_time);

            if (
              endDeals[i].end_date < currentDate ||
              (endDeals[i].end_date === currentDate &&
                currentTimeInStoreTimezone >= endDeals[i].end_time)
            ) {
              await db.Offers.update(
                { is_active: '0' },
                { where: { id: endDeals[i].id } }
              );
              console.log('Deactivated deal:', endDeals[i].id);
            }

            if (
              endDeals[i].is_active != '1' &&
              (endDeals[i].start_date < currentDate ||
                (endDeals[i].start_date === currentDate &&
                  currentTimeInStoreTimezone >= endDeals[i].start_time))
            ) {
              await db.Offers.update(
                { is_active: '1' },
                { where: { id: endDeals[i].id } }
              );
              console.log('Deactivated deal22:', endDeals[i].id);
            }
          }
        }
      } catch (error) {
        console.log('Cron job for offer error:', error);
      }
    },
    {
      name: 'offer-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //shopify upsell
  cronWithCheckIn.schedule(
    '0 2 * * *',
    async function () {
      try {
        await createUsageCharges();
        await updateBillingDatesForPaidStores();
      } catch (error) {
        console.log('Error to cron for limit reached error=>>', error.message);
      }
    },
    {
      name: 'shopify-upsell-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //review request  mail send
  cronWithCheckIn.schedule(
    '0 6 * * *',
    async function () {
      try {
        await reviewRequestMailSend();
      } catch (error) {
        console.log('Error to send review request email send=>>', error);
      }
    },
    {
      name: 'review-request-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //review request reminder mail send
  cronWithCheckIn.schedule(
    '0 7 * * *',
    async function () {
      try {
        await reviewRequestReminderEmail();
      } catch (error) {
        console.log(
          'Error to send review request reminder email send=>>',
          error
        );
      }
    },
    {
      name: 'review-request-reminder-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  // cronWithCheckIn.schedule('0 0 * * *', async () => {
  //   try {
  //     await rewardExpiryReminderEmail();
  //   } catch (error) {
  //     console.error('Error in daily cron:', error);
  //   }
  // },{
  //   name: 'reward-expiry-reminder-cron', // Unique name for the monitor
  //   timezone: 'Asia/Kolkata', // Optional: Specify timezone
  // });

  async function addCustomerToMailList(emailId, list_Id) {
    try {
      let apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = config.brevo.api_key;

      let apiInstance = new SibApiV3Sdk.ContactsApi();
      const contactData = await apiInstance.getContactInfo(emailId);
      const existingLists = contactData.listIds || [];
      if (existingLists.includes(list_Id)) {
        console.log('User already exists in the list.');
        return { success: false, message: 'User already in the list' };
      }
      let listId = list_Id;
      console.log('listId', listId);

      let contactEmails = new SibApiV3Sdk.AddContactToList();

      contactEmails.emails = [emailId];
      console.log('contactEmails.emails', contactEmails.emails);

      apiInstance.addContactToList(listId, contactEmails).then(
        function (data) {
          console.log(
            'API called successfully. Returned data: ' + JSON.stringify(data)
          );
        },
        function (error) {
          console.error(error);
        }
      );
    } catch (error) {
      console.log('error: ', error);
    }
  }

  //Extesnion enable mail cron after 7 days
  cronWithCheckIn.schedule(
    '0 12 * * *',
    async function () {
      try {
        // Fetch stores that were created in the last 7 days
        console.log('inside cron');
        let sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Change to 7 days

        let stores = await db.Store.findAll({
          where: {
            created_at: {
              [Op.gte]: sevenDaysAgo, // Get stores created after 7 days ago
            },
            is_uninstalled: '0',
          },
          attributes: ['id', 'domain', 'token', 'email'], // Ensure you have the required attributes
        });

        console.log('stores:', stores);

        for (let store of stores) {
          // Fetch the published theme ID for each store from the installedTheme table
          let installedTheme = await db.installedTheme.findOne({
            where: { store_id: store.id },
            attributes: ['published_theme_id'],
          });

          // Skip if no published theme is found
          if (!installedTheme || !installedTheme.published_theme_id) {
            console.log(`No published theme found for store ${store.id}`);
            continue;
          }

          const domain = store.domain;
          const token = store.token;
          const themeId = installedTheme.published_theme_id;

          try {
            // Fetch settings_data.json and templates/product.json
            const settingsData = await checkForFile(
              domain,
              token,
              themeId,
              'config/settings_data'
            );
            const productsExtensionData = await checkForFile(
              domain,
              token,
              themeId,
              'templates/product'
            );

            const settingsJson = JSON.parse(settingsData.value);
            const productJson = JSON.parse(productsExtensionData.value);
            const productSections = productJson.sections;
            const blocks = settingsJson.current.blocks;

            let extensionsStatus = {
              appEmbeds: {
                customerDashboard: false,
                rewardWidget: false,
              },
              blockExtensions: {
                productReview: false,
                productRating: false,
              },
            };

            console.log('extension status:', extensionsStatus);
            // Check app embed extensions for customer dashboard and reward widget
            for (const blockId in blocks) {
              const block = blocks[blockId];
              if (
                block.type.includes(
                  `shopify://apps/${CONFIG.extension.app_name}/blocks/DashboardExtension`
                )
              ) {
                extensionsStatus.appEmbeds.customerDashboard = !block.disabled;
              }
              if (
                block.type.includes(
                  `shopify://apps/${CONFIG.extension.app_name}/blocks/WidgetExtension`
                )
              ) {
                extensionsStatus.appEmbeds.rewardWidget = !block.disabled;
              }
            }

            // Check ProductRating blocks
            const productBlocks = productJson.sections.main.blocks;
            for (const blockId in productBlocks) {
              const block = productBlocks[blockId];
              if (
                block.type.includes(
                  `shopify://apps/${CONFIG.extension.app_name}/blocks/ProductRating`
                )
              ) {
                extensionsStatus.blockExtensions.productRating = true;
                break;
              }
            }

            // Check ProductReview blocks
            for (const sectionId in productSections) {
              const section = productSections[sectionId];
              if (section.type === 'apps') {
                const sectionBlocks = section.blocks;
                for (const blockId in sectionBlocks) {
                  const block = sectionBlocks[blockId];
                  if (
                    block.type.includes(
                      `shopify://apps/${CONFIG.extension.app_name}/blocks/ProductReview`
                    )
                  ) {
                    extensionsStatus.blockExtensions.productReview = true;
                    break;
                  }
                }
              }
            }

            // Now, push the customer to the list if any extension is disabled
            const isAnyExtensionDisabled =
              !extensionsStatus.appEmbeds.customerDashboard ||
              !extensionsStatus.appEmbeds.rewardWidget ||
              !extensionsStatus.blockExtensions.productReview ||
              !extensionsStatus.blockExtensions.productRating;

            if (isAnyExtensionDisabled) {
              console.log(
                `Pushing customer with email ${store.email} to the mailing list.`
              );

              try {
                await addCustomerToMailList(store.email, 11);
                console.log(`Mail sent to ${store.email} for upgrading plan`);
              } catch (error) {
                console.error(
                  'Error adding subscriber:',
                  error.response ? error.response.data : error.message
                );
              }
            } else {
              console.log(
                `No disabled extensions for customer with email ${store.email}.`
              );
            }
          } catch (error) {
            console.error(
              `Error checking extension status for store ${store.id}:`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error('Error running extension status cron job:', error);
      }
    },
    {
      name: 'extension-status-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //Pricing plan upgrade mail cron after 14 days
  cronWithCheckIn.schedule(
    '0 13 * * *',
    async function () {
      try {
        console.log('Checking stores for pricing plan...');
        let fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        let stores = await db.Store.findAll({
          where: {
            created_at: {
              [Op.lte]: fourteenDaysAgo, // Get stores created on or before 14 days ago
            },
            is_uninstalled: '0',
          },
          attributes: ['id', 'domain', 'token', 'email', 'pricing_plan_id'],
        });

        for (let store of stores) {
          if (store.pricing_plan_id == 208) {
            try {
              await addCustomerToMailList(store.email, 9);
              console.log(`Mail sent to ${store.email} for upgrading plan`);
            } catch (error) {
              console.error(
                'Error adding subscriber:',
                error.response ? error.response.data : error.message
              );
            }
          }
        }
      } catch (error) {
        console.error('Error running pricing plan check cron job:', error);
      }
    },
    {
      name: 'pricing-plan-check-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //google shopping integration
  cronWithCheckIn.schedule(
    '0 1 * * 0',
    async function () {
      try {
        const integrations = await db.Integration.findAll({
          where: { app: 'google' },
          include: [
            {
              model: db.Store,
              where: {
                is_uninstalled: { [Op.ne]: '1' },
                is_test_store: { [Op.ne]: '1' },
              },
            },
          ],
        });

        for (let integration of integrations) {
          let store = integration.store;
          const xml = await generateXML(store);
          // const uploadResult = await uploadXmlToS3(xml, store.username);
        }
      } catch (error) {
        console.log('error in rebview crom', error);
        return false;
      }
    },
    {
      name: 'google-shopping-integration-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  //sync not yet by us products
  // cron.schedule("*/19 * * * *", async () => {
  //   try {
  //     console.log("cron run every min");
  //     let store = {
  //       domain: "notyet-0305.myshopify.com",
  //       token:
  //         "b4051ecc5967daa89f9fb501ae8f29c1bf38a23448af0804ea7b8cd12de25c5784c78274a0f486f7dccde3aa0fe627a59da368d068d4575e5ee4ed7ee62ec1de9f152d6184db116d6d5547ecfbc2e66ee9b2014f7a3a7e767e4016ebeb3425828244f0ff91c8e6e38154fc4776f714c621038b63d58e2e5ee5129b1be4e913cac2daba23b0e9",
  //       id: 740,
  //     };
  //     let sequence = ["product_sync"];
  //     await callGraphqlQuery(store, sequence);
  //   } catch (error) {
  //     console.log("error in graphql query in cron", error);
  //   }
  // });

  // For sending merchant data on email on every monday at 7 am
  // cron.schedule("0 7 * * 1", async function () {
  //   try {
  //     let eightDaysAgo = new Date();
  //     eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  //     let stores = await db.Store.findAll({
  //       where: {
  //         created_at: {
  //           [Op.gte]: eightDaysAgo, // Get stores created on or before 8 days ago
  //         },
  //       },
  //       attributes: [
  //         "username",
  //         "email",
  //         "phone",
  //         "domain",
  //         "main_domain",
  //         "shop_owner",
  //         "country",
  //         "currency",
  //         "pricing_plan_id",
  //       ],
  //       order: [["created_at", "DESC"]],
  //     });
  //     // console.log("stores data ", stores);

  //     let buffer;
  //     const fields = [
  //       {
  //         label: "username",
  //         value: "username",
  //       },
  //       {
  //         label: "email",
  //         value: "email",
  //       },
  //       {
  //         label: "phone",
  //         value: "phone",
  //       },
  //       {
  //         label: "domain",
  //         value: "domain",
  //       },
  //       {
  //         label: "main_domain",
  //         value: "main_domain",
  //       },
  //       {
  //         label: "shop_owner",
  //         value: "shop_owner",
  //       },
  //       {
  //         label: "country",
  //         value: "country",
  //       },
  //       {
  //         label: "currency",
  //         value: "currency",
  //       },
  //       {
  //         label: "pricing_plan_id",
  //         value: "pricing_plan_id",
  //       },
  //     ];

  //     const opts = { fields };

  //     buffer = parse(stores, opts);
  //     console.log("bufferbufferbuffer", buffer);

  //     try {
  //       let sendGridData = await db.Integration.findOne({
  //         where: { store_id: null, app: "sendgrid" },
  //       });
  //       if (sendGridData) {
  //         let key = JSON.parse(helper.decrypt(sendGridData.credential));
  //         console.log("keykey", key);
  //         sgMail.setApiKey(key);

  //         const template = {
  //           to: `support@retenzy.com`,
  //           from: `Vital <${CONFIG.EMAIL.SENDERMAIL}>`,
  //           subject: `Vital New Customers List`,
  //           text: "List Of Customer whose install vital app in last 8 days.",
  //           attachments: [
  //             {
  //               content: Buffer.from(buffer).toString("base64"),
  //               filename: "Vital-CustomerData.csv",
  //               type: "text/csv",
  //               disposition: "attachment",
  //             },
  //           ],
  //         };
  //         let response = await sgMail.send(template);
  //         console.log("responce done");
  //         if (response.error)
  //           throw new CustomError(500, response.error.response.body);
  //       }
  //       return true;
  //     } catch (error) {
  //       console.log("error", error);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error("Error running pricing plan check cron job:", error);
  //   }
  // });

  cronWithCheckIn.schedule(
    '0 0 1 * *',
    async function () {
      helper.sendReport('monthly');
    },
    {
      name: 'monthly-report-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  cronWithCheckIn.schedule(
    '0 9 * * 1',
    async function () {
      helper.sendReport('weekly');
    },
    {
      name: 'weekly-report-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );

  cronWithCheckIn.schedule(
    '*/30 * * * *',
    // '* * * * *',
    async function () {
      await expireCoupons();
    },
    {
      name: 'coupon-expire-cron', // Unique name for the monitor
      timezone: 'Asia/Kolkata', // Optional: Specify timezone
    }
  );
};

// created cron for update status of is_unistalled
// let uninstalledStores = [];
// let closeStores = [];
// cron.schedule("* 2 * * *", async function () {
//   try {
//     console.log("cron started");
//     const storeData = await db.Store.findAll({
//       attributes: ["id", "domain", "token", "username"],
//       limit: 50,
//       offset:350
//     });
//     for (let store of storeData) {
//       const { domain, token } = store;
//       try {
//         const response = await axios.get(
//           `https://${domain}/admin/api/2023-01/shop.json`,
//           {
//             headers: {
//               "X-Shopify-Access-Token": helper.decrypt(token),
//             },
//           }
//         );
//         // If the response is successful, the store is still valid
//         // console.log(`Store ${domain} is valid.`, response);
//       } catch (error) {
//         // If the request fails, check the status code
//         let data = {
//           id: store.id,
//           username: store.username,
//           domain: store.domain,
//         };
//         if (error.response && error.response.status === 401) {
//           // console.log(`Store ${domain} has uninstalled the app.`);
//           uninstalledStores.push(data);
//           // await db.Store.update(
//           //   { email_enable: "0", is_uninstalled: "1" },
//           //   { where: { id: store.id } }
//           // );
//         } else {
//           // console.error(`Error checking store ${domain}:`, error.message);
//           closeStores.push(data);
//         }
//       }
//     }
//     // console.log("uninstalledStores", uninstalledStores);
//     // console.log("ClosedStores", closeStores);
//     console.log("uninstalledStores length", uninstalledStores.length);
//     console.log("ClosedStores length", closeStores.length);
//   } catch (error) {
//     console.log("error in store crom", error);
//   }
// });
/////////////////////////////////////////////
