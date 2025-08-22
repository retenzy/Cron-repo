const fs = require('fs');
const { Op } = require('sequelize');
const csv = require('fast-csv');
const db = require('../models'); // Adjust the path if needed

const BATCH_SIZE_STORE = 10;
const BATCH_SIZE_CUSTOMER = 100;

const { store, customer, order } = db; // Destructure models

function calculateRecency(lastOrderDate) {
  const today = new Date();
  return Math.floor((today - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
}

function scoreRecency(days) {
  if (days <= 30) return 5;
  if (days <= 60) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function scoreFrequency(freq) {
  if (freq >= 20) return 5;
  if (freq >= 10) return 4;
  if (freq >= 5) return 3;
  if (freq >= 2) return 2;
  return 1;
}

function scoreMonetary(amount) {
  if (amount >= 1000) return 5;
  if (amount >= 500) return 4;
  if (amount >= 200) return 3;
  if (amount >= 100) return 2;
  return 1;
}

function assignSegment(r, f, m) {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champion';
  if (r >= 3 && f >= 4) return 'Loyal Customer';
  if (r >= 3 && f >= 3 && m >= 3) return 'Potential Loyalist';
  if (r <= 2 && f >= 3) return 'At Risk';
  return 'Dormant';
}

async function runRFMAnalysis() {
  let storeOffset = 0;
  const csvRows = [];

  while (true) {
    const storesBatch = await store.findAll({
      where: {
        status: '1',
        is_deleted: '0',
        is_uninstalled: '0',
      },
      offset: storeOffset,
      limit: BATCH_SIZE_STORE,
    });

    if (!storesBatch.length) break;

    for (const storeInstance of storesBatch) {
      let customerOffset = 0;

      while (true) {
        const customersBatch = await customer.findAll({
          where: { store_id: storeInstance.id },
          offset: customerOffset,
          limit: BATCH_SIZE_CUSTOMER,
        });

        if (!customersBatch.length) break;

        for (const cust of customersBatch) {
          const ordersList = await order.findAll({
            where: {
              store_id: storeInstance.id,
              customer_id: cust.customer_id,
              order_cancelled_at: null,
            },
          });

          if (!ordersList.length) continue;

          const lastOrderDate = ordersList.reduce((latest, o) => {
            const dt = new Date(o.order_created_at);
            return dt > latest ? dt : latest;
          }, new Date(ordersList[0].order_created_at));

          const recency = calculateRecency(lastOrderDate);
          const frequency = ordersList.length;
          const monetary = ordersList.reduce(
            (sum, o) => sum + parseFloat(o.price || 0),
            0
          );

          const rScore = scoreRecency(recency);
          const fScore = scoreFrequency(frequency);
          const mScore = scoreMonetary(monetary);
          const segment = assignSegment(rScore, fScore, mScore);

          csvRows.push({
            store_id: storeInstance.store_id,
            customer_id: cust.customer_id,
            email: cust.customer_email,
            recency,
            frequency,
            monetary: monetary.toFixed(2),
            rScore,
            fScore,
            mScore,
            segment,
          });
        }

        customerOffset += BATCH_SIZE_CUSTOMER;
      }
    }

    storeOffset += BATCH_SIZE_STORE;
  }

  // Write to CSV
  const ws = fs.createWriteStream('rfm_export.csv');
  csv.write(csvRows, { headers: true }).pipe(ws);
}

runRFMAnalysis()
  .then(() => {
    console.log('✅ RFM analysis completed. CSV exported to rfm_export.csv');
  })
  .catch((err) => {
    console.error('❌ Error during RFM analysis:', err);
  });
