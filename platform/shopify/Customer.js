const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');

module.exports = class Customer {
  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Initializes a new instance of the Customer class.
   *
   * @param {string} shop - The name of the Shopify store.
   * @param {string} token - The encrypted access token for the store.
   *
   * Sets up the Shopify API instance with the provided shop name and access token.
   * Decrypts the token and configures the API with the specified version.
   * Initializes customer and customer address resources for the store.
   */

  /*******  1100d307-11f9-4247-871a-af3564b8e416  *******/
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.customer = this.shopify.customer;
    this.customerAddress = this.shopify.customerAddress;
  }

  list(params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customer.list(params);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  count() {
    return new Promise(async (resolve) => {
      try {
        console.log('This.customer', this.customer);
        console.log('This. customer adress', this.customerAddress);
        console.log('This.shopify', this.shopify);
        let response = await this.customer.count();
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  update(id, params) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customer.update(id, params);
        resolve({ data: response });
      } catch (error) {
        console.log('error.response.body.errors', error.response.body.errors);
        resolve({ error: error });
      }
    });
  }

  create = (payload) => {
    console.log('Payload in the Customer', payload);
    return new Promise(async (resolve) => {
      try {
        let response = await this.customer.create(payload);
        resolve({ data: response });
      } catch (error) {
        console.error('422 Error - Shopify Response:', {
          statusCode: error?.response?.statusCode,
          body: error?.response?.body,
          message: error?.message,
        });
        resolve({ error: error });
      }
    });
  };
  get(id) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customer.get(id);
        resolve({ data: response });
      } catch (error) {
        console.log('error.response.body.errors', error.response.body.errors);
        resolve({ error: error });
      }
    });
  }
  createNewAddress(customerId, addressObj) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customerAddress.create(
          customerId,
          addressObj
        );
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  getAllAddress(customerId) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customerAddress.list(customerId);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  updateAddress(customerId, adressId, addressObj) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customerAddress.update(
          customerId,
          adressId,
          addressObj
        );
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  deleteAddress(customerId, adressId) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customerAddress.delete(customerId, adressId);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }

  makeDefaultAddress(customerId, adressId) {
    return new Promise(async (resolve) => {
      try {
        let response = await this.customerAddress.default(customerId, adressId);
        resolve({ data: response });
      } catch (error) {
        resolve({ error: error });
      }
    });
  }
};
