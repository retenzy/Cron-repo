const csvtojson = require('csvtojson');
const db = require('../models');
const CustomError = require('./errors/CustomError');

exports.importDefaultReviews = async (filePath, storeData) => {
  try {
    const fileData = await csvtojson().fromFile(filePath);
    console.log('fileData==>', fileData);
    const chunkSize = 5000;
    const arrayOfArrays = [];
    const store_id = storeData.id;
    const pricingPlanData = await db.PricingPlan.findOne({
      where: { id: storeData.pricing_plan_id },
    });

    console.log('Pricing plan data:', pricingPlanData.csv_input_limit);

    const customerLength = await db.Reviews.count({
      where: { store_id, source: 'imported' },
    });

    console.log('file Data', fileData);
    console.log('customerLength', customerLength);
    console.log('customerLength and the fileData', fileData.length);

    if (pricingPlanData.id === 208) {
      if (
        pricingPlanData.csv_input_limit >= fileData.length &&
        customerLength + fileData.length + 1 <= pricingPlanData.csv_input_limit
      ) {
        console.log('FREE is imported successfully');
      } else {
        throw new CustomError(400, 'You need to upgrade the plan');
      }
    } else if (pricingPlanData.id === 209) {
      if (
        pricingPlanData.csv_input_limit >= fileData.length &&
        customerLength + fileData.length <= pricingPlanData.csv_input_limit
      ) {
        console.log('STARTER is imported successfully');
      } else {
        throw new CustomError(400, 'You need to upgrade the plan');
      }
    } else if (
      pricingPlanData.id === 210 &&
      customerLength + fileData.length <= pricingPlanData.csv_input_limit
    ) {
      if (pricingPlanData.csv_input_limit >= fileData.length) {
        console.log('GROWTH is imported successfully');
      } else {
        throw new CustomError(400, 'You need to upgrade the plan');
      }
    } else if (
      pricingPlanData.id === 211 &&
      customerLength + fileData.length <= pricingPlanData.csv_input_limit
    ) {
      if (pricingPlanData.csv_input_limit >= fileData.length) {
        console.log('PREMIUM is imported successfully');
      } else {
        throw new CustomError(400, 'You need to upgrade the plan');
      }
    } else {
      console.error('Something went wrongg');
    }

    for (let i = 0; i < fileData.length; i += chunkSize) {
      arrayOfArrays.push(fileData.slice(i, i + chunkSize));
    }

    for (let array of arrayOfArrays) {
      let reviewArray = [];
      for (let data of array) {
        if (
          data.customer_email != null &&
          data.customer_email != '' &&
          data.review != null &&
          data.review != '' &&
          data.handle != null &&
          data.handle != '' &&
          data.rating > 0 &&
          data.review_date != null &&
          data.review_date != ''
        ) {
          data.rating = +data.rating > 5 ? 5 : +data.rating;
          console.log('store id:', store_id);
          console.log('data.handle:', data.handle);

          let productResponse = await db.Products.findOne({
            where: { store_id: store_id, handle: data.handle },
            attributes: ['id', 'product_id', 'handle'],
          });

          if (productResponse) {
            data.reply = data.reply && data.reply != '' ? data.reply : null;
            data.reply_date =
              data.reply && (!data.reply_date || data.reply_date == '')
                ? new Date()
                : data.reply_date != null && data.reply_date != ''
                  ? data.reply_date
                  : null;
            data.store_id = store_id;
            if (!['web', 'email', 'app', 'imported'].includes(data.source)) {
              data.source = 'imported';
            }
            data.product_id = productResponse.product_id;
            if (!['hidden', 'published'].includes(data.status)) {
              data.status = await helper.setReviewStatus(store_id, data.rating);
            }
            reviewArray.push(data);
          } else {
            console.log('product not found');
            throw new CustomError(404, `product not found for ${data.handle}`);
          }
        } else {
          throw new CustomError(
            400,
            `Invalid data format. Please refer to the sample CSV file.`
          );
        }
      }
      // console.log("reviewArray", reviewArray);
      await db.Reviews.bulkCreate(reviewArray, {
        updateOnDuplicate: [
          'store_id',
          'customer_email',
          'review',
          'rating',
          'source',
          'status',
          'customer_name',
          'handle',
          'product_id',
          'reply',
          'reply_source',
          'reply_date',
          'review_date',
          'review_images',
        ],
      });
    }
    return { message: 'Imported successfully' };
  } catch (error) {
    console.error('Error in default import:', error);
    throw error;
  }
};

