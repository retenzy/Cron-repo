const helper = require('./app-helper');
const shopifyGraphqlRequest = async (store, query, variables) => {
  console.log();
  try {
    const token = helper.decrypt(store.token);
    const endpoint = `https://${store.domain}/admin/api/2023-10/graphql.json`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error(' Shopify GraphQL Errors:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('Shopify GraphQL Request Failed:', error);
    return { error };
  }
};
module.exports = shopifyGraphqlRequest;
