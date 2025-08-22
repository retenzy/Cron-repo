const Shopify = require('shopify-api-node');
const CONFIG = require('../../config');
const helper = require('../../helper/app-helper');

module.exports = class Asset {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.asset = this.shopify.asset;
  }
  list(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.asset.list(id, params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }
  create(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.asset.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }
  get(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.asset.get(id, params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }
  update(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.asset.update(params);
        resolve({ data: response });
      } catch (error) {
        console.log(error);
        resolve({ error: error });
      }
    });
  }
  delete(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.asset.delete(id, params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }
};
