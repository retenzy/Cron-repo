const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'redeem_rules',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        comment: 'Name of the redeem rule.',
      },
      coupon_prefix: {
        type: Sequelize.STRING,
        comment: 'Prefix for the coupon code.',
      },
      rule_type: {
        type: Sequelize.ENUM(
          'amount_discount',
          'percentage_discount',
          'free_shipping',
          'free_product',
          'buy_x_get_y'
        ),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indicates if the redeem rule is active.',
      },
      is_referrer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment:
          'Indicates if the redeem rule is for the referrer (the person who refers).',
      },
      is_referring_user: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment:
          'Indicates if the redeem rule is for the referred user (the person who is referred).',
      },
      points: {
        type: Sequelize.INTEGER(11),
        comment: 'Number of points required to redeem the coupon.',
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: null,
        comment:
          "The value of the discount applied by the coupon. Null indicates no limit. Applicable for 'fixed', 'percentage', and 'incremented' discount types.",
      },
      discount_type: {
        type: Sequelize.ENUM('fixed', 'incremented'),
        defaultValue: 'fixed',
        comment:
          'fixed means a fixed amount discount. incremented means the discount amount increases in multiple of points.',
      },
      min_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: null,
        comment:
          'Minimum order amount required to apply the coupon. Null indicates no minimum.',
      },
      min_cart_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        comment:
          'Minimum number of items in the cart required to apply the coupon. Null indicates no limit.',
      },
      selection_type: {
        type: Sequelize.ENUM('all', 'included', 'excluded'),
        defaultValue: 'all',
        comment:
          "'all' means the coupon applies to all products. 'included' means it applies only to selected products or collections. 'excluded' means it applies to all except the selected products or collections.",
      },
      selected_product_ids: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'List of product IDs eligible under the coupon condition.',
      },
      selected_collection_ids: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'List of collection IDs eligible under the coupon condition.',
      },
      max_points_allowed: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        comment:
          "Maximum number of points that can be redeemed at once. Applies only to 'incremented' discount type. Null indicates no limit.",
      },
      buy_product_ids: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment:
          "List of product IDs required to be purchased in 'buy X get Y' or 'buy X get Y with discount' offers.",
      },
      get_product_ids: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment:
          "List of product IDs given in 'buy X get Y' or 'buy X get Y with discount' offers.",
      },
      combine_with_product_discount: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment:
          'Indicates if the coupon can be combined with product discounts.',
      },
      combine_with_order_discount: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment:
          'Indicates if the coupon can be combined with order discounts.',
      },
      combine_with_shipping_discount: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment:
          'Indicates if the coupon can be combined with shipping discounts.',
      },
      expires_after: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true,
        comment: 'Number of days after which the coupon expires.',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
