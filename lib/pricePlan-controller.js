const db = require('../../models');
const pricingPlan = require('../../platform/shopify/PricingPlan');
const Customers = require('../../platform/shopify/Customer');
const Graphql = require('../../platform/shopify/Graphql');
const CONFIG = require('../../config');
const appUrl = CONFIG.shopify.appUrl;
const { Op, Sequelize, ValidationErrorItemOrigin } = require('sequelize');
const CustomError = require('../../helper/errors/CustomError');
const moment = require('moment');
const { autoSync } = require('../bulkOpration/bulkOpration-controller');
const helper = require('../../helper/app-helper');
const UsageCharges = require('../../platform/shopify/UsageCharges');
const { createProduct } = require('./stripe-controller');

exports.pricePlan = async (req, res, next) => {
  try {
    let discountCode = req.query['discountCode']
      ? req.query['discountCode']
      : null;
    const { id, token, domain, stripe_payment_connected } = req.storeData;

    // let customerCount = 0;
    // let client = new Customers(domain, token);
    // console.log("Testing Client", client)
    // let customersCount = await client.count();
    // if (customersCount.error)
    //   throw new CustomError(500, "customersCount.error.response");
    // customerCount = customersCount?.data;

    let plans = await db.PricingPlan.findAll({
      where: [
        {
          is_active: '1',
          [Op.or]: [{ store_id: null }, { store_id: id }],
        },
      ],
      separate: true,
      order: [
        ['plan_type', 'ASC'],
        ['id', 'ASC'],
        ['customer_limit', 'ASC'],
      ],
    });

    if (!plans) throw new CustomError(404, 'Plans not found');

    let newPlansData = [];
    let discountDetails = null;

    if (discountCode) {
      let discountData = await db.PricingPlanDiscounts.findOne({
        where: { discount_code: discountCode },
      });

      if (
        !discountData ||
        (discountData.store_id && discountData.store_id != id)
      )
        throw new CustomError(
          401,
          `Discount ${discountCode} is not applicable for this store.`
        );

      discountDetails = discountData;
      plans.map((plan, planIndex) => {
        let tempData = plan.toJSON();
        tempData.discounted_price = null;
        tempData.annual_discounted_price = null; // New field for annual discount

        if (discountData && discountData?.plans?.includes(plan.id)) {
          let discountAmount = discountData.dataValues.discount_amount;
          if (discountData.dataValues.plan_type == 'monthly') {
            if (discountData.dataValues.discount_type === 'amount') {
              let discountedPrice = (tempData.price - discountAmount).toFixed(
                2
              );
              discountedPrice < 0
                ? (tempData.discounted_price = 0)
                : (tempData.discounted_price = discountedPrice);
            } else if (discountData.dataValues.discount_type === 'percentage') {
              let discountedPrice = (
                tempData.price -
                (tempData.price * discountAmount) / 100
              ).toFixed(2);
              discountedPrice < 0
                ? (tempData.discounted_price = 0)
                : (tempData.discounted_price = discountedPrice);
            }
          } else {
            tempData.discounted_price = tempData.price;
          }
          // Monthly discount calculation
          // Annual discount calculation
          if (tempData.annual_discount && tempData.annual_discount > 0) {
            const annualPrice =
              (tempData.price -
                ((tempData.price * plan.annual_discount) / 100).toFixed(0)) *
              12;
            // Calculate annual price with discount for amount or percentage types
            if (discountData.dataValues.plan_type == 'annually') {
              if (discountData.dataValues.discount_type === 'amount') {
                let annualDiscountedPrice = annualPrice - discountAmount;
                annualDiscountedPrice < 0
                  ? (tempData.annual_discounted_price = 0)
                  : (tempData.annual_discounted_price = annualDiscountedPrice);
              } else if (
                discountData.dataValues.discount_type === 'percentage'
              ) {
                let annualDiscountedPrice = (
                  annualPrice -
                  (annualPrice * discountAmount) / 100
                ).toFixed(2);
                annualDiscountedPrice < 0
                  ? (tempData.annual_discounted_price = 0)
                  : (tempData.annual_discounted_price = annualDiscountedPrice);
              }
            } else {
              tempData.annual_discounted_price = annualPrice;
            }
          }
        }

        newPlansData.push(tempData);
      });
    } else {
      plans.map((plan, planIndex) => {
        let tempData = plan.toJSON();
        tempData.discounted_price = null;

        if (plan.store_tags !== null) {
          let tagCheck = tempData.store_tags.some((item) =>
            req.storeData.tags.includes(item)
          );
          if (!tagCheck) plans.splice(index, 1);
        }

        newPlansData.push(tempData);
      });
    }

    res.status(200).send({
      message: 'Fetched Successfully',
      data: {
        plans: newPlansData,
        // customerCount: customerCount,
        stripe_payment_connected,
        discountDetails: discountDetails,
      },
    });
  } catch (error) {
    console.log('Error in pricePlan', error.message);
    error.storeId = req.storeData.id;
    next(error);
  }
};