exports.importReviewsFromJudgeMe = async (storeData, filePath, app_name) => {
  try {
    const fileData = await csvtojson().fromFile(filePath);
    const chunkSize = 5000;
    const arrayOfArrays = [];

    // Split the data into chunks
    for (let i = 0; i < fileData.length; i += chunkSize) {
      arrayOfArrays.push(fileData.slice(i, i + chunkSize));
    }

    // Process each chunk
    for (let array of arrayOfArrays) {
      let reviewArray = [];

      for (const row of array) {
        // Validate required fields immediately
        if (
          !row.reviewer_email ||
          !row.body ||
          !row.product_handle ||
          row.rating <= 0 ||
          !row.review_date
        ) {
          throw new Error(
            `Invalid data format, required fields are missing or incorrect. please check our sample CSV.`
          );
        }

        // Set up the review data
        const review = {
          store_id: storeData.id,
          customer_email: row.reviewer_email,
          customer_name: row.reviewer_name || null,
          rating: Math.min(+row.rating, 5),
          review: row.body,
          handle: row.product_handle,
          status: 'published',
          source: 'imported',
          source_tag: app_name,
          review_images: row.picture_urls
            ? row.picture_urls.split(', ').join(',')
            : '',
          review_date: row.review_date,
          reply: row.reply || null,
          reply_source: row.reply ? 'imported' : null,
          reply_date: row.reply ? row.reply_date || new Date() : null,
        };

        // Find the product based on the handle
        const product = await db.Products.findOne({
          where: { store_id: storeData.id, handle: row.product_handle },
          attributes: ['product_id', 'handle'],
        });

        if (!product) {
          throw new Error(
            `Product not found for handle: ${row.product_handle}`
          );
        }

        review.product_id = product.product_id;

        // Format the date
        try {
          if (review.review_date) {
            const [day, month, year] = review.review_date.split('/');
            if (!day || !month || !year) {
              throw new Error(
                `Invalid date format. Expected DD/MM/YYYY but got: ${review.review_date}`
              );
            }
            review.review_date = `${year}-${month}-${day}`;
          }
        } catch (dateError) {
          throw new Error(
            `Invalid date format for review: ${review.review_date}. Expected format: DD/MM/YYYY`
          );
        }

        // Add review to array
        reviewArray.push(review);
      }

      // Perform bulk insert
      if (reviewArray.length > 0) {
        console.log('Sample review from batch:', reviewArray[0]);

        try {
          await db.Reviews.bulkCreate(reviewArray, {
            updateOnDuplicate: [
              'store_id',
              'customer_email',
              'review',
              'rating',
              'source',
              'source_tag',
              'status',
              'customer_name',
              'handle',
              'product_id',
              'reply',
              'reply_source',
              'reply_date',
              'review_date',
              'review_images',
            ],
            logging: console.log,
          });
        } catch (bulkInsertError) {
          throw new Error(
            `Database insertion failed: ${bulkInsertError.message}`
          );
        }
      }
    }

    console.log('Imported reviews from JudgeMe successfully');
    return { message: 'Migrated reviews from JudgeMe successfully' };
  } catch (error) {
    console.error('Error importing reviews from JudgeMe:', error);
    return { message: error.message }; // Return error message to user
  }
};
exports.importReviewsFromLoox = async (storeData, filePath, app_name) => {
  try {
    console.log('Inside importReviewsFromLoox');

    const fileData = await csvtojson().fromFile(filePath);
    const chunkSize = 5000;
    const arrayOfArrays = [];

    // Split the data into chunks
    for (let i = 0; i < fileData.length; i += chunkSize) {
      arrayOfArrays.push(fileData.slice(i, i + chunkSize));
    }

    // Process each chunk
    for (let array of arrayOfArrays) {
      let reviewArray = [];

      for (const row of array) {
        // Validate required fields immediately
        if (
          !row.email ||
          !row.body ||
          !row.product_handle ||
          row.rating <= 0 ||
          !row.created_at
        ) {
          throw new Error(
            `Invalid data format, required fields are missing or incorrect. please check our sample CSV.`
          );
        }

        // Set up the review data
        const review = {
          store_id: storeData.id,
          customer_email: row.email,
          customer_name: row.author || null,
          rating: Math.min(+row.rating, 5),
          review: row.body,
          handle: row.product_handle,
          status: 'published',
          source: 'imported',
          source_tag: app_name,
          review_images: row.photo_url || '',
          review_date: row.created_at,
          is_verified: row.verified_purchase === 'TRUE' ? '1' : '0',
          reply: null,
          reply_source: null,
          reply_date: null,
        };

        // Find the product based on the handle
        const product = await db.Products.findOne({
          where: { store_id: storeData.id, handle: row.product_handle },
          attributes: ['product_id', 'handle'],
        });

        if (!product) {
          throw new Error(
            `Product not found for handle: ${row.product_handle}`
          );
        }

        review.product_id = product.product_id;

        // Format the date
        try {
          review.review_date = new Date(review.review_date)
            .toISOString()
            .split('T')[0];
        } catch (dateError) {
          throw new Error(`Invalid date format for review: ${row.created_at}`);
        }

        // Add review to array
        reviewArray.push(review);
      }

      // Perform bulk insert
      if (reviewArray.length > 0) {
        console.log('Sample review from batch:', reviewArray[0]);

        try {
          await db.Reviews.bulkCreate(reviewArray, {
            updateOnDuplicate: [
              'store_id',
              'customer_email',
              'review',
              'rating',
              'source',
              'source_tag',
              'status',
              'customer_name',
              'handle',
              'product_id',
              'reply',
              'reply_source',
              'reply_date',
              'review_date',
              'review_images',
              'verified',
            ],
            logging: console.log,
          });
        } catch (bulkInsertError) {
          throw new Error(
            `Database insertion failed: ${bulkInsertError.message}`
          );
        }
      }
    }

    console.log('Imported reviews from Loox successfully');
    return { message: 'Migrated reviews from Loox successfully' };
  } catch (error) {
    console.error('Error importing reviews from Loox:', error);
    return { message: error.message }; // Return error message to user
  }
};

