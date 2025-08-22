const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');
module.exports = class Page {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.page = this.shopify.page;
  }
  list = (params = {}) => {
    return new Promise(async (resolve) => {
      try {
        // let response = await this.page.get(id)
        let response = await this.page.list(params);
        resolve({ data: response });
      } catch (error) {
        console.error('Error details:', {
          statusCode: error.response?.statusCode,
          statusMessage: error.response?.statusMessage,
          body: error.response?.body,
        });
      }
    });
  };
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.page.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  update = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.page.update(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  delete = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.page.delete(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
