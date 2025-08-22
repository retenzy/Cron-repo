// productReviewService.js
const db = require('../models');
const { Op } = require('sequelize');
const ReviewXMLGenerator = require('./reviewXMLGenerator');
const { getProductsDataForReviewXmlFeed } = require('./graphqlQuries');
const uploadXmlToS3 = require('./reviewXmlsUpload');

//  const generateReviewsWithProductDetails=async(reviewsByProduct,store) =>{
//   try {
//       // Extract all product IDs
//       const productIds = reviewsByProduct.map(item => item.product_id);
//       console.log("productIds in generateReviewsWithProductDetails ==>",productIds)
//       // Fetch all product details in one call
//       const productDetails = await getProductsDataForReviewXmlFeed(store,productIds)
//       // Combine reviews with product details
//        const combinedData = reviewsByProduct.map(reviewGroup => {
//         const product = productDetails.find(p => p.id == reviewGroup.product_id);
//         product.productUrl=product.productUrl?product.productUrl:`${store.main_domain||store.domain}/products/${product.handle}`
//         return {
//           product: {
//             ...product,
//             reviews: reviewGroup.reviewsData.map(review => ({
//               reviewerName: review.reviewerName,
//               timestamp: review.createdAt,
//               title: review.title,
//               content: review.content,
//               rating: review.rating,
//               reviewImages:review.reviewImages,
//               reviewUrl: `${product.productUrl}#thevitalReview`,
//               reviewId: review.id
//             }))
//           }
//         };
//       });
//       console.log("combinedData=>",combinedData)
//       return combinedData;
//   } catch (error) {
//     console.log("error in generateReviewsWithProductDetails",error);
//   }
//   }

//////////////////////////////////////////

const generateReviewsWithProductDetails = async (reviewsByProduct, store) => {
  try {
    // Extract all product IDs
    const productIds = reviewsByProduct.map((item) => item.product_id);
    console.log(
      'productIds in generateReviewsWithProductDetails ==>',
      productIds
    );

    // Fetch all product details in one call
    const productDetails = await getProductsDataForReviewXmlFeed(
      store,
      productIds
    );

    // Combine reviews with product details
    const combinedData = reviewsByProduct
      .map((reviewGroup) => {
        const product = productDetails.find(
          (p) => p.id == reviewGroup.product_id
        );

        // Skip if product is not found
        if (!product) {
          console.log(`Product not found for ID: ${reviewGroup.product_id}`);
          return null;
        }

        // Skip if both URL and handle are missing
        if (!product.productUrl && !product.handle) {
          console.log(
            `Product ${product.id} missing both URL and handle, skipping`
          );
          return null;
        }

        // Set product URL if missing
        const productUrl =
          product.productUrl ||
          `${store.main_domain || store.domain}/products/${product.handle}`;

        return {
          product: {
            ...product,
            productUrl, // Add the computed URL
            reviews: reviewGroup.reviewsData.map((review) => ({
              reviewerName: review.reviewerName,
              timestamp: review.createdAt,
              createdAt: review.insertedAt,
              title: review.title,
              content: review.content,
              rating: review.rating,
              reviewImages: review.reviewImages,
              reviewUrl: `${productUrl}#thevitalReview`,
              reviewId: review.id,
            })),
          },
        };
      })
      .filter(Boolean); // Remove null entries

    // console.log("combinedData=>", combinedData);
    return combinedData;
  } catch (error) {
    console.log('error in generateReviewsWithProductDetails', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
// Generate XML from the combined data
exports.generateXML = async (store) => {
  try {
    const reviewsByProduct = await db.Reviews.findAll({
      attributes: [
        'product_id',
        [
          db.sequelize.literal(`
                  JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id',id,
                      'reviewerName', customer_name,
                      'rating', rating,
                      'content', review,
                      'createdAt',review_date,
                      'reviewImages', review_images,
                      'insertedAt', created_at
                    )
                  )
                `),
          'reviewsData',
        ],
      ],
      where: {
        store_id: store.id,
        source: {
          [Op.ne]: 'amazon', // Exclude records where source = 'amazon'
        },
      },
      group: ['product_id'],
      raw: true,
    });
    // Your existing XML generator
    const combinedData = await generateReviewsWithProductDetails(
      reviewsByProduct,
      store
    );
    // Flatten the data structure for XML generation
    const flatReviews = combinedData.flatMap((item) =>
      item.product.reviews.map((review) => {
        const safeTimestamp =
          review.timestamp && review.timestamp != '0000-00-00 00:00:00.000000'
            ? new Date(review.timestamp).toISOString().split('.')[0] + '+00:00'
            : new Date(review.createdAt).toISOString().split('.')[0] + '+00:00';
        return {
          // reviewerName: review.reviewerName
          reviewerName:
            review.reviewerName.split(' ')[0] +
            ' ' +
            (review.reviewerName.split(' ').length > 1
              ? review.reviewerName.split(' ')[1][0] + '.'
              : ''),
          timestamp: safeTimestamp,
          title: review.title,
          content: review.content,
          reviewUrl: review.reviewUrl,
          reviewImages: review.reviewImages.trim()
            ? review.reviewImages.split(',')
            : [],
          rating: review.rating,
          product: {
            gtins: item.product.gtins,
            skus: item.product.skus,
            brand: store.username, // Add your brand name or fetch from Shopify if available
            productUrl: item.product.productUrl,
          },
          isSpam: false,
          reviewId: review.reviewId,
        };
      })
    );
    const generator = new ReviewXMLGenerator('Retenzy');
    let xmlData = generator.generateXML(flatReviews);
    const uploadResult = await uploadXmlToS3(xmlData, store.username);
    return uploadResult;
  } catch (error) {
    console.log('error in generateXml', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
