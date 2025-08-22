const Shopify = require('shopify-api-node');
const CONFIG = require('../../config');

module.exports = class Shop {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: token,
      apiVersion: CONFIG.shopify.api_version,
    });
    this.shop = this.shopify.shop;
  }
  get = (params = {}) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.shop.get(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