exports.importReviewsFromStamped = async (storeData, filePath, app_name) => {
  try {
    const fileData = await csvtojson().fromFile(filePath);
    const chunkSize = 5000;
    const arrayOfArrays = [];

    // Split the data into chunks
    for (let i = 0; i < fileData.length; i += chunkSize) {
      arrayOfArrays.push(fileData.slice(i, i + chunkSize));
    }

    // Process each chunk
    for (let array of arrayOfArrays) {
      let reviewArray = [];

      for (const row of array) {
        // Validate required fields immediately
        if (
          !row.email ||
          !row.body ||
          (!row.product_handle && !row.product_id) ||
          row.rating <= 0 ||
          !row.created_at
        ) {
          throw new Error(
            `Invalid data format, required fields are missing or incorrect. please check our sample CSV.`
          );
        }

        // Validate rating is between 1-5
        const rating = parseInt(row.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          throw new Error(
            `Invalid rating value: ${row.rating}. Rating must be between 1 and 5.`
          );
        }

        // Set up the review data
        const review = {
          store_id: storeData.id,
          customer_email: row.email.trim(),
          customer_name: row.author ? row.author.trim() : null,
          rating: rating,
          review: row.body.trim(),
          handle: row.product_handle ? row.product_handle.trim() : '',
          status: row.published === 'TRUE' ? 'published' : 'unpublished',
          source: 'imported',
          source_tag: app_name,
          review_images: row.productImageUrl ? row.productImageUrl.trim() : '',
          review_date: null,
          reply: row.reply ? row.reply.trim() : null,
          reply_source: row.reply ? 'imported' : null,
          reply_date: null,
          title: row.title ? row.title.trim() : null,
          location: row.location ? row.location.trim() : null,
        };

        // Find the product based on handle or product_id
        let product = null;
        try {
          if (row.product_handle) {
            product = await db.Products.findOne({
              where: { store_id: storeData.id, handle: row.product_handle },
              attributes: ['product_id', 'handle'],
            });
          }
          // If product not found by handle, try finding by product_id
          if (!product && row.product_id) {
            product = await db.Products.findOne({
              where: { store_id: storeData.id, product_id: row.product_id },
              attributes: ['product_id', 'handle'],
            });
            if (product) {
              review.handle = product.handle;
            }
          }

          if (!product) {
            throw new Error(
              `Product not found for handle: ${row.product_handle} or product_id: ${row.product_id}`
            );
          }

          review.product_id = product.product_id;
        } catch (productError) {
          throw new Error(`Error finding product: ${productError.message}`);
        }

        // Format the dates
        try {
          if (row.created_at) {
            // Handle both date formats: YYYY-MM-DD HH:MM:SS and YYYY-MM-DD
            const dateOnly = row.created_at.split(' ')[0];
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
              throw new Error(
                `Invalid date format for created_at: ${row.created_at}. Expected format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS`
              );
            }
            review.review_date = dateOnly;
          }

          if (row.reply && row.replied_at) {
            // Handle both date formats for consistency
            const replyDateOnly = row.replied_at.split(' ')[0];
            if (!/^\d{4}-\d{2}-\d{2}$/.test(replyDateOnly)) {
              throw new Error(
                `Invalid date format for replied_at: ${row.replied_at}. Expected format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS`
              );
            }
            review.reply_date = replyDateOnly;
          }
        } catch (dateError) {
          throw new Error(`Date formatting error: ${dateError.message}`);
        }

        // Validate that if there's a reply, it should be published
        if (review.reply && row.publishedReply !== 'TRUE') {
          throw new Error(
            `Reply exists but publishedReply is not TRUE. Row: ${JSON.stringify(
              row
            )}`
          );
        }

        // Add review to array
        reviewArray.push(review);
      }

      // Perform bulk insert
      if (reviewArray.length > 0) {
        console.log('Sample review from batch:', reviewArray[0]);

        try {
          await db.Reviews.bulkCreate(reviewArray, {
            updateOnDuplicate: [
              'store_id',
              'customer_email',
              'review',
              'rating',
              'source',
              'source_tag',
              'status',
              'customer_name',
              'handle',
              'product_id',
              'reply',
              'reply_source',
              'reply_date',
              'review_date',
              'review_images',
              'title',
              'location',
            ],
            logging: console.log,
          });
        } catch (bulkInsertError) {
          throw new Error(
            `Database insertion failed: ${bulkInsertError.message}`
          );
        }
      }
    }

    console.log('Imported reviews from Stamped successfully');
    return { message: 'Migrated reviews from Stamped successfully' };
  } catch (error) {
    console.error('Error importing reviews from Stamped:', error);
    return { message: error.message };
  }
};

