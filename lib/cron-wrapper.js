/* lib/cron-wrapper.js */
const cron = require('node-cron');
const Sentry = require('@sentry/node');
module.exports = { schedule: Sentry.cron.instrumentNodeCron(cron).schedule };