const Shopify = require('shopify-api-node');
const helper = require('../../helper/app-helper');
const CONFIG = require('../../config');
const db = require('../../models');
const randomStrGen = require('randomstring');
const Graphql = require('./Graphql');
module.exports = class Discount {
  constructor(shop, token) {
    this.shopify = new Shopify({
      shopName: shop,
      accessToken: helper.decrypt(token),
      apiVersion: CONFIG.shopify.api_version,
    });
    this.shopDomain = shop.includes('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`;
    this.discountCode = this.shopify.discountCode;
    this.apiVersion = CONFIG.shopify.api_version || '2024-04';
    this.accessToken = helper.decrypt(token);
    console.log('Shop:', shop);
    console.log('Access Token (decrypted):', helper.decrypt(token));
    console.log('API Version:', CONFIG.shopify.api_version);
  }
  // async createDiscount(params) {
  //   try {
  //     // await this.listPriceRule()
  //     console.log('In create discount');
  //     let createPriceRuleResponse = await this.createPriceRule(params);
  //     // console.log("Crreate price rule response:", createPriceRuleResponse);
  //     if (!createPriceRuleResponse)
  //       throw new Error('Failed to create PriceRule for the discount.');

  //     let createDiscountResponse = await this.discountCode.create(
  //       createPriceRuleResponse.id,
  //       {
  //         code: params.code,
  //         type: params.type,
  //         value: params.value,
  //         applies_to: params.applies_to,
  //         customer_tags: params.customer_tags,
  //         customerId: params.customerId,
  //       }
  //     );
  //     console.log('Create discount response:', createDiscountResponse);
  //     if (!createDiscountResponse)
  //       throw new Error('Failed to create the discount.');

  //     let createCreditRedemption = await db.CreditRedemption.create({
  //       store_id: params.store_id,
  //       customer_id: params.customer_id,
  //       customerId: params.customerId,
  //       credits: params.credits_to_redeem,
  //       price_rule_id: createPriceRuleResponse.id,
  //       discount_code: params.code,
  //       credits_left:
  //         Number(params.total_credits) - Number(params.credits_to_redeem),
  //       updated_at: params.currentDate,
  //     });
  //     console.log('Create credit redemption:', createCreditRedemption);
  //     return createCreditRedemption;
  //   } catch (error) {
  //     const errorMessage = error.response
  //       ? error.response.body.errors
  //       : error.message;
  //     console.error('Discount create error: ', errorMessage);
  //     throw error;
  //   }
  // }
  async createPriceRule(params) {
    try {
      const currentDate = new Date();
      const formattedCurrentTime = currentDate.toISOString();
      const priceRule = {
        title: `CreditRedemption_${params.customerId}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'fixed_amount',
        value: `-${params.value}`,
        customer_selection: 'prerequisite',
        once_per_customer: true,
        starts_at: formattedCurrentTime,
        prerequisite_subtotal_range: {
          greater_than_or_equal_to: params.min_cart_amount,
        },
        prerequisite_customer_ids: [params.customerId],
      };

      let priceRuleCreate = await this.shopify.priceRule.create(priceRule);
      console.log('Price rule create:', priceRuleCreate);
      return priceRuleCreate;
    } catch (err) {
      console.log('priceRule create error: ', err);
    }
  }
  async listPriceRule() {
    try {
      let priceRuleList = await this.shopify.priceRule.list();
    } catch (err) {
      console.log('priceRule list error: ', err);
    }
  }
  // async createDiscountCoupon(ruleObj, store) {
  //   try {
  //     const {
  //       customer_id,
  //       name,
  //       coupon_prefix,
  //       rule_type,
  //       discount_value,
  //       min_order_value,
  //       min_order_items,
  //       selected_product_ids,
  //       selected_collection_ids,
  //       combine_with_product_discount,
  //       combine_with_order_discount,
  //       combine_with_shipping_discount,
  //       expires_after,
  //     } = ruleObj;
  //     // console.log('ruleObj==>', ruleObj);
  //     let randonStrCode = randomStrGen.generate({
  //       length: 5,
  //       charset: 'alphanumeric',
  //       capitalization: 'uppercase',
  //     });

  //     // const currentDate = new Date();
  //     // const expirationDate = new Date(
  //     //   currentDate.getTime() + expires_after * 24 * 60 * 60 * 1000
  //     // );
  //     // const isoExpiration = expirationDate.toISOString();
  //     const priceRuleData = {
  //       title: name,
  //       starts_at: new Date().toISOString(),
  //       ends_at: expires_after
  //         ? new Date(
  //             new Date().getTime() + expires_after * 24 * 60 * 60 * 1000
  //           ).toISOString()
  //         : null,
  //       customer_selection: 'prerequisite',
  //       prerequisite_customer_ids: [customer_id],
  //       allocation_method: rule_type === 'free_shipping' ? 'each' : 'across',
  //       target_selection:
  //         selected_product_ids.length || selected_collection_ids.length
  //           ? 'entitled'
  //           : 'all',
  //       target_type:
  //         rule_type === 'free_shipping' ? 'shipping_line' : 'line_item',
  //       value_type:
  //         rule_type === 'percentage_discount' ? 'percentage' : 'fixed_amount',
  //       value: -(rule_type === 'free_shipping'
  //         ? 100
  //         : parseFloat(discount_value).toFixed(2)),
  //     };
  //     if (min_order_value && min_order_value > 0) {
  //       priceRuleData.prerequisite_subtotal_range = {
  //         greater_than_or_equal_to: parseFloat(min_order_value),
  //       };
  //     }
  //     if (min_order_items && min_order_items > 0) {
  //       priceRuleData.prerequisite_quantity_range = {
  //         greater_than_or_equal_to: parseInt(min_order_items),
  //       };
  //     }

  //     if (rule_type === 'free_shipping') {
  //       priceRuleData.prerequisite_shipping_price_range = {
  //         less_than_or_equal_to: parseInt(discount_value),
  //       };
  //     }
  //     if (selected_product_ids.length > 0) {
  //       priceRuleData.entitled_product_ids = selected_product_ids.map(
  //         (ele) => ele.id
  //       );
  //     }
  //     if (selected_collection_ids.length > 0) {
  //       priceRuleData.entitled_collection_ids = selected_collection_ids.map(
  //         (ele) => ele.id
  //       );
  //     }
  //     priceRuleData.once_per_customer = true;
  //     priceRuleData.combination_policy = {
  //       order_discounts: combine_with_order_discount,
  //       product_discounts: combine_with_product_discount,
  //       shipping_discounts: combine_with_shipping_discount,
  //     };
  //     const priceRule = await this.priceRule.create(priceRuleData);
  //     // console.log('priceRule=>', priceRule);
  //     // console.log("token",this.token,"shop",this.shop)
  //     ////////////////////
  //     if (
  //       combine_with_order_discount ||
  //       combine_with_product_discount ||
  //       combine_with_shipping_discount
  //     ) {
  //       let combinesWith = {
  //         orderDiscounts: combine_with_order_discount,
  //         productDiscounts: combine_with_product_discount,
  //         shippingDiscounts: combine_with_shipping_discount,
  //       };
  //       const token = helper.decrypt(store.token);
  //       const query = `
  //   mutation updatePriceRuleCombinesWith($id: ID!, $combinesWith: DiscountCombinesWithInput!) {
  //     priceRuleUpdate(id: $id, priceRule: { combinesWith: $combinesWith }) {
  //       priceRule {
  //         id
  //         combinesWith {
  //           productDiscounts
  //           orderDiscounts
  //           shippingDiscounts
  //         }
  //       }
  //       userErrors {
  //         field
  //         message
  //       }
  //     }
  //   }
  //           `;
  //       const variables = {
  //         id: `gid://shopify/PriceRule/${priceRule.id}`,
  //         combinesWith,
  //       };
  //       const response = await fetch(
  //         `https://${store.domain}/admin/api/2023-10/graphql.json`,
  //         {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //             'X-Shopify-Access-Token': token,
  //           },
  //           body: JSON.stringify({
  //             query,
  //             variables,
  //           }),
  //         }
  //       );
  //       const result = await response.json();

  //     }
  //     ///////////////////////
  //     const discountCode = await this.discountCode.create(priceRule.id, {
  //       code: `${coupon_prefix ? coupon_prefix : 'RETENZY'}${randonStrCode}`,
  //     });
  //     return { priceRule, discountCode };
  //   } catch (error) {
  //     console.error('Failed to create discount rule:', error.message);
  //     throw error;
  //   }
  // }

  async createDiscountCoupon(ruleObj, store) {
    try {
      const {
        customer_id,
        name,
        coupon_prefix,
        rule_type,
        discount_value,
        min_order_value,
        min_order_items,
        selected_product_ids = [],
        selected_collection_ids = [],
        combine_with_product_discount,
        combine_with_order_discount,
        combine_with_shipping_discount,
        expires_after,
      } = ruleObj;

      // store.domain = 'eac983.myshopify.com';
      // store.token =
      //   '1913657391d36b2a14abaacd84a242420d00b49cf334ec24a092f1d7d92bc1a7e8994a280bf20c80b80e936e5cdc48dc8456b5b60abece28f91be74a2d5ae35cef18eceb1b3b4120a9568174adc5dbfb7da61d110c8f2da4301605ad60be02fecdbbb1c3263fd9190eb6f9489e17a31ae4fc2335640a4a118f01bdeef016e6654badb8a72fa3';

      const token = helper.decrypt(store.token);
      const randomCode = `${coupon_prefix || 'RETENZY'}${generateRandomString(5)}`;
      const startsAt = new Date().toISOString();
      const endsAt = expires_after
        ? new Date(Date.now() + expires_after * 86400000).toISOString()
        : null;

      const combinesWith = {
        orderDiscounts: !!combine_with_order_discount,
        productDiscounts: !!combine_with_product_discount,
        shippingDiscounts: !!combine_with_shipping_discount,
      };

      // let customerSelection = { all: true };
      // if (customer_id) {
      let customerSelection = {
        customers: {
          add: [`gid://shopify/Customer/${customer_id}`],
        },
      };

      // }
      // 🎯 Corrected discount value
      let value = {};
      if (rule_type === 'percentage_discount') {
        value = {
          percentage: parseFloat(discount_value) / 100,
        };
      } else if (
        rule_type === 'fixed_amount' ||
        rule_type === 'amount_discount' ||
        rule_type === 'free_product'
      ) {
        value = {
          discountAmount: {
            amount: parseFloat(discount_value),
            appliesOnEachItem: false,
          },
        };
      }

      const productIds = selected_product_ids.map(
        (p) => `gid://shopify/Product/${p.id}`
      );
      const collectionIds = selected_collection_ids.map(
        (c) => `gid://shopify/Collection/${c.id}`
      );

      const items =
        productIds.length === 0 && collectionIds.length === 0
          ? { all: true }
          : {
              products:
                productIds.length > 0
                  ? { productsToAdd: productIds }
                  : undefined,
              collections:
                collectionIds.length > 0 ? { add: collectionIds } : undefined,
            };

      let minimumRequirement = null;
      if (min_order_value && parseFloat(min_order_value) > 0) {
        minimumRequirement = {
          subtotal: {
            greaterThanOrEqualToSubtotal: parseFloat(min_order_value),
          },
        };
      } else if (min_order_items) {
        minimumRequirement = {
          quantity: {
            greaterThanOrEqualToQuantity: parseInt(min_order_items),
          },
        };
      }
      let maximumShippingPrice = null;
      if (rule_type === 'free_shipping' && discount_value) {
        maximumShippingPrice = parseFloat(discount_value);
      }
      let mutation = '';
      let variables = {};

      if (rule_type === 'free_shipping') {
        mutation = `
        mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
          discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                __typename
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
        variables = {
          freeShippingCodeDiscount: {
            title: name,
            code: randomCode,
            startsAt,
            endsAt,
            combinesWith,
            customerSelection,
            minimumRequirement,
            maximumShippingPrice,
          },
        };
      } else {
        mutation = `
        mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                __typename
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
        variables = {
          basicCodeDiscount: {
            title: name,
            code: randomCode,
            startsAt,
            endsAt,
            combinesWith,
            customerSelection,
            minimumRequirement,
            customerGets: {
              value,
              items,
            },
          },
        };
      }

      const response = await fetch(
        `https://${store.domain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
          },
          body: JSON.stringify({ query: mutation, variables }),
        }
      );
      const result = await response.json();
      console.log('GraphQL response:', JSON.stringify(result));

      const payload =
        result.data?.discountCodeBasicCreate ||
        result.data?.discountCodeFreeShippingCreate;
      if (!payload || payload.userErrors?.length > 0) {
        throw new Error(
          JSON.stringify(
            payload?.userErrors || result.errors || 'Unknown error',
            null,
            2
          )
        );
      }
      return {
        id: payload.codeDiscountNode.id.split('/').pop(),
        code: randomCode,
        ends_at: endsAt,
      };
    } catch (err) {
      console.error('Failed to create discount rule:', err);
      throw err;
    }
  }

  // Helper function (assumed to be defined elsewhere)
};
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
