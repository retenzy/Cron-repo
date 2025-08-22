const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');

module.exports = class UsageCharges {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.usageCharge = this.shopify.usageCharge;
  }
  create = async (recurringApplicationChargeId, params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.usageCharge.create(
          recurringApplicationChargeId,
          params
        );
        resolve({ data: response });
      } catch (error) {
        console.log('error of usage cahrges:', error.response.body.errors);
        resolve({ error: error });
      }
    });
  };
};
