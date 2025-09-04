/* cron-setup.js */

// Cron wrapper
const cronWithCheckIn = require("./lib/cron-wrapper");

// Job imports
const pointsExpiryJob = require("./jobs/points-expiry.job");
const { creditExpiryReminderEmail } = require("./jobs/credit-reminder.job");
const birthdayJob = require("./jobs/birthday-credit.job");
const anniversaryJob = require("./jobs/anniversary-credit.job");
const shopifyUpsellJob = require("./jobs/shopify-upsell.job");
const { reviewRequestMailSend } = require("./jobs/review-mail.job");
const { reviewRequestReminderEmail } = require("./jobs/review-reminder.job");
const extensionStatusJob = require("./jobs/extension-status.job");
const { pricingPlanJob } = require("./jobs/pricing-plan.job");
const googleFeedJob = require("./jobs/google-shopping.job");
const { expireCoupons } = require("./jobs/coupon-expiry.job");
const reportJob = require("./jobs/report.job");

// Setup cron jobs
function setupCrons() {
  // Daily at 12:00 AM
  cronWithCheckIn.schedule("0 11 * * *", pointsExpiryJob, {
    name: "point-expiry-cron",
    timezone: "Asia/Kolkata",
  });

  cronWithCheckIn.schedule("0 12 * * * ", creditExpiryReminderEmail, {
    name: "credit-expiration-cron",
    timezone: "Asia/Kolkata",
  });

  cronWithCheckIn.schedule("0 13 * * *", birthdayJob, {
    name: "birthday-credit-cron",
    timezone: "Asia/Kolkata",
  });

  // Daily at 1:00 AM
  cronWithCheckIn.schedule("0 14 * * *", anniversaryJob, {
    name: "signup-anniversary-credit-cron",
    timezone: "Asia/Kolkata",
  });

  // Every 10 minutes
  // cronWithCheckIn.schedule('*/10 * * * *', offerJob,                    { name: 'offer-cron', timezone: 'Asia/Kolkata' });

  // Daily at 2:00 AM
  cronWithCheckIn.schedule("0 00 * * *", shopifyUpsellJob, {
    name: "shopify-upsell-cron",
    timezone: "Asia/Kolkata",
  });

  // Daily at 6:00 AM
  cronWithCheckIn.schedule("0 16 * * *", reviewRequestMailSend, {
    name: "review-request-cron",
    timezone: "Asia/Kolkata",
  });

  // Daily at 7:00 AM
  cronWithCheckIn.schedule("0 17 * * *", reviewRequestReminderEmail, {
    name: "review-request-reminder-cron",
    timezone: "Asia/Kolkata",
  });

  // Daily at 12:10 PM
  cronWithCheckIn.schedule("10 12 * * *", extensionStatusJob, {
    name: "extension-status-cron",
    timezone: "Asia/Kolkata",
  });

  // Daily at 12:00 AM
  cronWithCheckIn.schedule("0 00 * * *", pricingPlanJob, {
    name: "pricing-plan-check-cron",
    timezone: "Asia/Kolkata",
  });

  // Weekly on Sunday at 1:00 AM
  cronWithCheckIn.schedule("0 1 * * 0", googleFeedJob, {
    name: "google-shopping-integration-cron",
    timezone: "Asia/Kolkata",
  });

  // Monthly on 1st at 12:00 AM
  cronWithCheckIn.schedule("0 0 1 * *", () => reportJob("monthly"), {
    name: "monthly-report-cron",
    timezone: "Asia/Kolkata",
  });

  // Weekly on Monday at 9:00 AM
  cronWithCheckIn.schedule("0 9 * * 1", () => reportJob("weekly"), {
    name: "weekly-report-cron",
    timezone: "Asia/Kolkata",
  });

  // Every 30 minutes
  cronWithCheckIn.schedule("*/30 * * * *", expireCoupons, {
    name: "coupon-expire-cron",
    timezone: "Asia/Kolkata",
  });
}

// Start all cron jobs
setupCrons();

// async function runAllCronsSequentially() {
//   const jobs = [
//     { name: 'point-expiry-cron',              fn: pointsExpiryJob },
//     { name: 'credit-expiration-cron',         fn: creditExpiryReminderEmail },
//     { name: 'birthday-credit-cron',           fn: birthdayJob },
//     { name: 'signup-anniversary-credit-cron', fn: anniversaryJob },
//     { name: 'shopify-upsell-cron',            fn: shopifyUpsellJob },
//     { name: 'review-request-cron',            fn: reviewRequestMailSend },
//     { name: 'review-request-reminder-cron',   fn: reviewRequestReminderEmail },
//     { name: 'extension-status-cron',          fn: extensionStatusJob },
//     { name: 'pricing-plan-check-cron',        fn: pricingPlanJob },
//     { name: 'google-shopping-integration-cron', fn: googleFeedJob },
//     { name: 'coupon-expire-cron',             fn: expireCoupons },
//     { name: 'monthly-report-cron',            fn: () => reportJob('monthly') },
//     { name: 'weekly-report-cron',             fn: () => reportJob('weekly') },
//   ];

//   for (const job of jobs) {
//     try {
//       console.log(`🟡 Starting job: ${job.name}`);
//       await job.fn(); // If job is async
//       console.log(`✅ Finished job: ${job.name}\n`);
//     } catch (error) {
//       console.error(`❌ Error in job: ${job.name}`, error);
//     }
//   }

//   console.log('🎉 All jobs completed.');
// }

// Immediately run
// runAllCronsSequentially();
// shopifyUpsellJob()
