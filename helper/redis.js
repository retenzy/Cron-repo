const { createClient } = require('redis');
const { redis } = require('../config');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const client = createClient({
  url: redis.url,
});

// Attach error listener to prevent app crash on unexpected errors
client.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Function to connect with retry logic

// Start initial connection attempt

module.exports = client;
