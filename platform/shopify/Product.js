// const Shopify = require('shopify-api-node');
// const helper = require('../../helper/app-helper')
// const CONFIG = require('../../config');

// module.exports = class Product {
//   constructor(shop, token) {
//     this.shopify = new Shopify({
//       shopName: shop,
//       accessToken: helper.decrypt(token),
//       apiVersion:CONFIG.shopify.api_version
//     })
//     this.product = this.shopify.product
//   }
//   list = (params) => {
//     return new Promise(async (resolve) => {
//       try {
//         let response = await this.product.list(params)
//         resolve({ data: response })
//       } catch (error) {
//         resolve({ error: error })
//       }
//     })
//   }
// }
