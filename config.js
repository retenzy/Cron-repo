const dotenv = require('dotenv');
dotenv.config();
let ENVIRONMENT = process.env.ENVIRONMENT;
dotenv.config({
  path: `.env.${ENVIRONMENT}`
});
console.log(
  process.env.JWT_TOKEN,

)
module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  JWT_TOKEN: process.env.JWT_TOKEN,
  shopify: {
    api_key: process.env.api_key,
    secret_key: process.env.secret_key,
    redirect_url: process.env.redirect_url,
    offline_redirect_url: process.env.offline_redirect_url,
    scopes: process.env.scopes,
    private_app_scopes: process.env.private_app_scopes,
    appUrl: process.env.appUrl,
    platform_url: process.env.platform_url,
    webhookUrl: process.env.webhookUrl,
    api_version: process.env.api_version,
    privateWebhookUrl: process.env.privateWebhookUrl,
  },
  CUSTOM_PLAN: {
    mail_id: process.env.mail_id,
  },
  script_urls: {
    review: process.env.review,
    rating: process.env.rating,
  },
  redis: {
    url: process.env.cache_db_url,
  },
  database: {
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    db: process.env.db_name,
    dialect: process.env.db_dialect,
    logging: process.env.db_logging,
    pool: {
      max: 10,
      min: 0,
      acquire: 10000,
      idle: 10000,
    },

    // pool: {
    //   max: 5,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
  },
  redis: {
    url: process.env.cache_db_url,
  },
  defaultImage: process.env.defaultImage,
  KLAVIYO: {
    klaviyo_url: process.env.klaviyoUrl,
  },
  EMAIL: {
    SENDERMAIL: process.env.EMAIL,
    SUPPORTMAIL: process.env.SUPPORTEMAIL,
    BCC_MAIL: process.env.BCC_MAIL,
  },
  CUSTOM_PLAN: {
    mail_id: process.env.contact_mail_id,
    cc_mail_id: process.env.cc_mail_id,
  },
  orderfloAPI: {
    url: process.env.url,
    username: process.env.user_name,
    password: process.env.customer_password,
  },
  AWS: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    bucket: process.env.BUCKET,
  },
  sendgrid: {
    apikey: process.env.SENDGRID_API_KEY,
  },
  script_urls: {
    review: process.env.review,
    rating: process.env.rating,
  },
  brevo: {
    api_key: process.env.BREVO_API_KEY,
    install_list_id: process.env.INSTALL_LIST_ID,
    platform_list_id: process.env.PLATFORM_LIST_ID,
  },
  shofii: {
    shofi_api_key: process.env.shofi_api_key,
  },
  oxylabs: {
    username: process.env.OXYLAB_USERNAME,
    password: process.env.OXYLAB_PASSWORD,
  },
  FIRST_PROMOTER_API_KEY: process.env.FIRST_PROMOTER_API_KEY,
  cryptrPassword: process.env.cryptr_password,
  cryptoPassword: process.env.crypto_password,
  extension: {
    extension_id: process.env.extension_id,
    app_name: process.env.app_name,
  },
  review_widget_script: process.env.review_widget_script,
  rating_widget_script: process.env.rating_widget_script,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
};