exports.getSelectedPlan = async (req, res, next) => {
  let { id, pricing_plan_id, is_paid, email_notification } = req.storeData;
  let message = { message: 'Plan not selected', data: null };
  try {
    let expiry_date = null;
    if (is_paid == '1') {
      let applicationCharges = await db.ApplicationCharges.findOne({
        where: { store_id: id, status: 'active' },
      });
      if (applicationCharges) {
        message.message = 'Selected plan';
        expiry_date = applicationCharges.plan_expiry_date;
      }
      let response = await db.PricingPlan.findOne({
        where: { id: pricing_plan_id },
        attributes: [
          'id',
          'orders',
          'ltd_orders',
          'price',
          'credit_rule_limit',
          'customer_limit',
          'email_limit',
          'free_trial_days',
          'upsell_percentage',
          'plan_name',
          'annual_discount',
          'product_in_deal',
          'deal_limit',
          'amazon_review',
        ],
        include: {
          model: db.PlanFeatures,
          attributes: ['name'],
        },
      });

      if (!response || response.error)
        throw new CustomError(400, 'Error to fetch selected plan');
      response = JSON.parse(JSON.stringify(response));
      response.plan_features = response.plan_features.map(
        (feature) => feature.name
      );
      response.expiry_date = expiry_date;
      response.marketing_app = email_notification;
      response.plan_name = response.plan_name;
      response.isAnnual = applicationCharges?.is_annual == '1';
      if (response.isAnnual) {
        let discount = response.annual_discount;
        let price = response.price;
        response.price = price - (price * discount) / 100;
      }

      message.data = response;
    }
    res.status(200).send(message);
  } catch (error) {
    error.storeId = req.storeData.id;
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  // console.log('inside create creteatePlan');
  try {
    let discountCode = req.body['discountCode'];
    // console.log('req.body', req.body);
    let { id, domain, token, is_freetrial_used, is_test_store } = req.storeData;
    let applicationCharges = await db.ApplicationCharges.findOne({
      where: { store_id: id, status: 'active' },
    });
    let confirm;
    let { planId, isAnnual, email_marketing } = req.body;
    let pricePlanResponse = await db.PricingPlan.findOne({
      where: {
        id: planId,
      },
    });
    if (!pricePlanResponse) throw new CustomError(404, 'Plan not found');
    let pricePlanResponseJSON = pricePlanResponse.toJSON();
    pricePlanResponseJSON.discountData = null;
    let priceObj = {
      name: pricePlanResponseJSON.plan_name,
      price: pricePlanResponseJSON.lifetime_price,
      capped_amount: pricePlanResponseJSON.capped_amount,
      terms: 'For more queries, mail us on mailto:support@retenzy.app',
      return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0`,
    };
    if (is_test_store == '1') {
      priceObj.test = true;
    }

    if (discountCode) {
      let discountData = await db.PricingPlanDiscounts.findOne({
        where: { discount_code: discountCode },
      });

      if (
        !discountData ||
        (discountData.store_id && discountData.store_id != id)
      )
        throw new CustomError(
          404,
          `Discount ${discountCode} is not applicable for this store.`
        );

      pricePlanResponseJSON.discountData = discountData.toJSON();

      if (discountData.plan_type == 'lifetime') {
        // console.log('DiscountData for Limit test', discountData);
        const client = new pricingPlan(domain, token);

        priceObj = {
          name: pricePlanResponseJSON.plan_name,
          price: pricePlanResponseJSON.lifetime_price,
          capped_amount: pricePlanResponseJSON.capped_amount,
          terms: 'For more queries, mail us on mailto:support@retenzy.app',
          return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0?discountCode=${discountCode}`, // Include discountCode here
          test: is_test_store == '1' ? true : false,
        };

        const planResponse = await client.createOneTime(priceObj);
        // console.log('planResponse for discountCode', planResponse);
        confirm = planResponse.data.confirmation_url;
        if (planResponse.error) throw new CustomError(500, 'Plan not created');

        return res.status(200).send({
          message: 'success',
          data: {
            planResponse,
            redirectUrl: planResponse.data.confirmation_url,
            discountCode,
          },
        });
      }
    }

    if (isAnnual) {
      confirm = await this.createAnnualPlan(
        id,
        planId,
        email_marketing,
        domain,
        token,
        pricePlanResponseJSON,
        is_freetrial_used,
        is_test_store
      );
    } else {
      if (pricePlanResponseJSON.discountData) {
        if (is_test_store == '1') {
          pricePlanResponseJSON.test = true;
        } else {
          pricePlanResponseJSON.test = false;
        }

        confirm = await this.createRecurringDiscountPlan(
          id,
          planId,
          email_marketing,
          domain,
          token,
          pricePlanResponseJSON,
          is_freetrial_used,
          isAnnual,
          discountCode
        );
      } else if (pricePlanResponseJSON.plan_name === 'Free') {
        const chargeId = applicationCharges.charge_id;
        const client = new pricingPlan(domain, token);
        const cancellationResponse = await client.delete(Number(chargeId));
        if (cancellationResponse.error) {
          throw new CustomError(500, 'Failed to cancel the application charge');
        }
        await db.Store.update({ is_paid: '1' }, { where: { id: id } });
        let priceObj = {
          name: pricePlanResponse.plan_name,
          price: pricePlanResponse.price,
          capped_amount: pricePlanResponse.capped_amount,
          terms: 'For more queries, mail us on mailto:support@retenzy.app',
          return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0`,
        };
        if (is_test_store == '1') {
          priceObj.test = true;
        }
        confirm = await this.freePlanRecurringChargeCallBack(
          req,
          res,
          id,
          pricePlanResponse.id,
          'retenzy',
          0
        );
      } else {
        const client = new pricingPlan(domain, token);
        let priceObj = {
          name: pricePlanResponse.plan_name,
          price: pricePlanResponse.price,
          capped_amount: pricePlanResponse.capped_amount,
          terms: 'For more queries, mail us on mailto:support@retenzy.app',
          return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0`,
        };
        if (is_test_store == '1') {
          priceObj.test = true;
        }
        if (is_freetrial_used == '0')
          priceObj.trial_days = pricePlanResponse.free_trial_days;
        const planResponse = await client.create(priceObj);
        if (planResponse.error) throw new CustomError(500, 'Plan not created');
        confirm = planResponse.data.confirmation_url;
      }
    }

    res.status(200).send({
      message: 'success',
      data: { redirectUrl: confirm, discountCode },
    });
  } catch (error) {
    console.log('error', error);
    error.storeId = req.storeData.id;
    next(error);
  }
};