exports.importReviewsFromTrustoo = async (storeData, filePath, app_name) => {
  try {
    const fileData = await csvtojson().fromFile(filePath);
    const chunkSize = 5000;
    const arrayOfArrays = [];

    // Split the data into chunks
    for (let i = 0; i < fileData.length; i += chunkSize) {
      arrayOfArrays.push(fileData.slice(i, i + chunkSize));
    }

    // Utility function to normalize keys
    const normalizeKeys = (obj) => {
      const normalized = {};
      for (const key in obj) {
        normalized[key.replace(/\*/g, '').trim()] = obj[key];
      }
      return normalized;
    };

    // Process each chunk
    console.log('arrayOfArrays', arrayOfArrays);
    for (let array of arrayOfArrays) {
      let reviewArray = [];

      for (const rawRow of array) {
        // Normalize the keys
        const row = normalizeKeys(rawRow);

        // Validate required fields
        if (
          !row.product_handle ||
          !row.rating ||
          !row.author ||
          !row.commented_at
        ) {
          throw new Error(
            `Invalid data format, required fields are missing or incorrect. please check our sample CSV.`
          );
        }

        // Validate rating is between 1-5
        const rating = parseInt(row.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          throw new Error(
            `Invalid rating value: ${row.rating}. Rating must be between 1 and 5.`
          );
        }

        // Collect and format photo URLs
        const photoUrls = [];
        for (let i = 1; i <= 5; i++) {
          const photoUrl = row[`photo_url_${i}`];
          if (photoUrl && photoUrl.trim()) {
            photoUrls.push(photoUrl.trim());
          }
        }

        // Set up the review data
        const review = {
          store_id: storeData.id,
          customer_email: row.author_email ? row.author_email.trim() : null,
          customer_name: row.author.trim(),
          rating: rating,
          review: row.content ? row.content.trim() : '',
          title: row.title ? row.title.trim() : null,
          handle: row.product_handle.trim(),
          status: 'published',
          source: 'imported',
          source_tag: app_name,
          review_images: photoUrls.join(','),
          review_date: null,
          reply: row.reply ? row.reply.trim() : null,
          reply_date: null,
          is_verified: row.verify_purchase?.toLowerCase() === 'yes' ? '1' : '0',
        };

        // Find the product based on handle
        const product = await db.Products.findOne({
          where: { store_id: storeData.id, handle: row.product_handle },
          attributes: ['product_id', 'handle'],
        });

        if (!product) {
          throw new Error(
            `Product not found for handle: ${row.product_handle}`
          );
        }

        review.product_id = product.product_id;

        // Format the dates (Trustoo uses MM/DD/YYYY format)
        try {
          if (row.commented_at) {
            const [month, day, year] = row.commented_at.split('/');
            if (!month || !day || !year) {
              throw new Error(
                `Invalid date format for commented_at: ${row.commented_at}. Expected format: MM/DD/YYYY`
              );
            }
            review.review_date = `${year}-${month.padStart(
              2,
              '0'
            )}-${day.padStart(2, '0')}`;
          }

          if (row.reply && row.reply_at) {
            const [month, day, year] = row.reply_at.split('/');
            if (!month || !day || !year) {
              throw new Error(
                `Invalid date format for reply_at: ${row.reply_at}. Expected format: MM/DD/YYYY`
              );
            }
            review.reply_date = `${year}-${month.padStart(
              2,
              '0'
            )}-${day.padStart(2, '0')}`;
          }
        } catch (dateError) {
          throw new Error(`Date formatting error: ${dateError.message}`);
        }

        // Validate that if there's a reply, there must be a reply date
        if (review.reply && !review.reply_date) {
          throw new Error(
            `Reply date is required when a reply is provided. Row: ${JSON.stringify(
              row
            )}`
          );
        }

        // Add review to array
        reviewArray.push(review);
      }

      // Perform bulk insert
      if (reviewArray.length > 0) {
        console.log('Sample review from batch:', reviewArray);

        try {
          await db.Reviews.bulkCreate(reviewArray, {
            updateOnDuplicate: [
              'store_id',
              'customer_email',
              'review',
              'rating',
              'source',
              'source_tag',
              'status',
              'customer_name',
              'handle',
              'product_id',
              'reply',
              'reply_source',
              'reply_date',
              'review_date',
              'review_images',
              'title',
              'location',
              'is_verified',
              'custom_fields',
            ],
            logging: console.log,
          });
        } catch (bulkInsertError) {
          throw new Error(
            `Database insertion failed: ${bulkInsertError.message}`
          );
        }
      }
    }

    console.log('Imported reviews from Trustoo successfully');
    return { message: 'Migrated reviews from Trustoo successfully' };
  } catch (error) {
    console.error('Error importing reviews from Trustoo:', error);
    return { message: error.message };
  }
};
