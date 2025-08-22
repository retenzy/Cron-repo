const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper'); // ✅ Adjust patif needed
const CONFIG = require('../../config');
module.exports = class Graphql {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
  }

  query = (query) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.shopify.graphql(query);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