exports.createAnnualPlan = async (
  id,
  planId,
  email_marketing,
  domain,
  token,
  pricePlanResponse,
  is_freetrial_used,
  is_test_store
) => {
  // console.log('inside create annaula plan');
  try {
    let client = new Graphql(domain, token);

    // Determine trial days
    let trial_days = 0;
    if (is_freetrial_used == '0')
      trial_days = pricePlanResponse.free_trial_days;

    // Calculate annual price with discount
    let discount = pricePlanResponse.annual_discount;
    let price = pricePlanResponse.price * 12;
    let total_price = price - (price * discount) / 100;

    // If discount data exists, apply it
    let discountDetails = null;
    if (pricePlanResponse.discountData) {
      const discountType = pricePlanResponse.discountData.discount_type;
      const discountAmount =
        pricePlanResponse.discountData.discount_type === 'amount'
          ? pricePlanResponse.discountData.discount_amount
          : pricePlanResponse.discountData.discount_amount / 100;

      discountDetails = `
        discount: { 
          value: { ${discountType}: ${discountAmount} },
          ${pricePlanResponse.discountData.duration_limit_in_intervals != 0 ? `durationLimitInIntervals: ${pricePlanResponse.discountData.duration_limit_in_intervals}` : ''}
        }
      `;
    }

    // Construct GraphQL query with discount if applicable
    let query = `
      mutation { 
        appSubscriptionCreate( 
          name: "${pricePlanResponse.plan_name}" 
          returnUrl: "${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/1?discountCode=${pricePlanResponse.discountData ? pricePlanResponse.discountData.discount_code : ''}" 
          trialDays: ${trial_days} 
          test: ${is_test_store == '1' ? true : false}  
          lineItems: [
            { 
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: "${total_price}", currencyCode: USD }, 
                  ${discountDetails ? discountDetails : ''}
                  interval: ANNUAL 
                }
              }
            }
          ] 
        ) {
          confirmationUrl 
          appSubscription { id } 
        } 
      }
    `;

    let applicationCharge = await client.query(query);

    if (applicationCharge.error) throw new CustomError(500, 'Plan not created');

    let confirm = applicationCharge.data.appSubscriptionCreate.confirmationUrl;
    return confirm;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

exports.createRecurringDiscountPlan = async (
  id,
  planId,
  email_marketing,
  domain,
  token,
  pricePlanResponse,
  is_freetrial_used,
  isAnnual,
  discountCode
) => {
  try {
    let client = new Graphql(domain, token);
    let trial_days = 0;
    if (is_freetrial_used == '0')
      trial_days = pricePlanResponse.free_trial_days;
    // console.log('isANual status', isAnnual);
    let isAnnualStatus = isAnnual ? '1' : '0';
    let discountDetails = `
    discount: { 
      value: { ${pricePlanResponse.discountData.discount_type}: ${pricePlanResponse.discountData.discount_type == 'amount' ? pricePlanResponse.discountData.discount_amount : pricePlanResponse.discountData.discount_amount / 100} },
      ${pricePlanResponse.discountData.duration_limit_in_intervals != 0 ? `, durationLimitInIntervals: ${pricePlanResponse.discountData.duration_limit_in_intervals}` : ''}
    }
  `;
    let query = `
    mutation { 
      appSubscriptionCreate( 
        name: "${pricePlanResponse.plan_name}" 
        returnUrl: "${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/${isAnnualStatus}/?discountCode=${discountCode}" 
        trialDays: ${trial_days} 
        test: ${pricePlanResponse.test} 
        lineItems: [
          { 
            plan: {
              appRecurringPricingDetails: {
                price: { amount: "${pricePlanResponse.price}", currencyCode: USD }, 
                ${discountDetails} 
                interval: EVERY_30_DAYS 
              }
            }
          }
        ] 
      ) {
        confirmationUrl 
        appSubscription { id } 
      } 
    }
  `;

    // console.log('query', query);

    // let query = `mutation { appSubscriptionCreate( name: "${pricePlanResponse.plan_name}" returnUrl: "${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/1?discountCode=${pricePlanResponse.discountData.discount_code}" trialDays: ${trial_days} test: ${pricePlanResponse.test} lineItems: [{ plan: {appRecurringPricingDetails: {price: {amount: "${pricePlanResponse.price}", currencyCode: USD}, 	discount: { value: { ${pricePlanResponse.discountData.discount_type} : ${pricePlanResponse.discountData.discount_amount} }, durationLimitInIntervals: ${pricePlanResponse.discountData.duration_limit_in_intervals} }, interval: EVERY_30_DAYS}} }] )  { confirmationUrl appSubscription { id } } }`;

    // console.log('discountDetails', discountDetails);

    let applicationCharge = await client.query(query);
    // console.log('applicationCharge', applicationCharge);
    if (applicationCharge.error) throw new CustomError(500, 'Plan not created');

    let confirm = applicationCharge.data.appSubscriptionCreate.confirmationUrl;
    // console.log('confirm', confirm);
    return confirm;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

exports.recurringChargeCallBack = async (req, res, next) => {
  // console.log('inside recurring charge callback');
  try {
    const { discountCode, charge_id } = req.query;
    // console.log('Req.query for discountCode', req.query);
    // console.log('Req.body inside recurring charge callback', req.body);
    const { id, planId, email_marketing, annual } = req.params;

    const shopResponse = await db.Store.findOne({ where: { id } });
    if (!shopResponse) throw new CustomError(403, 'Bad request');

    const { token, domain, referal_Id, email: storeEmail } = shopResponse;

    // Remove Klaviyo integration if marketing preference changed
    if (
      shopResponse.email_notification === 'klaviyo' &&
      email_marketing !== 'klaviyo'
    ) {
      const integrationData = await db.Integration.findOne({
        where: { store_id: id, app: 'klaviyo' },
      });

      if (integrationData) {
        await db.Integration.destroy({
          where: { store_id: id, app: 'klaviyo' },
        });
      }
    }
    let dataExists;
    if (discountCode) {
      dataExists = await db.PricingPlanDiscounts.findOne({
        where: { discount_code: discountCode },
      });
    }

    const client = new pricingPlan(domain, token);
    let recurringCharge;
    let is_lifetime = '0';

    if (dataExists?.plan_type === 'lifetime') {
      recurringCharge = await client.getOne(charge_id);
      is_lifetime = '1';
    } else {
      recurringCharge = await client.get(charge_id);
    }

    if (recurringCharge.error || !recurringCharge.data) {
      return res.redirect(`${appUrl}/admin/setting?pricingPlan=true`);
    }

    const status = recurringCharge.data.status;
    if (status !== 'active') {
      return res.redirect(`${appUrl}/admin/setting?pricingPlan=true`);
    }

    await db.ApplicationCharges.destroy({
      where: { store_id: id },
    });

    // Store subscription & update plan
    await recurringChargesCreate(
      recurringCharge.data,
      id,
      annual,
      dataExists,
      referal_Id,
      shopResponse,
      discountCode
    );

    const is_freetrial_used = recurringCharge.data.trial_days > 0;
    // console.log('Before Calling updateStorePlan', {
    //   discountCode,
    //   is_lifetime,
    // });
    await updateStorePlan(
      id,
      planId,
      is_freetrial_used,
      email_marketing,
      is_lifetime,
      discountCode
    );
    autoSync(shopResponse);

    // Determine redirect route
    let redirectPathname = `${appUrl}/admin/home`;
    const checkSkipVal = await db.Tour.findOne({ where: { store_id: id } });
    if (checkSkipVal?.skip === '1') {
      redirectPathname = `${appUrl}/admin/home`;
    }

    // Handle discount usage
    if (discountCode) {
      if (dataExists?.type === 'multiUser') {
        await db.PricingPlanDiscounts.create({
          ...dataExists.dataValues,
          store_id: parseInt(id, 10),
          is_used: 1,
        });
      } else {
        await db.PricingPlanDiscounts.update(
          { is_used: 1, store_id: id },
          { where: { discount_id: dataExists.discount_id } }
        );
      }
    }

    return res.redirect(redirectPathname);
  } catch (error) {
    console.error('Recurring charge callback error:', error);
    res.redirect(`${appUrl}/admin/setting?pricingPlan=true`);
    next(error);
  }
};

exports.freePlanRecurringChargeCallBack = async (
  req,
  res,
  id,
  planId,
  email_marketing,
  annual
) => {
  try {
    // const charge_id = req.query.charge_id;
    let shopResponse = await db.Store.findOne({ where: { id: id } });

    if (!shopResponse) throw new CustomError(403, 'Bad requrest');

    if (
      shopResponse.email_notification == 'klaviyo' &&
      email_marketing != 'klaviyo'
    ) {
      let integrationData = await db.Integration.findOne({
        where: { store_id: id, app: 'klaviyo' },
      });
      if (integrationData) {
        await db.Integration.destroy({
          where: { store_id: id, app: 'klaviyo' },
        });
      }
    }
    const { token, domain } = shopResponse;
    let recurringCharge = {
      store_id: id,
      id: null,
      planId: planId,
      status: 'active',
      isAnnual: '0',
      billing_on: moment().format(),
      activated_on: moment.now(),
    };

    const status = recurringCharge.status;

    await db.ApplicationCharges.destroy({
      where: {
        store_id: id,
        // status: "active"
      },
    });
    await recurringChargesCreate(recurringCharge, id, annual, shopResponse);

    // auto data syncing from shopify
    autoSync(shopResponse);

    await db.Store.update({ pricing_plan_id: planId }, { where: { id: id } });
    if (shopResponse.referal_Id) {
      const options = {
        method: 'POST',
        headers: { 'X-API-KEY': CONFIG.FIRST_PROMOTER_API_KEY },
      };

      fetch(
        `https://firstpromoter.com/api/v1/track/cancellation?email=${shopResponse.email}`,
        options
      )
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
    }
    let redirectPathname = `${appUrl}/admin/home`;
    let checkSkipVal = await db.Tour.findOne({ where: { store_id: id } });
    if (checkSkipVal && checkSkipVal.skip && checkSkipVal.skip == '1')
      redirectPathname = `${appUrl}/admin/home`;

    return redirectPathname;
    // res.redirect(redirectPathname)
  } catch (error) {
    console.log('pricingPlan-error', error);
    res.redirect(`${appUrl}/admin/setting?pricingPlan=true`);
  }
};

// let recurringChargesCreate = async (charge, storeId, annual, discountData, referal_Id, storeData, discountCode) => {
//   try {
//     console.log("console inside recurringChargesCreate");
//     console.log("discount code", discountCode);

//     const chargeObj = {
//       store_id: storeId,
//       charge_id: charge.id,
//       status: charge.status,
//       transaction_data: JSON.stringify(charge),
//       priceplan_billing_on: charge.billing_on,
//       priceplan_activated_on: charge.activated_on,
//       is_annual: annual,
//     };

//     if (annual == "1") {
//       chargeObj.plan_expiry_date = moment(chargeObj.priceplan_billing_on).add(365, "days").format("YYYY-MM-DD");
//     } else {
//       chargeObj.plan_expiry_date = moment(chargeObj.priceplan_billing_on).add(30, "days").format("YYYY-MM-DD");
//     }

//     // Handle affiliate commission through FirstPromoter API if referral ID exists
//     if (referal_Id) {
//       const options = {
//         method: "GET",
//         headers: { "X-API-KEY": CONFIG.FIRST_PROMOTER_API_KEY },
//       };

//       // Calculate commission amount
//       let commissionAmount;
//       if (discountData?.discount_type === "percentage") {
//         const discountPercentage = parseFloat(discountData.discount_amount || 0);
//         commissionAmount = parseFloat(charge.price) * (1 - discountPercentage / 100) * 100;
//       } else if (discountData?.discount_type === "amount") {
//         commissionAmount = (parseFloat(charge.price) - parseFloat(discountData.discount_amount)) * 100;
//       } else {
//         commissionAmount = parseFloat(charge.price) * 100;
//       }

//       // Determine plan type
//       let plan_type;
//       if (annual == "1") {
//         plan_type = "**yearly**";
//       } else {
//         plan_type = "**monthly**";
//       }

//       console.log("email:", encodeURIComponent(storeData.email));
//       console.log("parseFloat(charge.price):", parseFloat(charge.price));
//       console.log("commissionAmount:", commissionAmount);
//       console.log("plan_type:", plan_type);
//       console.log("type of dicount code ", typeof discountCode);
//       console.log('referal id', referal_Id);
//       const isValidDiscount = discountCode && discountCode !== "undefined" && discountCode !== "null";
//       try {
//         if (isValidDiscount) {
//           console.log("inside if");
//           const promoterRes = await fetch(`https://firstpromoter.com/api/v1/promoters/show?ref_id=${referal_Id}`, options);
//           const promoterData = await promoterRes.json();
//           const promoMatch = promoterData?.promo_codes?.find((promo) => promo.code?.toLowerCase() === discountCode?.toLowerCase());
//           if (promoMatch) {
//             console.log("promocode matched");
//             fetch(`https://firstpromoter.com/api/v1/track/sale?email=${encodeURIComponent(storeData.email)}&event_id=${charge.id}&amount=${commissionAmount}&plan=${plan_type}&ref_id=${referal_Id}`, options)
//               .then((response) => response.json())
//               .then((response) => console.log("response from firstpromoter api", response))
//               .catch((err) => console.error("error in firstpromoter api", err));
//           }
//         } else {
//           console.log("inside else url:", `https://firstpromoter.com/api/v1/track/sale?email=${encodeURIComponent(storeData.email)}&event_id=${charge.id}&amount=${commissionAmount}&plan=${plan_type}&ref_id=${referal_Id}`);
//           fetch(`https://firstpromoter.com/api/v1/track/sale?email=${encodeURIComponent(storeData.email)}&event_id=${charge.id}&amount=${commissionAmount}&plan=${plan_type}&ref_id=${referal_Id}`, options)
//             .then((response) => response.json())
//             .then((response) => console.log("response from firstpromoter api", response))
//             .catch((err) => console.error("error in firstpromoter api", err));
//         }
//       } catch (err) {
//         console.error("Error in FirstPromoter API logic:", err);
//       }
//     }

//     return await db.ApplicationCharges.create(chargeObj);
//   } catch (error) {
//     console.log("recurringChargesCreate => ", error);
//     throw new CustomError(500, "recurring charges not instered");
//   }
// };

let recurringChargesCreate = async (
  charge,
  storeId,
  annual,
  discountData,
  referal_Id,
  storeData,
  discountCode
) => {
  try {
    const chargeObj = {
      store_id: storeId,
      charge_id: charge.id,
      status: charge.status,
      transaction_data: JSON.stringify(charge),
      priceplan_billing_on: charge.billing_on,
      priceplan_activated_on: charge.activated_on,
      is_annual: annual,
    };

    if (annual == '1') {
      chargeObj.plan_expiry_date = moment(chargeObj.priceplan_billing_on)
        .add(365, 'days')
        .format('YYYY-MM-DD');
    } else {
      chargeObj.plan_expiry_date = moment(chargeObj.priceplan_billing_on)
        .add(30, 'days')
        .format('YYYY-MM-DD');
    }

    const options = {
      method: 'GET',
      headers: { 'X-API-KEY': CONFIG.FIRST_PROMOTER_API_KEY },
    };

    // Calculate commission amount
    let commissionAmount;
    if (discountData?.discount_type === 'percentage') {
      const discountPercentage = parseFloat(discountData.discount_amount || 0);
      commissionAmount =
        parseFloat(charge.price) * (1 - discountPercentage / 100) * 100;
    } else if (discountData?.discount_type === 'amount') {
      commissionAmount =
        (parseFloat(charge.price) - parseFloat(discountData.discount_amount)) *
        100;
    } else {
      commissionAmount = parseFloat(charge.price) * 100;
    }

    // Determine plan type
    let plan_type = annual == '1' ? '**yearly**' : '**monthly**';

    const isValidDiscount =
      discountCode && discountCode !== 'undefined' && discountCode !== 'null';
    let commissionTracked = false;

    // Handle FirstPromoter commission tracking
    if (isValidDiscount) {
      try {
        // Get list of all promoters
        const promotersRes = await fetch(
          'https://firstpromoter.com/api/v1/promoters/list',
          options
        );
        if (!promotersRes.ok) {
          throw new Error(`HTTP error! status: ${promotersRes.status}`);
        }
        const promotersData = await promotersRes.json();

        // Find a promoter with matching promo code
        let matchingPromoter = null;
        for (const promoter of promotersData) {
          const promoMatch = promoter.promo_codes?.find(
            (promo) => promo.code?.toLowerCase() === discountCode?.toLowerCase()
          );
          if (promoMatch) {
            matchingPromoter = promoter;
            break;
          }
        }

        if (matchingPromoter) {
          // Track sale without ref_id if promo code matches
          const saleUrl = `https://firstpromoter.com/api/v1/track/sale?email=${encodeURIComponent(storeData.email)}&event_id=${charge.id}&amount=${commissionAmount}&plan=${plan_type}`;

          const saleRes = await fetch(saleUrl, options);
          if (!saleRes.ok) {
            throw new Error(`HTTP error! status: ${saleRes.status}`);
          }
          const saleData = await saleRes.json();
          // console.log('First Promoter sale tracking response:', saleData);
          commissionTracked = true;
        }
      } catch (err) {
        console.error('Error in FirstPromoter API logic:', err);
        // Continue execution even if FirstPromoter API fails
      }
    }

    // Only track referral if commission hasn't been tracked through promo code
    if (!commissionTracked && referal_Id) {
      try {
        const saleUrl = `https://firstpromoter.com/api/v1/track/sale?email=${encodeURIComponent(storeData.email)}&event_id=${charge.id}&amount=${commissionAmount}&plan=${plan_type}&ref_id=${referal_Id}`;

        const saleRes = await fetch(saleUrl, options);
        if (!saleRes.ok) {
          throw new Error(`HTTP error! status: ${saleRes.status}`);
        }
        const saleData = await saleRes.json();
        // console.log('First Promoter sale tracking response:', saleData);
      } catch (err) {
        console.error('Error tracking sale with referral ID:', err);
        // Continue execution even if FirstPromoter API fails
      }
    }

    // Create application charge record
    const createdCharge = await db.ApplicationCharges.create(chargeObj);
    return createdCharge;
  } catch (error) {
    console.log('recurringChargesCreate => ', error);
    throw new CustomError(500, 'recurring charges not inserted');
  }
};

let updateStorePlan = async (
  storeId,
  planId = 208,
  trial_days,
  email_marketing,
  is_lifetime,
  discountCode
) => {
  try {
    const storeObj = {
      pricing_plan_id: planId ? planId : null,
      is_paid: planId ? '1' : '0',
      is_send_mail: 0,
      is_lifetime,
      discount_coupon: discountCode,
    };
    if (email_marketing) {
      storeObj.email_notification = email_marketing;
    }
    if (trial_days) {
      storeObj.is_freetrial_used = '1';
    }
    await db.Store.update(storeObj, { where: { id: storeId } });
  } catch (error) {
    console.log(error);
    throw new CustomError(500, 'Error to update store');
  }
};

exports.checkPlan = async (store) => {
  try {
    if (store.is_paid == '0') return { error: 'plan_not_selected' };

    let applicationCharges = await db.ApplicationCharges.findOne({
      where: { store_id: store.id, status: 'active' },
    });
    if (!applicationCharges) return { error: 'plan_not_selected' };

    let selectedPlan = await store.getPricing_plan();
    if (!selectedPlan) return { error: 'plan_not_selected' };

    let is_annual = applicationCharges.is_annual;
    // const billing_on = applicationCharges.priceplan_billing_on
    const plan_expiry_date = moment(applicationCharges.plan_expiry_date)
      .add(3, 'days')
      .format('YYYY-MM-DD');
    const current_date = moment().format('YYYY-MM-DD');

    if (plan_expiry_date < current_date) {
      const client = new pricingPlan(store.domain, store.token);

      let recurringCharge = await client.get(applicationCharges.charge_id);
      if (
        recurringCharge.error ||
        !recurringCharge.data ||
        recurringCharge.data.status != 'active'
      ) {
        if (store.is_lifetime == '0') {
          await db.ApplicationCharges.destroy({
            where: { store_id: store.id },
          });
          await updateStorePlan(store.id);
        }
        return { error: 'plan_exprired' };
      }

      const newCharges = recurringCharge.data;

      if (newCharges.status == 'active') {
        await db.ApplicationCharges.destroy({ where: { store_id: store.id } });

        applicationCharges = await recurringChargesCreate(
          newCharges,
          store.id,
          is_annual
        );

        selectedPlan = await db.PricingPlan.findOne({
          where: { plan_name: newCharges.name },
        });
        if (!selectedPlan) return { error: 'plan_not_found' };
        // console.log('update Store plan inside !selectedPlan', selectedPlan);
        await updateStorePlan(store.id, selectedPlan.id);
      }
    }

    let orderCountStartDate = applicationCharges.priceplan_billing_on;

    if (is_annual == '1') {
      while (
        moment(current_date).diff(moment(orderCountStartDate), 'days') > 30
      ) {
        orderCountStartDate = moment(orderCountStartDate)
          .add(30, 'days')
          .format('YYYY-MM-DD');
      }
    } else {
    }

    if (orderCountStartDate <= current_date) {
      const numberOfOrders = selectedPlan.orders;

      const draftOrderData = await db.Order.findAll({
        where: {
          store_id: store.id,
          is_cep_order: '1',
          [Op.and]: [
            {
              order_created_at: {
                [Op.gte]: orderCountStartDate,
              },
            },
            {
              order_created_at: {
                [Op.lte]: current_date,
              },
            },
          ],
        },
        attributes: [
          [
            db.sequelize.fn('COUNT', db.sequelize.col('order_id')),
            'draftOrderData',
          ],
        ],
      });

      let draftOrderCount = draftOrderData[0].dataValues.draftOrderData;
      draftOrderCount = draftOrderCount ? draftOrderCount : 0;
      if (draftOrderCount > numberOfOrders)
        return { error: 'order_limit_reached' };
    }
    return { error: false };
  } catch (error) {
    console.log('error', error);
    return { error: 'Something went wrong' };
  }
};

exports.customPlanMail = async (req, res, next) => {
  try {
    let { domain, username } = req.storeData;
    let {
      full_name,
      message,
      email,
      phone,
      company_name,
      userRequirement,
      subject,
    } = req.body;
    const sendgridObject = {
      // to: `${CONFIG.CUSTOM_PLAN.cc_mail_id}`,
      // to: "support@retenzy.com",
      to: `${CONFIG.EMAIL.SUPPORTMAIL}`,
      from: `${CONFIG.EMAIL.SENDERMAIL}`,
      subject: `${subject}`,
      html: `
      <html>
      <body>
      <p>Hey ,</p>
      <p>${userRequirement}</p><br/>
      <p>Merchant deatails: </p><br/>
      <p>Store name : ${domain}</p>
      <p>Full name : ${full_name} </p>
      <p>Company name : ${company_name}</p>
      <p>Contact no. : ${phone}</p>
      <p>Message : ${message} </p>
      <p>Please contact with customer on ${email}</p>
      </body>
      </html>`,
    };
    let response = await helper.sendgridSendMail(sendgridObject);
    if (response.error)
      throw new CustomError(400, response.error.response.body);
    res.status(200).send({ message: 'Mail sent successfully' });
  } catch (error) {
    console.log('error', error);
    error.storeId = req.storeData.id;
    next(error);
  }
};

exports.ceratePricingPlan = async (req, res, next) => {
  console.log('inside create pricing plan');
  try {
    let data = req.body;
    for (let plan of data) {
      let {
        description,
        is_active,
        plan_features,
        plan_type,
        capped_amount,
        annual_discount,
        plan_name,
        upsell_percentage,
        free_trial_days,
        customer_limit,
        orders,
        price,
      } = plan;
      let stripe_product_id = null;
      await db.PricingPlan.destroy({ where: { plan_name: plan_name } });

      if (plan_type != 'CUSTOM') {
        let product = await createProduct(plan_name);
        if (product.error && !product.data)
          throw new CustomError(500, product.error);
        stripe_product_id = product.data.id;
      }

      let planObject = {
        orders: orders,
        price: price,
        free_trial_days: free_trial_days,
        customer_limit: customer_limit,
        upsell_percentage: upsell_percentage,
        plan_name: plan_name,
        description: description,
        is_active: is_active,
        plan_type: plan_type,
        capped_amount: capped_amount,
        annual_discount: annual_discount,
      };

      planObject.stripe_product_id = stripe_product_id;

      let planResponse = await db.PricingPlan.create(planObject);
      if (planResponse && plan_type != 'CUSTOM') {
        for (let feature of plan_features) {
          let object = {
            key: feature.key,
            name: feature.name,
            description: feature.description,
            plan_id: planResponse.id,
          };

          await db.PlanFeatures.create(object);
        }
      }
    }
    res.status(200).send({ message: 'Success' });
  } catch (error) {
    console.log('error', error);
    error.storeId = req?.storeData?.id;
    next(error);
  }
};
// Function to fetch the next billing date from Shopify's GraphQL API
const fetchNextBillingDate = async (domain, token) => {
  try {
    const query = `
    {
      currentAppInstallation {
        activeSubscriptions {
          currentPeriodEnd
          createdAt
          test
        }
      }
    }
  `;

    // Make a POST request to Shopify's GraphQL API
    const response = await fetch(
      `https://${domain}/admin/api/2023-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': helper.decrypt(token),
        },
        body: JSON.stringify({ query }),
      }
    );

    const result = await response.json();
    // Return the next billing date if available
    if (result.data) {
      return result.data.currentAppInstallation.activeSubscriptions[0]
        .currentPeriodEnd;
    } else {
      throw new Error(
        'No active subscription found or failed to fetch billing details.'
      );
    }
  } catch (error) {
    // console.error("Error fetching billing date", error.message);
    // return null;
    throw error;
  }
};
// Cron job to fetch and update billing dates for stores with paid_status = 1
exports.updateBillingDatesForPaidStores = async () => {
  try {
    // Fetch all stores with paid_status = 1
    const stores = await db.Store.findAll({
      where: { is_paid: '1' }, // Fetch only stores where paid_status is 1
      attributes: ['id', 'domain', 'token', 'pricing_plan_id'],
    });

    // Iterate over each store and fetch/update billing details
    for (const store of stores) {
      const { id, domain, token, pricing_plan_id } = store;
      const nextBillingDate = await fetchNextBillingDate(domain, token);

      if (nextBillingDate) {
        const nextBillingDateObj = new Date(nextBillingDate);

        const billedOnDate = new Date(nextBillingDateObj);
        billedOnDate.setDate(billedOnDate.getDate() - 30);

        await db.ApplicationCharges.update(
          {
            priceplan_billing_on: nextBillingDate,
            billed_on: billedOnDate,
          },
          { where: { store_id: id } }
        );

        // console.log(
        //   `Updated billing dates for store ID ${id}: Next Billing Date is ${nextBillingDate}, Billed On is ${billedOnDate}`
        // );
      } else {
        console.log(`Failed to fetch next billing date for store ID ${id}`);
      }
    }
  } catch (error) {
    console.error('Error updating billing dates for paid stores', error);
    throw error;
  }
};

exports.createUsageCharges = async () => {
  try {
    let orderToCharge = await db.usageLogs.findAll({
      where: {
        is_paid: '0',
      },
      order: ['charge'],
      attributes: ['id', 'store_id', 'order_id', 'charge'],
    });

    let { charge_record, maxLength } = await separateOrder(orderToCharge);

    for (const store_id in charge_record) {
      const {
        domain,
        token,
        recurring_charge_id,
        total_charge,
        charged_ids,
        order_count,
      } = charge_record[store_id];

      // Fetch the plan for the store
      const current_plan = await db.Store.findOne({
        where: { id: store_id },
      }); // Assume this fetches the PricingPlan for the store

      if (current_plan) {
        const pricingPlanRestriction = await db.PricingPlan.findOne({
          where: { id: current_plan.pricing_plan_id },
        });
        const { orders } = pricingPlanRestriction;

        // Only charge if the store has more than the plan's order threshold
        if (order_count > orders) {
          const { new_charges, usageChargeRecord } = checkTotalAmount(
            charged_ids,
            total_charge,
            maxLength
          );
          const client = new UsageCharges(domain, token);

          // Create a usage charge
          let usageChargePayload = await client.create(recurring_charge_id, {
            description: `Behalf of vital orders`,
            price: new_charges,
          });

          // Update the charges in the database
          await updateCharges(usageChargeRecord, usageChargePayload);
        } else {
          console.log(
            `Store ${store_id} has fewer unpaid orders (${order_count}) than the threshold (${orders}), skipping charge.`
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Helper function to categorize and calculate charges by store
const separateOrder = async (unpaidOrders) => {
  let charge_record = {};
  let maxLength = 0;

  try {
    for (const order of unpaidOrders) {
      let { store_id, charge } = order;

      if (!charge_record[store_id]) {
        const store = await db.Store.findOne({
          where: { id: store_id, is_paid: '1', is_private: '0' },
        });

        if (store) {
          charge_record[store.id] = {
            domain: store.domain,
            token: store.token,
            recurring_charge_id: null,
            total_charge: 0,
            charged_ids: [],
            order_count: 0,
          };

          let applicationCharges = await db.ApplicationCharges.findOne({
            where: { store_id: store.id, status: 'active' },
          });
          charge_record[store.id].recurring_charge_id =
            applicationCharges.charge_id;
          charge_record[store.id].order_count = applicationCharges.order_count;
        }
      }

      // Track precision and update total charge
      let decimalLength =
        (charge.toString().split('.')[1] &&
          charge.toString().split('.')[1].length) ||
        0;
      maxLength = Math.max(maxLength, decimalLength);
      if (charge_record[store_id]) {
        charge_record[store_id].total_charge += Number(charge);
        charge_record[store_id].charged_ids.push(order);
        charge_record[store_id].order_count;
      }
    }
    return { charge_record, maxLength };
  } catch (error) {
    console.error('Error in separateOrder', error);
    return { charge_record, maxLength };
  }
};

const checkTotalAmount = (charged_ids, total_charge, maxLength) => {
  try {
    const sorted = [...charged_ids].sort((a, b) => {
      let first = a.charge;
      let second = b.charge;
      first =
        (first.toString().split('.')[1] &&
          first.toString().split('.')[1].length) ||
        first.toString().split('-')[1] ||
        0;
      second =
        (second.toString().split('.')[1] &&
          second.toString().split('.')[1].length) ||
        second.toString().split('-')[1] ||
        0;
      return second - first;
    });

    let newTotal = total_charge;
    while (Number((newTotal % 0.01).toFixed(maxLength)) > 0) {
      newTotal = (newTotal - sorted[0].charge).toFixed(maxLength);
      sorted.splice(0, 1);
    }
    return { new_charges: newTotal, usageChargeRecord: sorted };
  } catch (error) {
    throw error;
  }
};

const updateCharges = async (usageChargeRecord, usageChargePayoad) => {
  try {
    let updatePayload;
    if (usageChargePayoad.data) {
      updatePayload = {
        is_paid: '1',
        usage_charge_id: usageChargePayoad.data.id,
        billing_on: usageChargePayoad.data.billing_on,
        balance_remaining: usageChargePayoad.data.balance_remaining,
        risk_level: usageChargePayoad.data.risk_level,
        description: usageChargePayoad.data.description,
      };
    } else {
      updatePayload = {
        is_paid: '2',
        error: JSON.stringify(usageChargePayoad.error),
      };
    }

    let ids = usageChargeRecord.map((charge) => charge.id);
    await db.usageLogs.update(updatePayload, {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// exports.createPlan = async (req, res, next) => {
//   try {
//     console.log("req.body:", req.body);
//     let discountCode = req.body["discountCode"]
//       ? req.body["discountCode"]
//       : null;
//     console.log("discountCode", discountCode);
//     let { id, domain, token, is_freetrial_used, is_test_store } = req.storeData;
//     let applicationCharges = await db.ApplicationCharges.findOne({
//       where: { store_id: id, status: "active" },
//     });
//     let customerLength = await db.Customers.count({ where: { store_id: id } });
//     console.log("customerlength:", customerLength);

//     let confirm;
//     let { planId, isAnnual, email_marketing } = req.body;
//     console.log("Is annual:", isAnnual);

//     let pricePlanResponse = await db.PricingPlan.findOne({
//       where: {
//         id: planId,
//       },
//     });

//     if (!pricePlanResponse) throw new CustomError(500, "Plan not found");
//     let pricePlanResponseJSON = pricePlanResponse.toJSON();
//     pricePlanResponseJSON.discountData = null;
//     console.log("pricePlanResponseJSON before:", pricePlanResponseJSON);

//     if (discountCode) {
//       let discountData = await db.PricingPlanDiscounts.findOne({
//         where: { discount_code: discountCode },
//       });

//       if (
//         !discountData ||
//         (discountCode.store_id && discountCode.store_id != id)
//       )
//         throw new CustomError(
//           500,
//           `Discount ${req.params["dicountCode"]} is not applicable for this store.`
//         );

//       pricePlanResponseJSON.discountData = discountData.toJSON();
//       console.log(
//         "pricePlanResponseJSON.discountData",
//         pricePlanResponseJSON.discountData.discount_code
//       );

//       console.log("discount data:", discountData);
//       console.log(" discountData", discountData.plans);
//       console.log(
//         'discountData.plans.includes("209")',
//         discountData.plans.includes("209")
//       );
//       console.log(
//         'discountData.plans.includes("210")',
//         discountData.plans.includes("210")
//       );
//       console.log(
//         'discountData.plans.includes("211")',
//         discountData.plans.includes("211")
//       );
//       if (discountData.plan_type == "lifetime") {
//         let couponPlan;

//         // Map the planId to specific plan names
//         if (discountData.plans.includes(209)) {
//           console.log("in if 209");
//           couponPlan = "Starter";
//         } else if (discountData.plans.includes(210)) {
//           console.log("in if 210");
//           couponPlan = "Growth";
//         } else if (discountData.plans.includes(211)) {
//           console.log("in if 211");
//           couponPlan = "Premium";
//         } else if (
//           discountData.plans.includes(209) &&
//           discountData.plans.includes(210) &&
//           discountData.plans.includes(211)
//         ) {
//           couponPlan = "All";
//         }

//         console.log("coupon plan:", couponPlan);

//         return res.status(200).send({
//           message: "success",
//           data: {
//             redirectUrl: await activateLifetimePlan(
//               req.storeData,
//               couponPlan,
//               discountCode
//             ),
//           },
//         });
//       }
//     }

//     if (isAnnual) {
//       confirm = await this.createAnnualPlan(
//         id,
//         planId,
//         email_marketing,
//         domain,
//         token,
//         pricePlanResponseJSON,
//         is_freetrial_used
//       );
//     } else {
//       if (pricePlanResponseJSON.discountData) {
//         if (is_test_store == "1") {
//           pricePlanResponseJSON.test = true;
//         } else {
//           pricePlanResponseJSON.test = false;
//         }
//         confirm = await this.createRecurringDiscountPlan(
//           id,
//           planId,
//           email_marketing,
//           domain,
//           token,
//           pricePlanResponseJSON,
//           is_freetrial_used
//         );
//       } else if (pricePlanResponseJSON.plan_name === "Free") {
//         console.log("planId in else if", planId, typeof planId);
//         // if (pricePlanResponse.customer_limit != null && customerLength >= pricePlanResponse.customer_limit) {
//         //   throw new CustomError(500, `You have more than ${pricePlanResponse.customer_limit} customers please choose higher plan`);
//         // }
//         if (planId != 208) {
//           const chargeId = applicationCharges.charge_id;
//           const client = new pricingPlan(domain, token);
//           const cancellationResponse = await client.delete(chargeId);
//           if (cancellationResponse.error) {
//             console.log("error:", error);
//             throw new CustomError(
//               500,
//               "Failed to cancel the application charge"
//             );
//           }
//           console.log("Application charge canceled successfully");
//         }

//         await db.Store.update({ is_paid: "1" }, { where: { id: id } });
//         let priceObj = {
//           name: pricePlanResponse.plan_name,
//           price: pricePlanResponse.price,
//           capped_amount: pricePlanResponse.capped_amount,
//           terms: "For more queries, mail us on mailto:support@retenzy.com",
//           return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0`,
//         };
//         if (is_test_store == "1") {
//           priceObj.test = true;
//         }
//         confirm = await this.freePlanRecurringChargeCallBack(
//           req,
//           res,
//           id,
//           pricePlanResponse.id,
//           "thevital",
//           0
//         );
//       } else {
//         const client = new pricingPlan(domain, token);
//         let priceObj = {
//           name: pricePlanResponse.plan_name,
//           price: pricePlanResponse.price,
//           capped_amount: pricePlanResponse.capped_amount,
//           terms: "For more queries, mail us on mailto:support@retenzy.com",
//           return_url: `${appUrl}/priceplan/charge/${id}/${planId}/${email_marketing}/0`,
//         };
//         if (is_test_store == "1") {
//           priceObj.test = true;
//         }
//         if (is_freetrial_used == "0")
//           priceObj.trial_days = pricePlanResponse.free_trial_days;

//         const planResponse = await client.create(priceObj);
//         if (planResponse.error) throw new CustomError(500, "Plan not created");
//         confirm = planResponse.data.confirmation_url;
//         console.log("Confirm:", confirm);
//       }
//     }
//     res
//       .status(200)
//       .send({ message: "success", data: { redirectUrl: confirm } });
//   } catch (error) {
//     console.log("error", error);
//     error.storeId = req.storeData.id;
//     next(error);
//   }
// };
