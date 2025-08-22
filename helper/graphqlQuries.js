const Graphql = require('../platform/shopify/Graphql');
const CONFIG = require('../config');
const crypto = require('crypto');
const shopifyGraphqlRequest = require('./newShopifyMutaion');
const secretKey = 'yourkey';
exports.checkCustomerPurchaseHistory = async (store, customerId, productId) => {
  try {
    console.log('inside purchase history');
    const storeId = store.id;
    const storeName = store.domain;
    const token = store.token;

    const client = new Graphql(storeName, token);

    const query = `query {
      customer(id: "gid://shopify/Customer/${customerId}") {
        orders(first: 100) {
          edges {
            node {
              id
              lineItems(first: 100) {
                edges {
                  node {
                    product {
                      id
                    }
                    name
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    }`;

    // Execute GraphQL query without variables
    let response = await client.query(query);
    // Check for response errors
    if (response.error) {
      console.error('API Error:', response.error);
      return false;
    }

    const customerData = response.data?.customer;
    if (!customerData) {
      console.warn('Customer data not found');
      return false;
    }

    const orders = customerData.orders.edges;
    const formattedProductId = `gid://shopify/Product/${productId}`;
    console.log('Checking for product:', formattedProductId);

    // Check each order's line items
    for (const { node: order } of orders) {
      for (const { node: lineItem } of order.lineItems.edges) {
        const productGid = lineItem.product?.id;
        console.log('Comparing product IDs:', {
          found: productGid,
          looking: formattedProductId,
        });

        if (productGid == formattedProductId) {
          console.log('Product found in order');
          return true;
        }
      }
    }

    console.log('Product not found in any orders');
    return false;
  } catch (error) {
    console.error('GraphQL query error:', error.message);
    return false;
  }
};

exports.getProductsDataForReviewXmlFeed = async (store, ids) => {
  try {
    const storeName = store.domain;
    const token = store.token;
    const formattedIds = ids.map((id) => `gid://shopify/Product/${id}`);
    const client = new Graphql(storeName, token);
    const query = `
    query getProducts{
      nodes(ids: [${formattedIds.map((id) => `"${id}"`).join(', ')}]) {
        ... on Product {
          id
          title
          handle
          onlineStoreUrl
          variants(first: 100) {
            edges {
              node {
                id
                sku
                barcode
              }
            }
          }
        }
      }
    }
  `;
    let formatProductsData = (products) => {
      console.log('console inside formatProductsData');
      return products
        .filter((product) => product != null)
        .map((product) => ({
          id: product.id.split('/').pop(), // Remove the Shopify gid prefix
          name: product.title,
          handle: product.handle,
          productUrl: product.onlineStoreUrl,
          gtins: product.variants.edges
            .map((edge) => edge.node.barcode)
            .filter(Boolean),
          skus: product.variants.edges
            .map((edge) => edge.node.sku)
            .filter(Boolean),
        }));
    };
    const response = await client.query(query);
    let data = JSON.parse(JSON.stringify(response, null, 2));
    return formatProductsData(data.data.nodes);
  } catch (error) {
    console.error('GraphQL query error:', error.message);
    return false;
  }
};

exports.getProductsAndCustomerFromOrderId = async (store, orderId) => {
  try {
    // const storeId = store.id;
    const storeName = store.domain;
    const token = store.token;
    console.log('storename: ' + storeName);
    console.log('token: ' + token);
    console.log('orderIDd', orderId);

    // const storeName = "saurabh-demo-store.myshopify.com";
    // const token =
    //   "d6997492fcd4b2efeacc320ee96f4cb05935368f118ac79e824c62ea6ac2a1e31257caf70817beef6da2c36dfdba886439d6229a4449727d4932b1ddfc055f097b2f885703168be426c78e579fa8adff463163d961cd621ad31614a62a4538727bdff1e4c99efa12822a051bb7d1b7fe7f52406a9ed82a7754fcb1ef57221e3f17d6acedef83";
    const client = new Graphql(storeName, token);
    const query = `
  query  {
    order(id:"gid://shopify/Order/${orderId}") {
    customer{
    email 
    firstName 
    lastName
    }
      lineItems(first: 50) {
        edges {
          node {
            product {
              id
              title
              handle
    media(first: 1) {
        edges {
          node {
            ... on MediaImage {
              image {
                altText
                url
              }
            }
          }
        }
      }
         }
          }
        }
      }
    }
  }`;
    let response = await client.query(query);
    if (response.error) {
      console.error('API Error in getProductsFromOrder:', response.error);
      return false;
    }
    let order = response.data.order;
    let customer = {
      customer_email: order?.customer.email,
      first_name: order?.customer?.firstName,
      last_name: order?.customer?.lastName,
    };
    let products = order.lineItems.edges;
    let productsArr = products.map((edge) => {
      let product = edge?.node?.product;
      let imgUrl = product?.media?.edges[0]?.node?.image.url;
      let productId = product?.id?.split('Product/')[1];
      const base64Encode = (data) =>
        Buffer.from(JSON.stringify(data)).toString('base64');
      const reviewData = {
        productId: productId,
        productName: product?.title,
        productHandle: product?.handle,
        productImgUrl: imgUrl,
        customerEmail: customer.customer_email,
        customerName:
          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
        orderId,
        shop: store.main_domain || store.domain,
      };
      const encryptedData = base64Encode(reviewData);
      console.log('encrypted data: ' + encryptedData);

      return {
        id: productId,
        title: product?.title,
        handle: product?.handle,
        image_url: imgUrl,
        reviewUrl: `${CONFIG.shopify.appUrl}/admin/write-review?data=${encryptedData}`,
      };
    });
    // console.log("customers=>", customer);
    // console.log("productArr", productsArr);
    return {
      customer: customer,
      products: productsArr,
    };
  } catch (error) {
    console.log('error in getProductsFromOrder ', error);
    return false;
  }
};

