const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');

module.exports = class pricingPlan {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });

    this.pricingPlan = this.shopify.recurringApplicationCharge;
    this.oneTimeCharge = this.shopify.applicationCharge;
  }

  createOneTime = async (params) => {
    return new Promise(async (resolve) => {
      console.log('Inside create one');
      try {
        let response = await this.oneTimeCharge.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };

  getOne = async (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.oneTimeCharge.get(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };

  create = async (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.pricingPlan.create(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };

  get = async (params) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.pricingPlan.get(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };

  delete = async (chargeId) => {
    return new Promise(async (resolve) => {
      try {
        let response = await this.pricingPlan.delete(chargeId);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  };
};
