const Shopify = require('shopify-api-node');
const CONFIG = require('../../config');

module.exports = class Webhook {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: token,
      apiVersion: CONFIG.shopify.api_version,
    });
    this.webhook = this.shopify.webhook;
  }
  list = () => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.webhook.list();
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.webhook.create(params);
        resolve({ data: response });
      } catch (error) {
        console.log('client.create error: ', error.response.body);
        resolve({ error: error });
      }
    });
  };

  delete = (webhookId) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.webhook.delete(webhookId);
        resolve({ data: response });
      } catch (error) {
        console.log('client.delete error: ', error);
        resolve({ error: error });
      }
    });
  };
};
