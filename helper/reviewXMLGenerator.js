// reviewXMLGenerator.js
const { Builder } = require('xml2js');
class ReviewXMLGenerator {
  constructor(appName) {
    this.appName = appName;
  }
  generateXML(reviews) {
    try {
      const xmlObj = {
        feed: {
          $: {
            'xmlns:vc': 'http://www.w3.org/2007/XMLSchema-versioning',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:noNamespaceSchemaLocation':
              'http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd',
          },
          version: ['2.3'],
          aggregator: [
            {
              name: [this.appName],
            },
          ],
          publisher: [
            {
              name: [this.appName],
            },
          ],
          reviews: [
            {
              review: reviews.map((review) => this._formatReview(review)),
            },
          ],
        },
      };

      const builder = new Builder({
        renderOpts: { pretty: true, indent: '  ' },
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      });
      console.log('before builder.buildObject');
      return builder.buildObject(xmlObj);
    } catch (error) {
      console.log('error inside ReviewXMLGenerator generateXML ', error);
      throw error;
    }
  }

  _formatReview(review) {
    try {
      return {
        reviewer: [
          {
            name: [review.reviewerName],
          },
        ],
        review_timestamp: [review.timestamp],
        // title: [review.title],
        content: [this.sanitizeXMLString(review.content || '')],
        review_url: [
          {
            $: { type: 'group' },
            _: review.reviewUrl,
          },
        ],
        reviewer_images: [
          {
            reviewer_image: review.reviewImages.map((image) => ({
              url: [image],
            })),
          },
        ],
        ratings: [
          {
            overall: [
              {
                $: { min: '1', max: '5' },
                _: review.rating.toString(),
              },
            ],
          },
        ],
        products: [
          {
            product: [
              {
                product_ids: [
                  {
                    gtins: [
                      {
                        gtin: review.product.gtins,
                      },
                    ],
                    skus: [
                      {
                        sku: review.product.skus,
                      },
                    ],
                    brands: [
                      {
                        brand: [review.product.brand],
                      },
                    ],
                  },
                ],
                product_url: [review.product.productUrl],
              },
            ],
          },
        ],
        is_spam: [review.isSpam ? 'true' : 'false'],
        review_id: [review.reviewId],
      };
    } catch (error) {
      console.log('errro in formatReview', error);
      throw error;
    }
  }

  sanitizeXMLString(str) {
    try {
      if (!str) return '';
      return str
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    } catch (error) {
      console.log('error in sanitizeXMLString', error);
      throw error;
    }
  }
}
module.exports = ReviewXMLGenerator;
