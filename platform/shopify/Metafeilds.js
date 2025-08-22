const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');
module.exports = class Metafeilds {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.metafield = this.shopify.metafield;
  }
  list = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.metafield.list(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.metafield.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  update = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.metafield.update(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  delete = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.metafield.delete(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
