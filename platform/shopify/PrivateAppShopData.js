const Shopify = require('shopify-api-node');
module.exports = class PrivateAppShopData {
  constructor(shop_name, apikey, private_token) {
    this.shopify = new Shopify({
      shopName: shop_name,
      apiKey: apikey,
      password: private_token,
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
