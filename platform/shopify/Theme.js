const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');

module.exports = class Theme {
  constructor(shop, token) {
    const decryptedToken = helper.decrypt(token);
    // console.log("Decrypted Access Token:", decryptedToken);

    this.shopify = new Shopify({
      shopName: shop,
      accessToken: decryptedToken,
      apiVersion: CONFIG.shopify.api_version,
    });
    // console.log("Shopify Instance Created for Shop:", shop);

    this.theme = this.shopify.theme;
  }

  list = (params = {}) => {
    return new Promise(async (resolve) => {
      try {
        // console.log("Fetching Theme List with Params:", params);
        let response = await this.theme.list(params);
        // console.log("Theme List Response:", response);
        resolve({ data: response });
      } catch (error) {
        console.error('Error Fetching Theme List:', error);

        // Add detailed error response
        resolve({
          error: {
            message: error.message,
            statusCode: error.statusCode,
            body: error.response?.body || null,
          },
        });
      }
    });
  };
};