exports.getCustomerAccountPageStatus = async (store) => {
  const storeName = store.domain;
  const token = store.token;
  const client = new Graphql(storeName, token);
  const query = `
    query CustomerAccounts {
      shop {
        customerAccountsV2 {
          customerAccountsVersion
          loginLinksVisibleOnStorefrontAndCheckout
          loginRequiredAtCheckout
          url
        }
      }
    }
  `;

  try {
    const response = await client.query(query);

    const accountSettings = response.data.shop.customerAccountsV2;

    return {
      isEnabled: accountSettings.customerAccountsVersion !== 'DISABLED',
      type: accountSettings.customerAccountsVersion,
      loginLinksVisible:
        accountSettings.loginLinksVisibleOnStorefrontAndCheckout,
      loginRequired: accountSettings.loginRequiredAtCheckout,
      url: accountSettings.url,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch customer account status: ${error.message}`
    );
  }
};

// Encrypt function
exports.getCustomerOrderForDashboard = async (store, customerId) => {
  try {
    const storeName = store.domain;
    const token = store.token;
    const client = new Graphql(storeName, token);
    let query = ` query  {customer(id:"gid://shopify/Customer/${customerId}") {
        orders(first: 50, reverse: true) {
          edges {
            node {
              id
              name
           originalTotalPriceSet{
                  shopMoney{
                    amount
                    currencyCode
                  }
                }
              lineItems(first: 10) {
                edges {
                  node {
                   product{
                  id
                }
                    title
                    quantity
                    image{
                      url
                      }
                    variant {
                      price
                      title
                      id
                    }
                  }
                }
              }
            }
          }
        }
  }
        }`;
    const response = await client.query(query);
    let orderArr = response.data.customer.orders.edges;
    let orders = orderArr.map((ele) => {
      let node = ele.node;
      return {
        order_id: node.id.split('Order/')[1],
        order_name: node.name,
        price: node.originalTotalPriceSet.shopMoney.amount,
        currencyCode: node.originalTotalPriceSet.shopMoney.currencyCode,
        lineItems: node.lineItems.edges.map((ele) => {
          let node = ele.node;
          return {
            product_id: node.product.id.split('Product/')[1],
            product_title: node.title,
            quantity: node.quantity,
            price: node.variant.price,
            variant_title: node.variant.title,
            variant_image: node.image.url,
            variant_id: node.variant.id.split('ProductVariant/')[1],
          };
        }),
      };
    });
    return orders;
  } catch (error) {
    console.log('error in getCustomerOrderForDashboard', error);
    return [];
  }
};

exports.getAppInstalledStatus = async (store) => {
  const storeName = store.domain;
  const token = store.token;
  const client = new Graphql(storeName, token);
  const query = `
    query AppInstallations {
      appInstallations (first:100) {
       nodes{
          app{
           title
           }
        }
      }
    }
  `;
  try {
    const response = await client.query(query);
    console.log('responcee', response);
  } catch (error) {
    console.log('error in getAppInstalledStatus', error);
  }
};

exports.getCollections = async (store) => {
  const storeName = store.domain;
  const token = store.token;
  const client = new Graphql(storeName, token);
  const query = `
   query GetCollections {
	   collections(first:100) {
         nodes{
            id
            title
             image{
              url
            }
            products(first:100){
              nodes{
               handle,
               id,
               title
              } 
            }
           
      }
	  }
  }
  `;
  try {
    const response = await client.query(query);
    let data = response.data.collections.nodes;
    // console.log("collectiuons responcee",data );
    let arr = data.map((ele) => {
      return {
        title: ele.title,
        image: ele.image?.url || '',
        id: ele.id,
        products: ele.products.nodes.map((ele) => {
          return {
            handle: ele.handle,
            id: ele.id.split('Product/')[1],
            title: ele.title,
          };
        }),
      };
    });
    // console.log("arr,arr",arr);
    // arr.map((ele) => console.log("ele", ele));
    return arr;
  } catch (error) {
    console.log('error in getCollections', error);
  }
};

// exports.addCombinationDiscount = async (store) => {
//   const storeName = store.domain;
//   const token = store.token;
//   const client = new Graphql(storeName, token);
//   const query = `
//    query GetCollections {
// 	   collections(first:100) {
//          nodes{
//             id
//             title
//              image{
//               url
//             }
//             products(first:100){
//               nodes{
//                handle,
//                id,
//                title
//               }
//             }

//       }
// 	  }
//   }
//   `;
//   try {
//     const response = await client.query(query);
//   } catch (error) {
//     console.log("error in getCollections", error);
//   }
// };

exports.createCustomer = async (store, customerData) => {
  const query = `
    mutation CreateCustomerWithEmail($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          createdAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: customerData.email,
    },
  };

  try {
    const response = await shopifyGraphqlRequest(store, query, variables);
    console.log('Customer Create Response:', response);

    const { customerCreate } = response.data || {};
    if (customerCreate.userErrors && customerCreate.userErrors.length) {
      // Return userErrors for the caller to handle, do not treat as a thrown error
      return { customer: null, errors: customerCreate.userErrors };
    }
    const customer = customerCreate.customer;
    return { customer, errors: [] };
  } catch (error) {
    // Only log unexpected errors (e.g., network, server)
    console.error('Error creating customer:', error);
    return { customer: null, errors: [{ message: error.message }] };
  }
};
