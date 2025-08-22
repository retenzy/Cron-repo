const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');
module.exports = class Order {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.order = this.shopify.order;
  }
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.order.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
