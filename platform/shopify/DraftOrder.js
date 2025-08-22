const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');

module.exports = class DraftOrder {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.draftOrder = this.shopify.draftOrder;
  }
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.draftOrder.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  delete = (id) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.draftOrder.delete(id);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
