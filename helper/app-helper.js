const CustomError = require('./errors/CustomError');
const Cryptr = require('cryptr');
const CONFIG = require('../config');
const db = require('../models');
const sgMail = require('@sendgrid/mail');
const { defaultImage } = require('../config');
const moment = require('moment');
const algorithm = 'aes-256-ctr';
const fetch = require('node-fetch');
const axios = require('axios');
const mailchimp = require('@mailchimp/mailchimp_marketing');
let klaviyo_url = CONFIG.KLAVIYO.klaviyo_url;
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const insertEmailLogs = async ({
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

exports.getPagingData = (responseData, page, limit) => {
  const { count: total, rows: data } = responseData;
  const totalPage = Math.ceil(total / limit);
  return { page, limit, total, totalPage, data };
};

exports.cryptoEncryption = (message) => {
  try {
    const SALT = 'somethingrandom';
    const IV_LENGTH = 16;
    let key = crypto.pbkdf2Sync(
      CONFIG.cryptoPassword,
      SALT,
      10000,
      32,
      'sha512'
    );
    const NONCE_LENGTH = 5;
    let nonce = crypto.randomBytes(NONCE_LENGTH);
    let iv = Buffer.alloc(IV_LENGTH);
    nonce.copy(iv);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(message.toString());
    message = Buffer.concat([nonce, encrypted, cipher.final()]);
    let encryptedData = message.toString('hex');
    return encryptedData;
  } catch (error) {
    console.log(error);
    throw new CustomError(401, 'Unauthorized');
  }
};

exports.cryptoDecryption = (text) => {
  try {
    const SALT = 'somethingrandom';
    const IV_LENGTH = 16;
    let key = crypto.pbkdf2Sync(
      CONFIG.cryptoPassword,
      SALT,
      10000,
      32,
      'sha512'
    );
    const NONCE_LENGTH = 5;
    let message = Buffer.from(text, 'hex');
    let iv = Buffer.alloc(IV_LENGTH);
    message.copy(iv, 0, 0, NONCE_LENGTH);
    let encryptedText = message.slice(NONCE_LENGTH);
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.log(error);
    throw new CustomError(401, 'Unauthorized');
  }
};

exports.encrypt = (message) => {
  try {
    const cryptr = new Cryptr(CONFIG.cryptrPassword);
    const encryptedData = cryptr.encrypt(message);
    return encryptedData;
  } catch (error) {
    console.log(error);
    throw new CustomError(401, 'Unauthorized');
  }
};

exports.decrypt = (message) => {
  try {
    const cryptr = new Cryptr(CONFIG.cryptrPassword);
    const encryptedData = cryptr.decrypt(message);
    return encryptedData;
  } catch (error) {
    console.log(error);
    throw new CustomError(401, 'Unauthorized');
  }
};

exports.reviewDemoFile = async () => {
  let demoReviewArray = [
    {
      customer_email: 'test@gmail.com',
      customer_name: 'test',
      rating: 5,
      review: 'Awesome Product',
      handle: 'product Handle',
      status: 'published',
      source: 'imported',
      review_date: '2022-07-18T09:08:00',
      review_images:
        'https://thevital-production.s3.us-east-2.amazonaws.com/review-1706770903409-istockphoto-1304157246-612x612.jpg',
    },
    {
      customer_email: 'test2@gmail.com',
      customer_name: 'test2',
      rating: 4,
      review: 'Nice',
      handle: 'Second product Handle',
      status: 'hidden',
      source: 'imported',
      review_date: '2022-07-19T10:02:00',
      review_images:
        'https://thevital-production.s3.us-east-2.amazonaws.com/review-1663930859025-test.jpg',
    },
  ];
  return demoReviewArray;
};

exports.setReviewStatus = async (store_id, rating) => {
  let statusValue,
    status = 'hidden',
    reviewSettingResponse;
  try {
    reviewSettingResponse = await db.ReviewSetting.findOne({
      where: { store_id: store_id, key: 'review_publish_status' },
      attributes: ['value'],
    });
    if (!reviewSettingResponse) {
      reviewSettingResponse = await db.ReviewSetting.findOne({
        where: { store_id: null, key: 'review_publish_status' },
        attributes: ['value'],
      });
    }
    statusValue = JSON.parse(reviewSettingResponse.value).publishReviewStatus;

    if (statusValue == 'all') {
      status = 'published';
    } else if (statusValue != 'never') {
      if (statusValue <= rating) {
        status = 'published';
      }
    }
    return status;
  } catch (error) {
    console.log('error', error);
    return statusValue;
  }
};

// exports.GetStartEndDate = (start_date, end_date) => {
//   const start = new Date(start_date);
//   const end = new Date(end_date.concat("T23:59:59Z"));
//   return { start, end };
// };

exports.GetStartEndDate = (start_date, end_date) => {
  const start = new Date(start_date); // Start date as a JS Date object
  const end = new Date(end_date); // End date including time up to the given minute
  return { start, end };
};

exports.GetStartEndDateTimeZone = (start_date, end_date, timezone) => {
  let start = moment.tz(start_date, timezone).format();
  start = moment(start).utc();
  var end = moment.tz(end_date, timezone).endOf('days').format();
  end = moment(end).utc();
  return { start, end };
};

exports.pricingPlanErrorMessage = {
  plan_not_selected: `Currently you don't have any activated plan, Please choose your monthly recurring plan`,
  // plan_expriy_soon: `Your plan will be exprired soon, Please pay your monthly recurring plan`,
  plan_not_found: `We just found your plan get changed, Please choose your new monthly recurring plan`,
  plan_exprired: `Your plan got exprired, Please choose your monthly recurring plan`,
  order_limit_reached: `You have reached your order limit, Some functionlity might be not work. Please update your plan`,
  something_went_wrong: `Something went wrong, Please contact app admin`,
};
exports.pricingPlanCustomerErrorMessage = {
  plan_not_selected: `Currently you don't have any activated plan, Please choose your monthly recurring plan`,
  // plan_expriy_soon: `Your plan will be exprired soon, Please pay your monthly recurring plan`,
  plan_not_found: `We just found your plan get changed, Please choose your new monthly recurring plan`,
  plan_exprired: `Your plan got exprired, Please choose your monthly recurring plan`,
  order_limit_reached: `You have reached your order limit, Some functionlity might be not work. Please update your plan`,
  something_went_wrong: `Something went wrong, Please contact app admin`,
};

exports.getCurrencySymbols = (symbol) => {
  try {
    let currecySymbol = {
      AED: 'د.إ', // ?
      AFN: 'Af',
      ALL: 'Lek',
      AMD: '',
      ANG: 'ƒ',
      AOA: 'Kz', // ?
      ARS: '$',
      AUD: '$',
      AWG: 'ƒ',
      AZN: 'мaн',
      BAM: 'KM',
      BBD: '$',
      BDT: '৳', // ?
      BGN: 'лв',
      BHD: '.د.ب', // ?
      BIF: 'FBu', // ?
      BMD: '$',
      BND: '$',
      BOB: '$b',
      BRL: 'R$',
      BSD: '$',
      BTN: 'Nu.', // ?
      BWP: 'P',
      BYR: 'p.',
      BZD: 'BZ$',
      CAD: '$',
      CDF: 'FC',
      CHF: 'CHF',
      CLF: '', // ?
      CLP: '$',
      CNY: '¥',
      COP: '$',
      CRC: '₡',
      CUP: '⃌',
      CVE: '$', // ?
      CZK: 'Kč',
      DJF: 'Fdj', // ?
      DKK: 'kr',
      DOP: 'RD$',
      DZD: 'دج', // ?
      EGP: '£',
      ETB: 'Br',
      EUR: '€',
      FJD: '$',
      FKP: '£',
      GBP: '£',
      GEL: 'ლ', // ?
      GHS: '¢',
      GIP: '£',
      GMD: 'D', // ?
      GNF: 'FG', // ?
      GTQ: 'Q',
      GYD: '$',
      HKD: '$',
      HNL: 'L',
      HRK: 'kn',
      HTG: 'G', // ?
      HUF: 'Ft',
      IDR: 'Rp',
      ILS: '₪',
      INR: '₹',
      IQD: 'ع.د', // ?
      IRR: '﷼',
      ISK: 'kr',
      JEP: '£',
      JMD: 'J$',
      JOD: 'JD', // ?
      JPY: '¥',
      KES: 'KSh', // ?
      KGS: 'лв',
      KHR: '៛',
      KMF: 'CF', // ?
      KPW: '₩',
      KRW: '₩',
      KWD: 'د.ك', // ?
      KYD: '$',
      KZT: 'лв',
      LAK: '₭',
      LBP: '£',
      LKR: '₨',
      LRD: '$',
      LSL: 'L', // ?
      LTL: 'Lt',
      LVL: 'Ls',
      LYD: 'ل.د', // ?
      MAD: 'د.م.', //?
      MDL: 'L',
      MGA: 'Ar', // ?
      MKD: 'дeн',
      MMK: 'K',
      MNT: '₮',
      MOP: 'MOP$', // ?
      MRO: 'UM', // ?
      MUR: '₨', // ?
      MVR: '.ރ', // ?
      MWK: 'MK',
      MXN: '$',
      MYR: 'RM',
      MZN: 'MT',
      NAD: '$',
      NGN: '₦',
      NIO: 'C$',
      NOK: 'kr',
      NPR: '₨',
      NZD: '$',
      OMR: '﷼',
      PAB: 'B/.',
      PEN: 'S/.',
      PGK: 'K', // ?
      PHP: '₱',
      PKR: '₨',
      PLN: 'zł',
      PYG: 'Gs',
      QAR: '﷼',
      RON: 'lei',
      RSD: 'Дин.',
      RUB: 'py6',
      RWF: 'ر.س',
      SAR: '﷼',
      SBD: '$',
      SCR: '₨',
      SDG: '£', // ?
      SEK: 'kr',
      SGD: '$',
      SHP: '£',
      SLL: 'Le', // ?
      SOS: 'S',
      SRD: '$',
      STD: 'Db', // ?
      SVC: '$',
      SYP: '£',
      SZL: 'L', // ?
      THB: '฿',
      TJS: 'TJS', // ? TJS (guess)
      TMT: 'm',
      TND: 'د.ت',
      TOP: 'T$',
      TRY: '₤', // New Turkey Lira (old symbol used)
      TTD: '$',
      TWD: 'NT$',
      TZS: '',
      UAH: '₴',
      UGX: 'USh',
      USD: '$',
      UYU: '$U',
      UZS: 'лв',
      VEF: 'Bs',
      VND: '₫',
      VUV: 'VT',
      WST: 'WS$',
      XAF: 'FCFA',
      XCD: '$',
      XDR: '',
      XOF: '',
      XPF: 'F',
      YER: '﷼',
      ZAR: 'R',
      ZMK: 'ZK', // ?
      ZWL: 'Z$',
    };
    let currencyResponse = 'amount';
    if (currecySymbol[symbol] != undefined) {
      currencyResponse = currecySymbol[symbol];
    }
    return currencyResponse;
  } catch (err) {
    throw new Error('Unknown currency formate');
  }
};

exports.sendCustomerEmail = async (mailObject) => {
  try {
    const response = await this.sendgridSendDynamicMail(mailObject);
    if (response.error) throw new CustomError(400, response.error);

    if (response.status === true) {
      const emailLogsObj = {
        store_id: mailObject.store.id,
        email_type: 'Reward',
        sent_type: 'auto',
        email_sent_date: new Date(),
        message: `Credit recieved - auto | Customer: ${mailObject.customer.customer_email} | Recieved ${mailObject?.rule?.point} for ${mailObject.type}`,
        email_message_id: response?.message_id,
        orderId: null,
        email_client: response?.mailClient,
      };

      const [_, creditLogs] = await Promise.all([
        insertEmailLogs(emailLogsObj),
        db.CreditLogs.findOne({ where: { id: mailObject.id } }),
      ]);

      if (creditLogs) {
        await db.CreditLogs.update(
          { is_email_send: '1' },
          { where: { id: mailObject.id } }
        );
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};


exports.getProductsHtml = (mailObject) => {
  try {
    const htmlRows = mailObject.products.map((product, index) => {
      const imageUrl = product.image_url || CONFIG.defaultImage;
      const title = product.title.length > 20 ? product.title.slice(0, 20) + '...' : product.title;
      const reviewUrl = product.reviewUrl || '#';

      let html = '';
      if (index % 2 === 0) html += '<tr>';

      html += `
        <td style="border: 2px solid #e5e2e2; border-radius: 4px; overflow: hidden; line-height: normal; width: 50%; vertical-align: top; padding: 10px;">
          <img alt='image_${index}' src="${imageUrl}" style="width: 120px; height: 160px; max-height: 200px; object-fit: cover; border-radius: 4px;">
          <div>
            <p style="font-family: Arial; color: #010101; font-size: 14px; margin: 8px 0; text-align: center; padding: 2% 4%;">${title}</p>
            <div style="text-align: center; font-size: 14px; font-family: Arial; padding-bottom: 4%;">
              <a href="${reviewUrl}" target="_blank" style="display: inline-block; text-decoration: none; background-color: black; color: #FFFFFF; border-radius: 4px; padding: 8px 16px;">Write Review</a>
            </div>
          </div>
        </td>`;

      if (index % 2 === 1) html += '</tr>';
      return html;
    });

    if (mailObject.products.length % 2 !== 0) {
      htmlRows.push('<td style="border: none;"></td></tr>');
    }

    return `<table style="width: 100%; border-collapse: separate; border-spacing: 20px; padding: 4% 2% 2% 2%;">${htmlRows.join('')}</table>`;
  } catch (error) {
    console.log('getProductsHtml,error', error);
    return { success: false, error: error?.message || error };
  }
};


exports.reviewRequest = async (mailObject) => {
  try {
    console.log('inside review request mail function');
    let response;
    if (parseInt(mailObject.store.email_enable)) {
      console.log('mail is enable');
      if (
        mailObject.store.email_notification == 'retenzy' ||
        mailObject.store.email_notification == 'sendgrid'
      ) {
        let productsHtml = this.getProductsHtml(mailObject);
        mailObject.products = productsHtml;
        response = await this.sendgridSendDynamicMail(mailObject);
        if (response.error) throw new CustomError(500, response.error);
        return response;
        ///////response///////
        // status: true,
        // message: "SUCCESS",
        // message_id: response[0]?.headers["x-message-id"],
        // mailClient: sendgridData.client,
      }
      let eventdata = {
        name: `Retenzy-${mailObject.type}`,
        email: mailObject.customer.customer_email,
        properties: {
          first_name: mailObject.customer.first_name,
          last_name: mailObject.customer.last_name,
          products: mailObject.products,
          order_name: mailObject.order.name,
        },
      };
      if (mailObject.store.email_notification == 'klaviyo') {
        console.log('console bedore event send to klaviyo');
        response = await this.sendEventToKlaviyo(
          mailObject.store.id,
          eventdata
        );
        console.log('console after event send to klaviyo');
        if (response.error) throw new CustomError(500, response.error);
        return response;
      }
      if (mailObject.store.email_notification == 'mailchimp') {
        response = await this.sendEventToMailchimp(
          mailObject.store.id,
          eventdata
        );
        if (response.error) throw new CustomError(500, response.error);
        return response;
      }
      if (mailObject.store.email_notification == 'omnisend') {
        response = await this.sendEventToOmnisend(
          mailObject.store.id,
          eventdata
        );

        if (response.error) throw new CustomError(500, response.error);
        return response;
      }
    }
    return {
      status: false,
      message: 'Email notification is disabled for this store',
    };
  } catch (error) {
    console.log('reviewRequest error=>>', error);
    return {
      status: false,
      message:
        error?.response?.body?.errors[0]?.message || error?.message || error,
    };
  }
};

exports.sendgridSendMail = async (Obj) => {
  try {
    const sendGridData = await db.Integration.findOne({
      where: { store_id: null, app: 'sendgrid' },
      attributes: ['credential'],
    });

    if (sendGridData) {
      const key = JSON.parse(this.decrypt(sendGridData.credential));
      sgMail.setApiKey(key);

      const template = {
        to: Obj.to,
        from: Obj.from || `no-reply@retenzy.app`,
        subject: Obj.subject,
        html: Obj.html,
        bcc: CONFIG.EMAIL.BCC_MAIL,
        ...(Obj.cc && { cc: Obj.cc }),
      };

      const response = await sgMail.send(template);
      if (response.error) throw new Error('Mail not sent');
    }

    return { status: true, message: 'SUCCESS' };
  } catch (error) {
    console.log('sendgridSendMail error:', error?.response?.body?.errors || error);
    return { status: false, message: 'Internal server error' };
  }
};


exports.sendgridSendMail = async (Obj) => {
  try {
    var sendGridData = await db.Integration.findOne({
      where: { store_id: null, app: 'sendgrid' },
    });
    if (sendGridData) {
      let key = JSON.parse(this.decrypt(sendGridData.credential));
      sgMail.setApiKey(key);
      let template = {
        to: `${Obj.to}`,
        from: Obj.from ? Obj.from : `no-reply@retenzy.app`,
        subject: `${Obj.subject}`,
        html: `${Obj.html}`,
        bcc: CONFIG.EMAIL.BCC_MAIL,
      };
      if (Obj.cc) template.cc = Obj.cc;
      let response = await sgMail.send(template);
      if (response.error) throw new Error('Mail not sent');
    }
    return { status: true, message: 'SUCCESS' };
  } catch (error) {
    error.response && error.response.body.errors
      ? console.log('error in sendgridSendMail', error.response.body.errors)
      : console.log('err============1', error);
    return { status: false, message: 'Internal server error' };
  }
};

exports.sendForgotPasswordMail = async (Obj) => {
  try {
    let sendGridData = await db.Integration.findOne({
      where: { store_id: null, app: 'sendgrid' },
    });

    if (sendGridData) {
      let key = JSON.parse(this.decrypt(sendGridData.dataValues.credential));
      sgMail.setApiKey(key);
      let data = JSON.parse(sendGridData.dataValues.otherData);
      let template = {
        to: `${Obj.to}`,
        from: data.sender_mail,
        subject: `${Obj.subject}`,
        html: `${Obj.html}`,
        bcc: CONFIG.EMAIL.BCC_MAIL,
      };
      if (Obj.cc) template.cc = Obj.cc;

      let response = await sgMail.send(template);
      if (response.error) throw new Error('Mail not sent');
    }
    return { status: true, message: 'SUCCESS' };
  } catch (error) {
    console.log('sendForgotPasswordMail error222', error);
    return { status: false, message: 'Internal server error', error: error };
  }
};

exports.sendgridSendDynamicMail = async (Obj) => {
  try {
    const sendgridData = await this.getSendGridDetails(Obj.store.id);
    if (!sendgridData.success) throw new Error(sendgridData.error);

    sgMail.setApiKey(sendgridData.apikey);

    const data = await this.getMailTemplate(Obj);
    if (!data.success) throw new Error(data.error);

    const template = {
      to: Obj.referTo || Obj.customer.customer_email,
      from: {
        email: sendgridData.sender_mail,
        name: Obj.store?.sender_name,
      },
      subject: data.subject,
      html: data.html,
      bcc: CONFIG.EMAIL.BCC_MAIL,
      ...(Obj?.category && { category: Obj.category }),
      ...(Obj?.customArgs && { customArgs: Obj.customArgs }),
      ...(Obj.store.support_email && { replyTo: Obj.store.support_email }),
      ...(Obj.cc && { cc: Obj.cc }),
    };

    const response = await sgMail.send(template);
    if (response.error) throw new Error('Mail not sent');

    return {
      status: true,
      message: 'SUCCESS',
      message_id: response[0]?.headers['x-message-id'],
      mailClient: sendgridData.client,
    };
  } catch (error) {
    console.log('sendgridSendDynamicMail error:', error?.response?.body?.errors || error);
    return {
      status: false,
      error: error?.response?.body?.errors?.[0]?.message || error?.message || error,
    };
  }
};

exports.sendReviewMail = async (mailObject, file) => {
  try {
    let sendGridData = await db.Integration.findOne({
      where: { store_id: null, app: 'sendgrid' },
    });
    if (sendGridData) {
      let key = JSON.parse(this.decrypt(sendGridData.credential)).key;
      sgMail.setApiKey(key);

      const template = {
        to: `${mailObject.clientEmail}`,
        from: `${mailObject.shop} <${CONFIG.EMAIL.SENDERMAIL}>`,
        subject: `Customer review file`,
        text: 'file',
        attachments: [
          {
            content: new Buffer(file).toString('base64'),
            filename: 'Reviews.csv',
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
        bcc: CONFIG.EMAIL.BCC_MAIL,
      };
      let response = await sgMail.send(template);
      if (response.error)
        throw new CustomError(500, response.error.response.body);
    }
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
};
exports.ordinal_suffix_of = (amount) => {
  if (typeof amount != 'number') {
    amount = Number(amount) ? Number(amount) : 0;
  }
  var j = amount % 10,
    k = amount % 100;
  if (j == 1 && k != 11) {
    return amount + 'st';
  }
  if (j == 2 && k != 12) {
    return amount + 'nd';
  }
  if (j == 3 && k != 13) {
    return amount + 'rd';
  }
  return amount + 'th';
};
exports.customername = (first_name, last_name) => {
  try {
    let customer_name = `${first_name || ''} ${last_name || ''}`;
    if (!customer_name.trim()) {
      customer_name = 'User';
    }
    return customer_name;
  } catch (error) {
    console.log('error', error);
    return 'User';
  }
};
const sendGridCache = new Map();

exports.getSendGridDetails = async (store_id) => {
  if (sendGridCache.has(store_id)) return sendGridCache.get(store_id);

  try {
    let client = 'sendgrid';
    let integration = await db.Integration.findOne({
      where: { store_id, app: 'sendgrid' },
      attributes: ['credential', 'otherData'],
    });

    if (!integration) {
      integration = await db.Integration.findOne({
        where: { store_id: null, app: 'sendgrid' },
        attributes: ['credential', 'otherData'],
      });
      client = 'Retenzy';
    }

    if (!integration) throw new Error('SendGrid integration not found');

    const data = JSON.parse(integration.dataValues.otherData);
    const apikey = JSON.parse(this.decrypt(integration.dataValues.credential));

    const sendgridObj = {
      success: true,
      sender_mail: data.sender_mail,
      sender_id: data.sender_id,
      suppression_id: data.suppression_id,
      apikey,
      client,
    };

    sendGridCache.set(store_id, sendgridObj);
    return sendgridObj;
  } catch (error) {
    console.log('getSendGridDetails error:', error);
    return { success: false, error: error?.message || error };
  }
};


exports.getProductsHtmlForDeal = async (product_ids, store, isTestMail) => {
  try {
    let productResponse;
    if (isTestMail) {
      productResponse = await db.Products.findAll({
        where: { store_id: store.id },
        attributes: ['id', 'product_id', 'title', 'handle'],
        include: [
          {
            model: db.ProductVariants,
            attributes: ['id', 'title', 'price', 'variant_id'],
            include: {
              model: db.ProductImages,
              attributes: ['image_url'],
            },
          },
        ],
        limit: 4,
      });
    } else {
      productResponse = await db.Products.findAll({
        where: { id: product_ids, store_id: store.id },
        attributes: ['id', 'product_id', 'title', 'handle'],
        include: [
          {
            model: db.ProductVariants,
            attributes: ['id', 'title', 'price', 'variant_id'],
            include: {
              model: db.ProductImages,
              attributes: ['image_url'],
            },
          },
        ],
      });
    }

    console.log('productResponse', productResponse);

    let html = `<table style="width: 100%; border-collapse: separate; border-spacing: 20px;">`;
    productResponse.slice(0, 4).map((product, index) => {
      // Add a new row for every two products
      if (index % 2 === 0) {
        html += '<tr>';
      }

      html += `
        <td style="border: 2px solid #e5e2e2; border-radius: 4px; overflow: hidden; line-height: normal; width: 50%; vertical-align: top; padding: 5px;">
          <img alt='image_${index}'
            src="${
              product.product_variants[0].product_image?.image_url
                ? product.product_variants[0].product_image?.image_url
                : CONFIG.defaultImage
            }"
            style="width: 120px; height: 160px; max-height: 200px; object-fit: cover; border-radius: 4px;">
          <div>
            <p style="font-family: Arial; color: #010101; font-size: 14px; margin: 8px 0; text-align: center; padding: 2% 4%;">${
              product.title.length > 20
                ? product.title.slice(0, 20) + '...'
                : product.title
            }</p>
            <div style="text-align: center; font-size: 14px; font-family: Arial; padding-bottom: 4%;">
              <a href="https://${
                store.domain
              }/account#/deals" target="_blank" style="display: inline-block; text-decoration: none; background-color: black; color: #FFFFFF; border-radius: 4px; padding: 8px 16px;">Buy Now</a>
            </div>
          </div>
        </td>`;

      // Close the row after two products
      if (index % 2 === 1) {
        html += '</tr>';
      }
    });

    // If the number of products is odd, add an empty cell to balance the last row
    if (productResponse.length % 2 !== 0) {
      html += '<td style="border: none;"></td></tr>';
    }

    html += `</table>`;
    return html;
  } catch (error) {
    console.log('getProductsHtml, error', error);
    return { success: false, error: error?.message || error };
  }
};

exports.getMailTemplate = async (data) => {
  try {
    // Fetch the HTML template and necessary data in a single query
    let html, subject, campaign_name;
    if (!data.isTestMail) {
      let htmlTemplate = await db.EmailTemplates.findOne({
        where: {
          store_id: data.store.id,
          template_key: data.type,
          is_active: '1',
        },
      });
      // If template is not found for specific store, fetch from default
      if (!htmlTemplate) {
        htmlTemplate = await db.EmailTemplates.findOne({
          where: {
            store_id: null,
            template_key: data.type,
          },
        });
      }
      // If template not found at all, return an error
      if (!htmlTemplate) {
        throw new Error('Template not found');
      }
      html = htmlTemplate.dataValues.value;
      subject = htmlTemplate.dataValues.subject;
      campaign_name = htmlTemplate.dataValues.campaign_name;
    } else {
      (html = data.html),
        (subject = data.subject),
        (campaign_name = 'Test Mail Campaign');
    }
    const updatedHtmlTemplate = await replaceVariablesInTemplate(html, data);

    if (
      typeof updatedHtmlTemplate === 'object' &&
      !updatedHtmlTemplate.success
    ) {
      throw new Error(updatedHtmlTemplate.error);
    }
    const updatedSubject = await replaceVariablesInTemplate(subject, data);
    if (typeof updatedSubject === 'object' && !updatedSubject.success) {
      throw new Error(updatedSubject.error);
    }
    return {
      subject: updatedSubject,
      html: updatedHtmlTemplate,
      campaign_name,
      success: true,
    };
  } catch (error) {
    console.log('error in getMailTemplate', error);
    return { success: false, error: error?.message || error };
  }
};

const replaceVariablesInTemplate = async (htmlTemplate, data) => {
  try {
    const variableRegex = /{{([^}]+)}}/g;
    const variables = [...htmlTemplate.matchAll(variableRegex)].map((v) => v[1]);
    let updatedTemplate = htmlTemplate;

    for (const variable of variables) {
      const value = await getValueForVariable(variable, data);
      if (typeof value === 'object' && !value.success) throw new Error(value.error);
      updatedTemplate = updatedTemplate.replace(`{{${variable}}}`, value);
    }

    return updatedTemplate;
  } catch (error) {
    console.log('replaceVariablesInTemplate error:', error.message);
    return { success: false, error: error?.message || error };
  }
};

const getValueForVariable = async (variable, data) => {
  try {
    let { store, rule, deal, customer, order, products, isTestMail } = data;
    switch (variable) {
      case 'store_name':
        return store?.username || '';
      case 'store_domain':
        return (store?.main_domain ? store?.main_domain : store?.domain) || '';
      case 'store_currency':
        return store?.currency || '';
      case 'store_currency_format':
        return store?.currency_format || '';
      case 'reward_point':
        return rule?.point || '';
      case 'reward_comment':
        return rule?.comment || '';
      case 'reward_name':
        return rule?.rule_type
          ? rule?.rule_type.charAt(0).toUpperCase() + rule?.rule_type.slice(1)
          : '';
      case 'reward_expire_in_days':
        return rule?.expiry_days || '';
      case 'reward_order_amount':
        return rule?.value || '';
      case 'reward_order_quantity':
        return rule?.value || '';

      case 'discount_coupon_value':
        return rule?.discount_coupon_value || '';
      case 'discount_condition':
        return rule?.discount_condition || '';
      case 'discount_coupon':
        return rule?.discount_coupon || '';
      case 'min_point_to_redeem':
        return store?.min_reward_to_redeem || '';
      case 'max_point_to_redeem':
        return store?.max_reward_to_redeem || '';
      case 'one_point_eq_to_amount':
        return store?.reward_redeem_amount || '';
      case 'min_cart_amount_to_redeem':
        return store?.min_cart_amount_to_redeem || '';
      case 'deal_name':
        return deal?.name || '';
      case 'deal_discount':
        return deal?.discount_value || '';
      case 'deal_discount_type':
        return deal?.type || '';
      case 'deal_expiry_date':
        return deal?.end_date?.split('T')[0] || '';
      case 'deal_expiry_time':
        return deal?.end_time || '';
      case 'deal_start_date':
        return deal?.start_date?.split('T')[0] || '';
      case 'deal_start_time':
        return deal?.start_time || '';
      case 'customer_email':
        return customer?.customer_email || '';
      case 'customer_name':
        return (
          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
          'User'
        );
      case 'customer_first_name':
        return customer?.first_name || 'User';
      case 'order_name':
        return order?.name || '';
      case 'order_amount':
        return order?.price || '';
      case 'order_discount':
        return order?.discount || '';
      case 'products':
        if (deal && deal?.product_id.length) {
          let data = await this.getProductsHtmlForDeal(
            deal.product_id,
            store,
            isTestMail
          );
          if (typeof data === 'object' && !data.success) {
            throw new Error(data.error);
          }
          return data ? data : '';
        } else if (!deal?.product_id?.length && isTestMail) {
          let data = this.getProductsHtml({ products, store });
          if (typeof data === 'object' && !data.success) {
            throw new Error(data.error);
          }
          return data ? data : '';
        } else {
          return products ? products : '';
        }
      default:
        return '';
    }
  } catch (error) {
    console.log('error in getValueForVariableww', error.message);
    return { success: false, error: error?.message || error };
  }
};

exports.sendEventToKlaviyo = async (store_id, eventdata) => {
  try {
    // console.log("eventdata", eventdata);
    integrationData = await db.Integration.findOne({
      where: { store_id, app: 'klaviyo' },
    });
    let decryptData = this.decrypt(integrationData.credential);
    api_key = JSON.parse(decryptData);
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        revision: '2024-05-15',
        'content-type': 'application/json',
        Authorization: `Klaviyo-API-Key ${api_key}`,
      },
      body: {
        data: {
          type: 'event',
          attributes: {
            properties: eventdata.properties,
            metric: {
              data: {
                type: 'metric',
                // attributes: { name: "Reward Created" },
                attributes: { name: eventdata.name },
              },
            },
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  // email: "dsaurabh@techsurvi.com",
                  email: eventdata.email,
                },
              },
            },
          },
        },
      },
    };
    const url = `${klaviyo_url}/events/`;
    // let data = await fetch(url, options);
    let data = await axios.post(url, options.body, {
      headers: options.headers,
    });
    if (data.status == 202) {
      return { status: true, message: 'SUCCESS', mailClient: 'Klaviyo' };
    } else {
      return { status: false, error: 'ERROR', mailClient: 'Klaviyo' };
    }
  } catch (error) {
    console.log('error inside send klaviyoevent function', error);
    return { status: false, error: error.message, mailClient: 'klaviyo' };
  }
};

exports.sendAllEventToKlaviyo = async (api_key) => {
  try {
    console.log('console in send all event to klaviyoo22');
    console.log('api_key', api_key);
    let eventsArr = [
      {
        name: 'Retenzy-Signup Reward',
        properties: {
          rewardName: `Signup Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Amount Reward',
        properties: {
          rewardName: `Amount Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Quantity Reward',
        properties: {
          rewardName: `Quantity Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',

          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Social Media Reward',
        properties: {
          rewardName: `(Social media PlatForm name) Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          platform: `Social media PlatForm name`,
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Review Reward',
        properties: {
          rewardName: `Review Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Anniversary Reward',
        properties: {
          rewardName: `Anniversary Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      // {
      //   name: "Retenzy-Send Referral",
      //   properties: {
      //     referrer_email: "email of referee",
      //     referrer_first_name: "first name of referee",
      //     referrer_last_name: "last name of refreee",
      //   },
      // },
      // {
      //   name: "Retenzy-Referral Reward",
      //   properties: {
      //     rewardName: `Referral Reward`,
      //     comment: "Your Comment at the time of reward rule creation",
      //     expiry_days:
      //       "if you set reward at never expire then it never expire otherwise it will expired at given days ",
      //     point: "reward point",
      //     first_name: "customer first name",
      //     last_name: "customer last name",
      //   },
      // },
      {
        name: 'Retenzy-Custom Reward',
        properties: {
          rewardName: `Custom Reward`,
          comment: 'Comment at the time of custom reward given to customer',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_reminder',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_request',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Coupon genaration',
        properties: {
          name: '',
          point: 'reward point use to genrate coupon',
          discount_coupon: 'coupon code',
          discount_value: 'value of discount',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
    ];

    for (eventdata of eventsArr) {
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          revision: '2024-05-15',
          'content-type': 'application/json',
          Authorization: `Klaviyo-API-Key ${api_key}`,
        },
        body: {
          data: {
            type: 'event',
            attributes: {
              properties: eventdata.properties,
              metric: {
                data: {
                  type: 'metric',
                  // attributes: { name: "Reward Created" },
                  attributes: { name: eventdata.name },
                },
              },
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    // email: "dsaurabh@techsurvi.com",
                    // email: eventdata.email,
                    email: 'user@retenzy.app',
                  },
                },
              },
            },
          },
        },
      };
      const url = `${klaviyo_url}/events/`;
      let data = await axios.post(url, options.body, {
        headers: options.headers,
      });
      console.log('successfully send all event to klaviyo in forr');
    }
    console.log('successfully send all event to klaviyo');
    return { status: true, message: 'successfully send all event to klaviyo' };
  } catch (error) {
    console.log('error=>>>>>>', error.response.data);
    return { status: false, message: error.message };
  }
};
///////////////////////////////////////////////////////////////////////////

const findListIdByEmailMailchimp = async (customerEmail) => {
  try {
    const listsResponse = await mailchimp.lists.getAllLists();
    const lists = listsResponse.lists;
    for (const list of lists) {
      try {
        const memberResponse = await mailchimp.lists.getListMember(
          list.id,
          customerEmail
        );
        if (
          memberResponse.status === 'subscribed' ||
          memberResponse.status === 'pending' ||
          memberResponse.status === 'unsubscribed'
        ) {
          console.log('list.id', list.id);
          return list.id;
        }
      } catch (error) {
        if (error.response.status !== 404) {
          console.error(`Error checking list ${list.id}:`, error);
        }
      }
    }
    await addMemberToListMailchimp(lists[0].id, customerEmail);
    console.log('customer added in list id', lists[0].id);
    return lists[0].id;
  } catch (error) {
    console.error('Error retrieving lists:', error);
    return null;
  }
};
async function addMemberToListMailchimp(listId, email) {
  try {
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
    });
    return listId;
  } catch (error) {
    console.error(`Error adding member: ${error.message}`);
    throw error;
  }
}
exports.sendEventToMailchimp = async (store_id, eventdata) => {
  try {
    integrationData = await db.Integration.findOne({
      where: { store_id, app: 'mailchimp' },
    });
    let decryptData = this.decrypt(integrationData.credential);
    let api_key = JSON.parse(decryptData);

    mailchimp.setConfig({
      apiKey: api_key,
      server: api_key.split('-')[1],
    });
    const listId = await findListIdByEmailMailchimp(eventdata.email);
    if (!listId) {
      console.error('Customer not found in any list');
      return;
    }
    const response = await mailchimp.lists.createListMemberEvent(
      listId,
      eventdata.email,
      {
        name: eventdata.name.split(' ').join(''),
        properties: eventdata.properties,
      }
    );
    console.log('Custom event sent successfully:', response);
    return { status: true, message: 'SUCCESS', email_client: 'Mailchimp' };
  } catch (error) {
    console.error('Failed to send custom event:', error.response.body);
    return { status: false, error: error.message };
  }
};
exports.sendAllEventToMailchimp = async (api_key) => {
  try {
    console.log('console in send all event to klaviyoo22');
    console.log('api_key', api_key);
    mailchimp.setConfig({
      apiKey: api_key,
      server: api_key.split('-')[1],
    });
    const listId = await findListIdByEmailMailchimp('user@retenzy.app');
    if (!listId) {
      console.error('Customer not found in any list');
      return;
    }
    let eventsArr = [
      {
        name: 'Retenzy-Signup Reward',
        properties: {
          rewardName: `Signup Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Amount Reward',
        properties: {
          rewardName: `Amount Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Quantity Reward',
        properties: {
          rewardName: `Quantity Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',

          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Social Media Reward',
        properties: {
          rewardName: `(Social media PlatForm name) Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          platform: `Social media PlatForm name`,
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      // {
      //   name: "Retenzy-Send Referral",
      //   properties: {
      //     referrer_email: "email of referee",
      //     referrer_first_name: "first name of referee",
      //     referrer_last_name: "last name of refreee",
      //   },
      // },
      // {
      //   name: "Retenzy-Referral Reward",
      //   properties: {
      //     rewardName: `Referral Reward`,
      //     comment: "Your Comment at the time of reward rule creation",
      //     expiry_days:
      //       "if you set reward at never expire then it never expire otherwise it will expired at given days ",
      //     point: "reward point",
      //     first_name: "customer first name",
      //     last_name: "customer last name",
      //   },
      // },
      {
        name: 'Retenzy-Review Reward',
        properties: {
          rewardName: `Review Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Anniversary Reward',
        properties: {
          rewardName: `Anniversary Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Custom Reward',
        properties: {
          rewardName: `Custom Reward`,
          comment: 'Comment at the time of custom reward given to customer',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_reminder',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_request',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link of product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link of product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Coupon genaration',
        properties: {
          name: '',
          point: 'reward point use to genrate coupon',
          discount_coupon: 'coupon code',
          discount_value: 'value of discount',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
    ];

    for (eventdata of eventsArr) {
      const response = await mailchimp.lists.createListMemberEvent(
        listId,
        'user@retenzy.app',
        {
          name: eventdata.name.split(' ').join(''),
          properties: eventdata.properties,
        }
      );
      console.log('event sent successfully:', response);
    }
    console.log('successfully send all event to mailchimp');
    return {
      status: true,
      message: 'successfully send all event to mailchimp',
    };
  } catch (error) {
    console.log('error=>>>>>>', error.response.data);
    return { status: false, message: error.message };
  }
};
exports.sendEventToOmnisend = async (store_id, eventdata) => {
  try {
    integrationData = await db.Integration.findOne({
      where: { store_id, app: 'omnisend' },
    });
    let decryptData = this.decrypt(integrationData.credential);
    let api_key = JSON.parse(decryptData);

    const options = {
      method: 'POST',
      url: 'https://api.omnisend.com/v5/events',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-API-KEY': api_key,
      },
      data: {
        contact: { email: eventdata.email },
        properties: eventdata.properties,
        eventName: eventdata.name,
        origin: 'api',
      },
    };

    eventdata?.properties?.first_name
      ? (options.data.contact.firstName = eventdata.properties.first_name)
      : null;
    eventdata?.properties?.last_name
      ? (options.data.contact.lastName = eventdata.properties.last_name)
      : null;
    let data = await axios.request(options);
    console.log('Custom event sent successfully:', data);
    return { status: true, message: 'SUCCESS', email_client: 'Omnisend' };
  } catch (error) {
    console.log(
      'Failed to send custom event:',
      error?.response ? error.response?.data : error.message
    );
    return { status: false, error: error.message };
  }
};
exports.sendAllEventToOmnisend = async (api_key) => {
  try {
    let eventsArr = [
      {
        name: 'Retenzy-Signup Reward',
        properties: {
          rewardName: `Signup Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Amount Reward',
        properties: {
          rewardName: `Amount Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Quantity Reward',
        properties: {
          rewardName: `Quantity Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',

          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Social Media Reward',
        properties: {
          rewardName: `(Social media PlatForm name) Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          platform: `Social media PlatForm name`,
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      ///////////////////////////////////////////////////////////
      // {
      //   name: "Retenzy-Send Referral",
      //   properties: {
      //     referrer_email: "email of referee",
      //     referrer_first_name: "first name of referee",
      //     referrer_last_name: "last name of refreee",
      //   },
      // },
      // {
      //   name: "Retenzy-Referral Reward",
      //   properties: {
      //     rewardName: `Referral Reward`,
      //     comment: "Your Comment at the time of reward rule creation",
      //     expiry_days:
      //       "if you set reward at never expire then it never expire otherwise it will expired at given days ",
      //     point: "reward point",
      //     first_name: "customer first name",
      //     last_name: "customer last name",
      //   },
      // },
      ////////////////////////////////
      {
        name: 'Retenzy-Review Reward',
        properties: {
          rewardName: `Review Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Anniversary Reward',
        properties: {
          rewardName: `Anniversary Reward`,
          comment: 'Your Comment at the time of reward rule creation',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Custom Reward',
        properties: {
          rewardName: `Custom Reward`,
          comment: 'Comment at the time of custom reward given to customer',
          expiry_days:
            'if you set reward at never expire then it never expire otherwise it will expired at given days ',
          point: 'reward point',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_reminder',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-review_request',
        properties: {
          products: `you get product data in arrays of object like [
            {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
          {
            title: product title,
            image_url: link of product image
            product_url:link of product
            reviewUrl:link to write product review
          },
        ]  And you can access like products[0].title for 1st product name`,
          order_name: 'order name',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
      {
        name: 'Retenzy-Coupon genaration',
        properties: {
          name: '',
          point: 'reward point use to genrate coupon',
          discount_coupon: 'coupon code',
          discount_value: 'value of discount',
          first_name: 'customer first name',
          last_name: 'customer last name',
        },
      },
    ];

    for (eventdata of eventsArr) {
      const options = {
        method: 'POST',
        url: 'https://api.omnisend.com/v5/events',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'X-API-KEY': api_key,
        },
        // data: {
        //   fields: eventdata.properties,
        //   name: eventdata.name,
        //   systemName: eventdata.name.split(" ").join(""),
        //   email: "user@retenzy.com",
        // },
        data: {
          contact: { email: 'user@retenzy.app' },
          properties: eventdata.properties,
          eventName: eventdata.name,
          origin: 'api',
        },
      };
      let data = await axios.request(options);
      console.log('data of evbent sending to omnisend', data);
    }
    console.log('successfully send all event to omnisend');
    return { status: true, message: 'successfully send all event to omnisend' };
  } catch (error) {
    console.log(
      'error in sendAllEventToOmnisend',
      error.response ? error.response.data : error.message
    );
    return { status: false, message: error.message };
  }
};

exports.rewardOnReview = async (review, storeData) => {
  try {
    console.log('inside reward on review', review);
    if (review.is_reward_recieved == '1') return false;
    const creditRule = await db.CreditRules.findOne({
      where: { store_id: storeData.id, rule_type: 'review' },
    });
    if (!creditRule || !creditRule.is_active == '1') return;
    let rewardData = JSON.parse(creditRule.value);
    if (rewardData.onlyVerified && review.is_verified != '1') return;
    if (!rewardData.samePointForAll) {
      let urls = review.review_images ? review.review_images.split(',') : [];
      let hasVideo = urls.some((url) => url.match(/\.(mp4|mov|avi)$/i));
      let hasImage = urls.some((url) => url.match(/\.(png|jpg|jpeg)$/i));
      if (hasImage) {
        creditRule.point = rewardData.withImg;
      }
      if (hasVideo) {
        creditRule.point = rewardData.withVdo;
      }
    }
    const customerData = await db.Customers.findOne({
      where: {
        store_id: storeData.id,
        customer_email: review.customer_email,
      },
    });
    if (!customerData) return;
    let expiryDate = null;
    if (creditRule.expiry_days > 0) {
      let date = new Date();
      expiryDate = date.setDate(
        date.getDate() + parseInt(creditRule.expiry_days)
      );
    }

    let creditLogObj = {
      store_id: storeData.id,
      customer_credit_id: customerData.id, // change customer_id 0 to customer_id
      customer_email: customerData.customer_email,
      credit: creditRule.point,
      available: creditRule.point,
      action_type: 'credit',
      comment: creditRule.comment,
      is_expired: '0',
      expiry_date: expiryDate,
    };
    let createCreditLogs = await db.CreditLogs.create(creditLogObj);
    let mailObject = {
      store: storeData,
      customer: customerData,
      id: createCreditLogs.id,
      rule: creditRule,
      // type: `${creditRule.rule_type}_reward_redumption`,
      type: 'review_reward_earned',
      customArgs: {
        email_type: 'review_reward_earned',
        campaign_name: 'reward_campaign',
      },
      category: [storeData?.username],
    };
    await db.Reviews.update(
      { is_reward_recieved: '1' },
      {
        where: { id: review.id },
      }
    );
    // Email count
    let ismailReached = await this.isMailLimitReached(storeData);
    if (parseInt(storeData.email_enable) && !ismailReached) {
      let response;
      if (
        storeData.email_notification == 'retenzy' ||
        storeData.email_notification == 'sendgrid'
      ) {
        await this.sendCustomerEmail(mailObject);
      }
      let eventData = {
        name: 'Retenzy-Review Reward',
        email: customerData.customer_email,
        properties: {
          rewardName: `${creditRule.rule_type
            .trim()[0]
            .toUpperCase()}${creditRule.rule_type.trim().slice(1)} Reward`,
          comment: creditRule.comment,
          expiry_days:
            creditRule.expiry_days == 0
              ? 'never expire'
              : JSON.stringify(creditRule.expiry_days),
          point: `${creditRule.point}`,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
        },
      };
      if (storeData.email_notification == 'klaviyo') {
        response = await this.sendEventToKlaviyo(storeData.id, eventData);
      }
      if (storeData.email_notification == 'mailchimp') {
        response = await this.sendEventToMailchimp(storeData.id, eventData);
      }
      if (storeData.email_notification == 'omnisend') {
        response = await this.sendEventToOmnisend(storeData.id, eventData);
      }
      if (response?.status == true) {
        let emailLogsObj = {
          store_id: mailObject.store.id,
          email_type: 'Reward',
          sent_type: 'auto',
          email_sent_date: new Date(),
          message: `Credit recieved - auto | Customer: ${mailObject.customer.customer_email} | Recieved ${mailObject.rule.point} for ${mailObject.type}`,
          email_message_id: response?.message_id,
          orderId: orderId,
          email_client: response?.mailClient,
        };
        await insertEmailLogs(emailLogsObj);
      }
    }
  } catch (error) {
    console.log('error in rewardOnReview', error);
    throw error;
  }
};
exports.updateEmailWebhookData = async (data) => {
  try {
    let emailLog = await db.EmailLogs.findOne({
      where: { email_message_id: data.email_message_id },
    });
    if (emailLog && emailLog?.mail_status != 'click') {
      await db.EmailLogs.update(
        { mail_status: data.mail_status },
        { where: { email_message_id: data.email_message_id } }
      );
    }
  } catch (error) {
    console.log('error in updateEmailWebhookData', error);
    throw error;
  }
};
exports.isMailLimitReached = async (store) => {
  try {
    let applicationCharges = await db.ApplicationCharges.findOne({
      where: { store_id: store.id },
    });

    let pricingPlanData = await db.PricingPlan.findOne({
      where: { id: store.pricing_plan_id },
    });
    if (!pricingPlanData) {
      throw new Error('Pricing Plan Data not found');
    }

    let startDate, endDate;

    if (applicationCharges) {
      const activatedOn = moment(applicationCharges.priceplan_activated_on);
      const initialBillingOn = applicationCharges.priceplan_billing_on
        ? moment(applicationCharges.priceplan_billing_on)
        : activatedOn.clone();

      const { startDate: calculatedStartDate, endDate: calculatedEndDate } =
        calculateBillingDateRange(activatedOn, initialBillingOn);

      startDate = calculatedStartDate;
      endDate = calculatedEndDate;
    } else {
      // Use today to last month
      endDate = moment(); // Today
      // startDate = endDate.clone().subtract(1, "months"); // 1 month ago
      startDate = moment().startOf('month');
    }

    function calculateBillingDateRange(activatedOn, billingOn) {
      const now = moment();
      const initialBilling = moment(billingOn);
      const monthsDifference = now.diff(initialBilling, 'months');
      const lastBillingDate = initialBilling.add(monthsDifference, 'months');
      if (lastBillingDate.isBefore(now)) {
        lastBillingDate.add(1, 'months');
      }
      const startDate = lastBillingDate.clone().subtract(1, 'months');
      return { startDate, endDate: lastBillingDate };
    }

    const emailCount = await db.EmailLogs.count({
      where: {
        store_id: store.id,
        [Op.and]: [
          {
            email_sent_date: {
              [Op.gte]: startDate.toDate(),
            },
          },
          {
            email_sent_date: {
              [Op.lte]: endDate.toDate(),
            },
          },
        ],
      },
    });

    if (emailCount > pricingPlanData.email_limit) {
      console.log('email limit is reached for store=>', store.id);
      let isMailSended = await db.LimitReached.findOne({
        where: {
          store_id: store.id,
          type: 'email',
          [Op.and]: [
            {
              created_at: {
                [Op.gte]: startDate.toDate(),
              },
            },
            {
              created_at: {
                [Op.lte]: endDate.toDate(),
              },
            },
          ],
        },
      });
      if (!isMailSended) {
        let templateId =
          pricingPlanData.id == 208
            ? 17
            : pricingPlanData.id == 209
              ? 18
              : pricingPlanData.id == 210
                ? 19
                : pricingPlanData.id == 211
                  ? 20
                  : '';
        const options = {
          method: 'POST',
          url: 'https://api.brevo.com/v3/smtp/email',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': CONFIG.brevo.api_key,
          },
          data: {
            to: [{ email: store.email, name: store.shop_owner }],
            templateId: templateId,
          },
        };
        let res = await axios.request(options);
        let miailReached = await db.LimitReached.create({
          store_id: store.id,
          type: 'email',
          created_at: new Date(),
          mail_sent_date: res?.data ? new Date() : null,
          is_mail_sent: res?.data ? '1' : '0',
        });
      }
    }
    return emailCount > pricingPlanData.email_limit;
  } catch (error) {
    console.log('Error in emailCount of apphelper', error);
    return true;
  }
};

exports.getAllProductIdsByProductId = async (store_id, productId) => {
  try {
    const productGroupResponse = await db.ProductGroup.findAll({
      where: {
        store_id: store_id,
        [Op.and]: db.sequelize.literal(
          `JSON_CONTAINS(productIds, '"${productId}"') = 1`
        ),
      },
    });
    const allProductIds = productGroupResponse
      .map((group) => group.productIds)
      .flat();
    const uniqueProductIds = allProductIds.length
      ? [...new Set(allProductIds)]
      : [productId];
    return uniqueProductIds;
  } catch (error) {
    console.log('error in get productGroups by productId', error);
    return [productId]; // Return at least the original product ID on error
  }
};

// exports.getAllProductIdsByProductId = async (store_id, productId) => {
//   try {
//     const productGroupResponse = await db.ProductGroup.findAll({
//       where: {
//         store_id: store_id,
//         [Op.and]: db.sequelize.literal(
//           `JSON_CONTAINS(productIds, '"${productId}"') = 1`
//         ),
//       },
//     });
//     const allProductIds = productGroupResponse
//       .map((group) => group.productIds)
//       .flat();
//     const uniqueProductIds = allProductIds.length
//       ? [...new Set(allProductIds)]
//       : [productId];
//     return uniqueProductIds;
//   } catch (error) {
//     console.log('error in get productGroups by productId', error);
//   }
// };
exports.merchantNotification = async (reviewData, store) => {
  try {
    let notificationResponse = await db.Settings.findOne({
      where: {
        store_id: store.id,
        key: 'notification_setting',
      },
      attributes: ['value'],
    });

    if (!notificationResponse) return;
    // if (!store.id) {
    //   notificationResponse = await db.Settings.findOne({
    //     where: {
    //       key: "notification_setting",
    //     },
    //   });
    // }

    // const storeUser = await db.Store.findOne({
    //   where: {
    //     id: store.id,
    //   },
    // });

    const settingsValue = JSON.parse(notificationResponse?.value);

    if (settingsValue?.review) {
      const sendgridObject = {
        to: `${store.email}`,
        from: `no-reply@retenzy.app`,
        subject: `New Review on Your product - ${reviewData?.dataValues.handle}`,
        html: `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hi ${store.username},</h2>
      <p>You’ve received a new product review on your store 🎉</p>
      <hr/>
      <h3>Product: <a href="https://${store.store_domain}/products/${reviewData?.dataValues.handle}" target="_blank">
        ${reviewData?.dataValues.handle}
      </a></h3>
 
      <p><strong>Customer Name:</strong> ${reviewData?.dataValues.customer_name}</p>
      <p><strong>Customer Email:</strong> ${reviewData?.dataValues.customer_email}</p>
      <p><strong>Review:</strong> ${reviewData?.dataValues.review}</p>
      <p><strong>Rating:</strong> ${reviewData?.dataValues.rating} out of 5</p>
      <p><strong>Date:</strong> ${new Date(reviewData?.dataValues.review_date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${reviewData?.dataValues.status}</p>
 
      <p>
        To stop receiving Review Notification emails,&nbsp;
        <a href="http://localhost:5000/admin/setting" target="_blank" rel="noopener noreferrer">
          click here
        </a>
        &nbsp;or disable the notification in the Retenzy App settings &gt;&gt; Notification tab &gt;&gt; Disable New Review button.
      </p>
 
      <hr/>
      <p>Thanks for using Retenzy!</p>
    </body>
  </html>
`,
      };
      let response = await this.sendgridSendMail(sendgridObject);
    }
  } catch (error) {
    console.log('Error in merchantNotification helper', error);
  }
};

exports.merchantQuestionAndAnswer = async (qnaList, store) => {
  try {
    let QnaResponse = await db.Settings.findOne({
      where: {
        store_id: store.id,
        key: 'notification_setting',
      },
      attributes: ['value'],
    });

    // if (!store.id) {
    //   QnaResponse = await db.Settings.findOne({
    //     where: {
    //       key: "notification_setting",
    //     },
    //   });
    // }
    // const storeUser = await db.Store.findOne({
    //   where: {
    //     id: store.id,
    //   },
    // });
    if (!QnaResponse) return;
    const settingsValue = JSON.parse(QnaResponse?.value);
    if (settingsValue?.questions) {
      const sendgridObject = {
        to: `${store.email}`,
        from: `no-reply@retenzy.app`,
        subject: `New Question on Product - ${qnaList?.dataValues.handle}`,
        html: `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hi ${store.username},</h2>
 
      <p>You've received a new question on one of your products:</p>
 
      <h3>
        Product:
        <a href="https://${store.main_domain || store.domain}/products/${qnaList?.dataValues.handle}" target="_blank">
          ${qnaList?.dataValues.handle}
        </a>
      </h3>
 
      <p><strong>Customer Name:</strong> ${qnaList?.dataValues.customer_name}</p>
      <p><strong>Customer Email:</strong> ${qnaList?.dataValues.customer_email}</p>
      <p><strong>Question:</strong> ${qnaList?.dataValues.question}</p>
      <p><strong>Status:</strong> ${qnaList?.dataValues.status}</p>
 
      <hr style="margin: 20px 0;" />
 
      <p>
        To stop receiving New Question Notification emails,&nbsp;
        <a href="http://localhost:5000/admin/setting" target="_blank" rel="noopener noreferrer">
          click here
        </a>
        &nbsp;or Disable the notification in the Retenzy App settings &gt;&gt; Notification tab &gt;&gt; Disable New Question button.</a>
      </p>
 
      <p>Reply to your customer as soon as possible to keep them engaged!</p>
 
      <p>Thanks for using <strong>Retenzy</strong> 🙌</p>
    </body>
  </html>
`,
      };
      let response = await this.sendgridSendMail(sendgridObject);
    }
  } catch (error) {
    console.log('Error in the merchantQuestionAndAnswer Helper', error);
  }
};
exports.dealReport = async (period, store) => {
  try {
    const daysMap = {
      weekly: 7,
      monthly: 30,
    };
    const days = daysMap[period] || 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    console.log('Store Id', store);

    const deals = await db.Order.findOne({
      attributes: [
        [
          literal('COALESCE(SUM(CAST(price AS DECIMAL(10,2))), 0)'),
          'totalRevenue',
        ],
        [literal('COUNT(*)'), 'orderCount'],
      ],
      where: {
        store_id: store,
        is_cep_order: '1',
        created_at: { [Op.gte]: fromDate },
      },
      raw: true,
    });

    // DealCounts totalDeals activeDeals
    const dealCounts = await db.Offers.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'totalDeals'],
        [
          fn(
            'COALESCE',
            fn('SUM', literal('CASE WHEN is_active = 1 THEN 1 ELSE 0 END')),
            0
          ),
          'activeDeals',
        ],
      ],
      where: {
        store_id: store,
        created_at: { [Op.gte]: fromDate },
      },
      raw: true,
    });

    return {
      orderThroughDeals: deals.orderCount,
      dealsRevenue: deals.totalRevenue,
      activeDeals: dealCounts.activeDeals,
    };
  } catch (error) {
    console.log('Error in the dealReort Helper', error);
  }
};

exports.reviewReport = async (period, storeId) => {
  try {
    const daysMap = {
      weekly: 7,
      monthly: 30,
    };
    const days = daysMap[period] || 7;
    const fromDate = moment().subtract(days, 'days').toDate();
    const reviewData = await db.Reviews.findAll({
      attributes: [
        [fn('COUNT', col('rating')), 'totalCount'],
        [fn('AVG', col('rating')), 'avarageRating'],
      ],
      where: {
        store_id: storeId,
        created_at: { [Op.gte]: fromDate },
      },
    });

    const allReviews = await db.Reviews.count({
      where: {
        store_id: storeId,
      },
    });

    const { totalCount, avarageRating } = reviewData[0].dataValues;
    const topRatedProduct = await db.Reviews.findAll({
      attributes: [
        'product_id',
        'handle',
        [fn('COUNT', col('rating')), 'reviewCount'],
      ],
      where: {
        store_id: storeId,
        rating: { [Op.gt]: 3 },
        created_at: { [Op.gte]: fromDate },
      },
      include: {
        model: db.Store,
        attributes: ['id', 'domain', 'main_domain'],
      },
      group: ['product_id'],
      order: [[fn('COUNT', col('rating')), 'DESC']],
      limit: 1,
    });
    let productData;
    if (topRatedProduct.length > 0 && topRatedProduct[0].product_id) {
      productData = await db.Products.findOne({
        where: {
          store_id: storeId,
          product_id: topRatedProduct[0].product_id,
        },
        attributes: ['id', 'product_id', 'handle', 'title'],
      });
    }

    return {
      allCounts: allReviews,
      totalReviews: totalCount,
      averageRating: avarageRating || 0,
      topReviewedProduct: productData && productData.title,
      topReviewedProductUrl:
        productData &&
        `https://${
          topRatedProduct[0].store.main_domain ||
          topRatedProduct[0].store.domain
        }/products/${topRatedProduct[0].handle}`,
    };
  } catch (error) {
    console.error('Error in reviewReport helper:', error);
    return null;
  }
};

exports.rewardReport = async (period, storeId) => {
  try {
    const daysMap = {
      weekly: 7,
      monthly: 30,
    };
    const days = daysMap[period] || 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const creditStats = await db.CreditLogs.findAll({
      attributes: ['action_type', [fn('COUNT', col('action_type')), 'count']],
      where: {
        store_id: storeId,
        created_at: {
          [Op.gte]: fromDate,
        },
        action_type: {
          [Op.in]: ['credit', 'redeem'],
        },
      },
      group: ['action_type'],
    });

    const totalRewards = await db.CreditLogs.count({
      where: {
        store_id: storeId,
        created_at: {
          [Op.gte]: fromDate,
        },
      },
    });
    let creditCount = 0;
    let redeemCount = 0;

    creditStats.forEach((row) => {
      const { action_type, count } = row.get({ plain: true });
      if (action_type === 'credit') creditCount = parseInt(count, 10);
      if (action_type === 'redeem') redeemCount = parseInt(count, 10);
    });

    const rewardRevenue = await db.Order.findOne({
      attributes: [
        [
          literal('COALESCE(SUM(CAST(price AS DECIMAL(10, 2))),0)'),
          'totalRevenue',
        ],
      ],
      where: {
        store_id: storeId,
        is_cep_order: '2',
        created_at: { [Op.gte]: fromDate },
      },
      raw: true,
    });

    return {
      totalRewards,
      rewardRevenue: rewardRevenue.totalRevenue,
      credit: creditCount,
      redeem: redeemCount,
    };
  } catch (error) {
    console.error('Error in rewardReport helper:', error);
    return null;
  }
};

exports.sendReport = async (period) => {
  try {
    const eligibleSettings = await db.Settings.findAll({
      where: {
        key: 'notification_setting',
        value: {
          [Op.like]: `%${period}%`,
        },
      },
      include: {
        model: db.Store,
        attributes: ['id', 'email', 'username'],
      },
      // raw: true,
    });
    for (const element of eligibleSettings) {
      let value = JSON.parse(element.value);
      if (!value.reportMail) continue;
      try {
        const reviewReport = await this.reviewReport(period, element.store_id);
        const rewardReport = await this.rewardReport(period, element.store_id);
        const dealReport = await this.dealReport(period, element.store_id);
        // console.log("reviewReport", reviewReport);
        // console.log("rewardReport", rewardReport);
        // console.log("dealReport", dealReport);
        // const averageRatings = parseInt(reviewReport.sumRating) / reviewReport.totalReviews;
        // console.log("Here the average ratings", averageRatings);

        const sendgridObject = {
          to: `${element.store?.email}`,
          from: `no-reply@retenzy.app`,
          subject: `${period} Report for Your Store`,
          html: `
                         <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Your Retenzy Performance Report</title>
              </head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
                  <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                      <tr>
                          <td style="background-color: #E6EAFA; padding: 20px; text-align: center; color: white;">
                              <img src=${'https://thevital-production.s3.us-east-2.amazonaws.com/application-images/retenzy-logo/cropped+logo.png'} alt="Retenzy Logo" style="max-height: 30px; vertical-align: middle; margin-bottom: 10px; background-color: #E6EAFA; padding: 5px;">
                              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #0035FC;">Your Store Performance Report</h1>
                              <p style="margin: 5px 0 0; font-size: 14px; color: #052F99;">Insights for ${period} Performance</p>
                          </td>
                      </tr>

                      <tr>
                          <td style="padding: 30px;">
                          
                              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                      <td colspan="2" style="background-color: #F6F8FF; padding: 15px; border-left: 4px solid #0035FC; margin-bottom: 20px; position: relative;">
                                          <h2 style="margin: 0 0 15px 0; color: #052F99; font-size: 18px;">🌟 Reviews Performance</h2>
                                          <table width="100%">
                                              <tr>
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Total Reviews</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0035FC;">${
                                                        reviewReport?.allCounts
                                                      }</p>
                                                  </td>
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Reviews in this ${period}</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0035FC;">${
                                                        reviewReport.totalReviews
                                                      }</p>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Average Rating</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0035FC;">${parseInt(
                                                        reviewReport.averageRating
                                                      ).toFixed(1)}</p>
                                                  </td>
                                                 ${
                                                   reviewReport.topReviewedProduct
                                                     ? `<td style="padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Top Reviewed Product</p>
                                                      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #052F99;">
        ${
          reviewReport.topReviewedProduct
            ? `<a href="${reviewReport.topReviewedProductUrl}" style="color: #052F99; text-decoration: none;">${reviewReport.topReviewedProduct}</a>`
            : 'N/A'
        }
      </p>

                                                  </td>`
                                                     : ''
                                                 }
                                              </tr>
                                          </table>
                                          <div style="border-bottom: 1px solid #E0E0E0; position: absolute; bottom: 0; left: 4px; right: 0;"></div>
                                      </td>
                                  </tr>

                                  <tr>
                                      <td colspan="2" style="background-color: #F6F8FF; padding: 15px; border-left: 4px solid #F2795C; margin-top: 20px; position: relative;">
                                          <h2 style="margin: 0 0 15px 0; color: #052F99; font-size: 18px;">🏆 Rewards Insights</h2>
                                          <table width="100%">
                                              <tr>
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Total Rewards Given</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #F2795C;">${
                                                        rewardReport.totalRewards
                                                      }</p>
                                                  </td>
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Rewards This Period</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #F2795C;">${
                                                        rewardReport.credit
                                                      }</p>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Rewards Redeemed</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #F2795C;">${
                                                        rewardReport.redeem
                                                      }</p>
                                                  </td>
                                                  <td style="padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Revenue from Rewards</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #052F99;">${
                                                        rewardReport.rewardRevenue
                                                      }</p>
                                                  </td>
                                              </tr>
                                          </table>
                                          <div style="border-bottom: 1px solid #E0E0E0; position: absolute; bottom: 0; left: 4px; right: 0;"></div>
                                      </td>
                                  </tr>

                                  <tr>
                                      <td colspan="2" style="background-color: #F6F8FF; padding: 15px; border-left: 4px solid #52BD94; margin-top: 20px; position: relative;">
                                          <h2 style="margin: 0 0 15px 0; color: #052F99; font-size: 18px;">💡 Deals Performance</h2>
                                          <table width="100%">
                                              <tr>${
                                                dealReport.activeDeals === `0`
                                                  ? `This ${period} has no deals`
                                                  : `
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Active Deals</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #52BD94;">${
                                                        dealReport.activeDeals ===
                                                        0
                                                          ? `<p>No active deals this ${period}<p>`
                                                          : dealReport.activeDeals
                                                      }</p>
                                                  </td>
                                                  <td style="width: 50%; padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Orders Through Deals</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #52BD94;">${
                                                        dealReport.orderThroughDeals
                                                          ? `<p>No Order Deal this ${period}</p>`
                                                          : dealReport.orderThroughDeals
                                                      }</p>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="padding: 5px;">
                                                      <p style="margin: 0; color: #666;">Revenue Through Deals</p>
                                                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #052F99;">${
                                                        dealReport.dealsRevenue
                                                          .totalRevenue
                                                          ? '$' +
                                                            dealReport
                                                              .dealsRevenue
                                                              .totalRevenue
                                                          : 'N/A'
                                                      }</p>
                                                  </td>
                                              </tr>`
                                              }
                                          </table>
                                          <div style="border-bottom: 1px solid #E0E0E0; position: absolute; bottom: 0; left: 4px; right: 0;"></div>
                                      </td>
                                  </tr>
                              </table>

                              <p style="text-align: center; margin-top: 20px;">
                                  <a href="http://localhost:5000/" style="display: inline-block; background-color: #F2795C; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: 600;">View Full Dashboard</a>
                              </p>

                              <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
                                  Need help interpreting these results? Contact our support team at
                                  <a href="mailto:support@retenzy.com" style="color: #0035FC; text-decoration: mailto:none;">support@retenzy.com</a>
                              </p>
                          </td>
                      </tr>

                      <tr>
                          <td style="background-color: #F6F8FF; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                              <p style="margin: 0;">© 2025 Retenzy. All rights reserved.</p>
                          </td>
                      </tr>
                  </table>
              </body>
              </html>
                        `,
        };
        await this.sendgridSendMail(sendgridObject);
      } catch (err) {
        console.error(
          `Error generating report for store ${element.store_id}:`,
          err
        );
      }
    }
  } catch (error) {
    console.log('sendWeeklyReport error:', error);
  }
};
