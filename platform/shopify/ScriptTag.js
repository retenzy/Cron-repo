const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');

module.exports = class ScriptTag {
  constructor(shop, apikey, token) {
    this.shopify = new Shopify({
      shopName: shop,
      apiKey: helper.decrypt(apikey),
      password: helper.decrypt(token),
    });
    this.script_tag = this.shopify.scriptTag;
  }
  list = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.script_tag.list(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  create = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.script_tag.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
  delete = (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.script_tag.delete(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
