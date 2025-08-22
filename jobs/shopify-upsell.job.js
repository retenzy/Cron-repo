const db = require('../models');
const UsageCharges = require('../platform/shopify/UsageCharges');
const helper = require('../helper/app-helper');
const { Op } = require('sequelize');

// Retry wrapper
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retrying after error: ${err.message}`);
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
};

const fetchNextBillingDate = async (domain, token) => {
  try {
    
  
    console.log(`Fetching billing date for ${domain} with token: ${token}`);
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

    const response = await fetch(`https://${domain}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': helper.decrypt(token),
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    console.log(`Billing date result for ${domain}:`, result);

    if (result.errors) {
      console.error(`GraphQL errors for ${domain}:`, result.errors);
    }

    if (result.data && result.data.currentAppInstallation.activeSubscriptions[0]) {
      return result.data.currentAppInstallation.activeSubscriptions[0].currentPeriodEnd;
    } else {
      console.warn(`No subscription data for ${domain}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching billing date for ${domain}:`, error.message);
    throw error;
  }
};

const updateBillingDatesForPaidStores = async () => {
  console.log(' Starting billing date update job');
  try {
 const stores = await db.Store.findAll({
  where: {
    is_paid: '1',
    is_uninstalled: '0', // Only active stores
  },
  attributes: ['id', 'domain', 'token', 'pricing_plan_id'],
});


for (const store of stores) {
  try {
    // Skip uninstalled stores
    if (store.is_uninstalled === '1' || store.is_uninstalled === 1 || store.is_uninstalled === true) {
      console.log(`Skipping uninstalled store ${store.id}`);
      continue;
    }

    const { id, domain, token } = store;
    const nextBillingDate = await fetchWithRetry(() =>
      fetchNextBillingDate(domain, token)
    );

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
    } else {
      console.warn(`No next billing date found for store ${id}`);
    }
  } catch (err) {
    console.error(`Failed to update billing for store ${store.id}:`, err.message);
  }
}

  } catch (error) {
    console.error(' Error in updateBillingDatesForPaidStores:', error);
  }
};

const separateOrder = async (unpaidOrders) => {
  let charge_record = {};
  let maxLength = 0;

  try {
    for (const order of unpaidOrders) {
      const { store_id, charge } = order;

      if (!charge_record[store_id]) {
        try {
const store = await db.Store.findOne({
  where: { id: store_id, is_paid: '1', is_private: '0', is_uninstalled: '0' },
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

            const applicationCharges = await db.ApplicationCharges.findOne({
              where: { store_id: store.id, status: 'active' },
            });

            if (applicationCharges) {
              charge_record[store.id].recurring_charge_id = applicationCharges.charge_id;
              charge_record[store.id].order_count = applicationCharges.order_count;
            } else {
              console.warn(`No active ApplicationCharges for store ${store.id}`);
            }
          }
        } catch (err) {
          console.error(`Error initializing charge record for store ${store_id}:`, err.message);
        }
      }

      const decimalLength =
        (charge.toString().split('.')[1] && charge.toString().split('.')[1].length) || 0;
      maxLength = Math.max(maxLength, decimalLength);

      if (charge_record[store_id]) {
        charge_record[store_id].total_charge += Number(charge);
        charge_record[store_id].charged_ids.push(order);
      }
    }

    return { charge_record, maxLength };
  } catch (error) {
    console.error(' Error in separateOrder:', error.message);
    return { charge_record, maxLength };
  }
};

const checkTotalAmount = (charged_ids, total_charge, maxLength) => {
  try {
    const sorted = [...charged_ids].sort((a, b) => b.charge - a.charge);
    let newTotal = total_charge;

    while (Number((newTotal % 0.01).toFixed(maxLength)) > 0 && sorted.length > 0) {
      newTotal = (newTotal - sorted[0].charge).toFixed(maxLength);
      sorted.splice(0, 1);
    }

    return { new_charges: newTotal, usageChargeRecord: sorted };
  } catch (error) {
    console.error(' Error in checkTotalAmount:', error.message);
    throw error;
  }
};

const updateCharges = async (usageChargeRecord, usageChargePayload) => {
  try {
    const updatePayload = usageChargePayload.data
      ? {
          is_paid: '1',
          usage_charge_id: usageChargePayload.data.id,
          billing_on: usageChargePayload.data.billing_on,
          balance_remaining: usageChargePayload.data.balance_remaining,
          risk_level: usageChargePayload.data.risk_level,
          description: usageChargePayload.data.description,
        }
      : {
          is_paid: '2',
          error: JSON.stringify(usageChargePayload.error),
        };

    const ids = usageChargeRecord.map((charge) => charge.id);
    await db.usageLogs.update(updatePayload, {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });
  } catch (error) {
    console.error(' Error updating charges:', error.message);
    throw error;
  }
};

const createUsageCharges = async () => {
  console.log('🔁 Starting usage charge creation job');
  try {
    const orderToCharge = await db.usageLogs.findAll({
      where: { is_paid: '0' },
      order: ['charge'],
      attributes: ['id', 'store_id', 'order_id', 'charge'],
    });

    const { charge_record, maxLength } = await separateOrder(orderToCharge);

    for (const store_id in charge_record) {
      try {
        const {
          domain,
          token,
          recurring_charge_id,
          total_charge,
          charged_ids,
          order_count,
        } = charge_record[store_id];

const current_plan = await db.Store.findOne({
  where: { id: store_id, is_uninstalled: '0' },
});


        if (!current_plan) {
          console.warn(`Store not found for ID: ${store_id}`);
          continue;
        }

        const pricingPlan = await db.PricingPlan.findOne({
          where: { id: current_plan.pricing_plan_id },
        });

        if (!pricingPlan) {
          console.warn(`Pricing plan not found for store ${store_id}`);
          continue;
        }

        const { orders } = pricingPlan;

        if (order_count > orders) {
          const { new_charges, usageChargeRecord } = checkTotalAmount(
            charged_ids,
            total_charge,
            maxLength
          );

          const client = new UsageCharges(domain, token);

          const usageChargePayload = await client.create(recurring_charge_id, {
            description: `Behalf of vital orders`,
            price: new_charges,
          });

          await updateCharges(usageChargeRecord, usageChargePayload);
        } else {
          console.log(
            `Store ${store_id} has order count ${order_count} within plan limit (${orders})`
          );
        }
      } catch (err) {
        console.error(` Error processing charges for store ${store_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error(' Error in createUsageCharges:', error.message);
    throw error;
  }
};

module.exports = async function shopifyUpsellJob() {
  console.log(' Starting Shopify Upsell Job');
  try {
    await createUsageCharges();
    await updateBillingDatesForPaidStores();
  } catch (err) {
    console.error(' Error running shopifyUpsellJob:', err.message);
  }
  console.log(' Finished Shopify Upsell Job');
};

// Optional: process safety hooks
process.on('unhandledRejection', (reason) => {
  console.error(' Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(' Uncaught Exception:', err);
});

// let toke = "1a094636112a37d1acb71ec9c2137ff02f4305d516b39ecca0e14849cb2124c746421152bb6de29b6fd5dde690374dcae70d4566574c0b121fb414183833074357ac1ec5722a79aec5ee34780dbdcb26d898ca655b2d7cb53af929185872c0d4f0f2968f307ed47f54aa4af7ec46ec891b2b77f195fc9810f5bf6d6a0df8973a93cc62735543"
// let domain= "murgesh-vital-testing.myshopify.com"
// const data = fetchNextBillingDate(domain, toke)