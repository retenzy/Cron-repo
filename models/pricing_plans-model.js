const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('pricing_plans', {
    id: {
      type: Sequelize.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    discount_id: {
      type: Sequelize.INTEGER(11),
      references: {
        model: 'pricing_plans_discounts',
        key: 'discount_id',
      },
      onDelete: 'CASCADE',
    },
    orders: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    credit_rule_limit: {
      type: Sequelize.JSON,
      defaultValue: null,
    },
    product_in_deal: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    deal_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    customer_in_deal: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    customised_deal_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    amazon_review: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    amazon_reviews_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    email_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    integration_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    plan_name: {
      type: Sequelize.STRING,
    },
    product_in_deal: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    price: {
      type: Sequelize.DOUBLE,
    },
    lifetime_price: {
      type: Sequelize.DOUBLE,
    },
    free_trial_days: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    customer_limit: {
      type: Sequelize.INTEGER,
      defaultValue: '0',
    },
    upsell_percentage: {
      type: Sequelize.INTEGER(10),
      defaultValue: '0',
    },
    charge_per_100_orders: {
      type: Sequelize.INTEGER(10),
      defaultValue: '0',
    },
    ltd_orders: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
    stripe_product_id: {
      type: Sequelize.STRING,
    },
    stripe_price_id: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    is_active: {
      type: Sequelize.DataTypes.ENUM('0', '1'),
      defaultValue: '0',
    },
    plan_type: {
      type: Sequelize.DataTypes.ENUM('GLOBAL', 'CUSTOM'),
      defaultValue: 'GLOBAL',
    },
    capped_amount: {
      type: Sequelize.INTEGER(10),
    },
    annual_discount: {
      type: Sequelize.INTEGER(10),
      defaultValue: '0',
    },
    store_id: {
      type: Sequelize.INTEGER(11),
      references: {
        model: 'stores',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    store_tags: {
      type: Sequelize.JSON,
      references: {
        model: 'stores_tags',
        key: 'tag_id',
      },
      onDelete: 'CASCADE',
    },
    csv_input_limit: {
      type: Sequelize.INTEGER(10),
      defaultValue: null,
    },
  });
};
