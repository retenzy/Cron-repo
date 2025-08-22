//Database Connection Build
const CONFIG = require('../config.js')
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  CONFIG.database.db,
  CONFIG.database.user,
  CONFIG.database.password,
  {
    host: CONFIG.database.host,
    dialect: CONFIG.database.dialect,
    logging: false,
    dialectOptions: {
      connectTimeout: 60000,
    },
    timezone: '+05:30',
    pool: {
      max: CONFIG.database.pool.max,
      min: CONFIG.database.pool.min,
      acquire: CONFIG.database.pool.acquire,
      idle: CONFIG.database.pool.idle,
    },
  }
);

const db = { sequelize: sequelize };
//DB Connection
// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('Database connection has been established successfully.');
//   })
//   .catch((err) => {
//     console.error('Unable to connect to the database:', err);
//   });

//All Models Include
db.Platform = require('./platform-model')(sequelize);
//Create platform
db.Platform.findOrCreate({
  where: { name: 'shopify' },
  defaults: { name: 'shopify', status: 'Active' },
});

db.PlatformUser = require('./platform_user-model')(sequelize);
// db.pointBranding = require('./point_branding-model')(sequelize);
db.ApplicationUser = require('./application_user-model')(sequelize);
db.Store = require('./store-model')(sequelize);
db.StoreTags = require('./store_tags-model')(sequelize);
db.User = require('./users-model')(sequelize);
db.Order = require('./orders-model')(sequelize);
db.OrderItems = require('./order_items-model')(sequelize);
db.OrderAddress = require('./order_address-model')(sequelize);
db.Products = require('./products-model')(sequelize);
db.Collection = require('./collection-model')(sequelize);
db.ProductImages = require('./product_images-model')(sequelize);
db.ProductVariants = require('./product_variants-model')(sequelize);
db.Customers = require('./customers-model')(sequelize);
db.CustomerAddress = require('./customer_address-model')(sequelize);
db.CreditList = require('./credit_list-model')(sequelize);
db.CreditLogs = require('./credit_logs-model')(sequelize);
db.CreditRules = require('./credit_rules-model')(sequelize);

db.RedeemRules = require('./redeem_rules-model')(sequelize);

db.Offers = require('./offers-model')(sequelize);
db.Reviews = require('./reviews-model')(sequelize);
db.QuestionAnswers = require('./question_answer-model')(sequelize);
db.ReviewSetting = require('./review_setting-model')(sequelize);
db.WidgetSettings = require('./widget-settings-model')(sequelize);
db.CreditRedemption = require('./credit_redemption-model')(sequelize);
db.ApplicationCharges = require('./application_charge-model')(sequelize);
db.PricingPlan = require('./pricing_plans-model')(sequelize);
db.PricingPlanDiscounts = require('./pricing_plans_discounts-model')(sequelize);
db.PlanFeatures = require('./plans_features-model')(sequelize);
db.Tour = require('./tour-model')(sequelize);
db.DraftOrders = require('./draft_order-model')(sequelize);
db.codeInstallation = require('./code_installation-model')(sequelize);
db.installedTheme = require('./installed_themes-model')(sequelize);
db.Integration = require('./integration-model')(sequelize);
db.Settings = require('./settings-model')(sequelize);
db.errorLogs = require('./error_log-model')(sequelize);
db.applicationLogs = require('./application_log-model')(sequelize);
db.usageLogs = require('./usage_charges_log-model')(sequelize);
db.OrderFulfillments = require('./order_fulfillments-model')(sequelize);
db.usageLogs = require('./usage_charges_log-model')(sequelize);
db.SuperAdmin = require('./super_admin-model')(sequelize);
db.AmazonReviews = require('./amazon_reviews-model')(sequelize);
db.Referral = require('./referral-model')(sequelize);
db.CreditRedeem = require('./credit-redeem-model')(sequelize);
db.EmailTemplates = require('./email_templates-model')(sequelize);
db.EmailLogs = require('./email_logs-model')(sequelize);
db.RewardWidgetSettings = require('./reward_widget_settings-model')(sequelize);
db.LimitReached = require('./limit_reached-model')(sequelize);
db.CustomerDashboardSettings = require('./customer_dashboard_settings-model')(
  sequelize
);
db.RoleModel = require('./role-model')(sequelize);
db.TemporaryAppUser = require('./temporary_appuser-modal')(sequelize);

/////////////////////////

db.ProductGroup = require('./product_group-model')(sequelize);
// db.ProductGroupMapping = require("./product_group_mapping-model")(sequelize);
// db.Products.belongsToMany(db.ProductGroup, {
//   through: db.ProductGroupMapping,
//   foreignKey: "product_id", // Matches `product_id` in ProductGroupMapping
// });
// db.ProductGroup.belongsToMany(db.Products, {
//   through: db.ProductGroupMapping,
//   foreignKey: "group_id", // Matches `group_id` in ProductGroupMapping
// });

db.ProductGroup.sync({ alter: true });
// db.ProductGroupMapping.sync({ alter: true });
//////////////////////////////////////////
db.PricingPlanDiscounts.belongsTo(db.PricingPlan, {
  foreignKey: 'discount_id',
  sourceKey: 'discount_id',
  hooks: true,
});
db.PricingPlanDiscounts.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasOne(db.PricingPlanDiscounts, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
// db.Store.hasOne(db.pointBranding, {
//   foreignKey: 'store_id',
//   sourceKey: 'id',
//   hooks: true,
// });

db.PricingPlan.hasMany(db.PricingPlanDiscounts, {
  foreignKey: 'discount_id',
  sourceKey: 'discount_id',
  hooks: true,
});
// db.PricingPlan.hasOne(db.Store, { foreignKey: 'pricing_plan_id', sourceKey: 'id', hooks: true })
db.Store.belongsTo(db.PricingPlan, {
  foreignKey: 'pricing_plan_id',
  sourceKey: 'id',
  hooks: true,
});
db.PlanFeatures.belongsTo(db.PricingPlan, {
  foreignKey: 'plan_id',
  sourceKey: 'id',
  hooks: true,
});
db.PricingPlan.hasMany(db.PlanFeatures, {
  foreignKey: 'plan_id',
  sourceKey: 'id',
  hooks: true,
});
db.Customers.hasMany(db.CreditLogs, {
  foreignKey: 'customer_credit_id',
  sourceKey: 'id',
  hooks: true,
});
db.CreditLogs.belongsTo(db.Customers, {
  foreignKey: 'customer_credit_id',
  sourceKey: 'id',
  hooks: true,
});
db.Products.hasMany(db.Offers, {
  foreignKey: 'product_id',
  sourceKey: 'id',
  hooks: true,
});
db.Offers.belongsTo(db.Products, {
  foreignKey: 'product_id',
  sourceKey: 'id',
  hooks: true,
});
db.Offers.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Products.hasMany(db.ProductVariants, {
  foreignKey: 'product_id',
  sourceKey: 'id',
  hooks: true,
});
db.Products.hasMany(db.ProductImages, {
  foreignKey: 'product_id',
  sourceKey: 'id',
  hooks: true,
});
db.ProductVariants.belongsTo(db.Products, {
  foreignKey: 'product_id',
  sourceKey: 'id',
  hooks: true,
});
db.ProductImages.hasOne(db.ProductVariants, {
  foreignKey: 'image_id',
  sourceKey: 'id',
  hooks: true,
});
db.ProductVariants.belongsTo(db.ProductImages, {
  foreignKey: 'image_id',
  sourceKey: 'id',
  hooks: true,
});
db.Customers.hasMany(db.CustomerAddress, {
  foreignKey: 'customer_id',
  sourceKey: 'id',
  hooks: true,
});
db.CustomerAddress.belongsTo(db.Customers, {
  foreignKey: 'customer_id',
  sourceKey: 'id',
  hooks: true,
});
db.Reviews.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasMany(db.Reviews, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});

db.QuestionAnswers.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasMany(db.QuestionAnswers, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});

db.Order.hasMany(db.OrderItems, {
  foreignKey: 'order_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasMany(db.CreditRules, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.CreditRules.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
//////////////////////////////////////
db.Store.hasMany(db.RedeemRules, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.RedeemRules.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.OrderItems.belongsTo(db.Order, {
  foreignKey: 'order_id',
  sourceKey: 'id',
  hooks: true,
});
db.Order.hasMany(db.OrderAddress, {
  foreignKey: 'order_id',
  sourceKey: 'id',
  hooks: true,
});
db.OrderFulfillments.belongsTo(db.OrderItems, {
  foreignKey: 'line_item_id',
  sourceKey: 'id',
  hooks: true,
});
db.OrderItems.hasMany(db.OrderFulfillments, {
  foreignKey: 'line_item_id',
  sourceKey: 'id',
  hooks: true,
});

// db.Customers.hasMany(db.Order, {
//   foreignKey: "customer_id",
//   sourceKey: "customer_id",
//   hooks: true,
// });
// db.Order.belongsTo(db.Customers, {
//   foreignKey: "customer_id",
//   targetKey: "customer_id",
//   hooks: true,
// });

db.Store.hasMany(db.ReviewSetting, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.ReviewSetting.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});

// db.Store.hasMany(db.Order, {
//   foreignKey: "store_id",
//   sourceKey: "id",
//   hooks: true,
// });
// db.Order.belongsTo(db.Store, {
//   foreignKey: "store_id",
//   sourceKey: "id",
//   hooks: true,
// });

db.Integration.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasMany(db.Integration, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});

db.Order.hasMany(db.EmailLogs, {
  foreignKey: 'order_id',
  sourceKey: 'order_id',
  // as: "EmailLogs",
});
db.EmailLogs.belongsTo(db.Order, {
  foreignKey: 'order_id',
  targetKey: 'order_id',
});

db.Settings.belongsTo(db.Store, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});
db.Store.hasMany(db.Settings, {
  foreignKey: 'store_id',
  sourceKey: 'id',
  hooks: true,
});

// db.TemporaryAppUser.sync({ alter: true });
// db.ApplicationUser.sync({ alter: true });
module.exports = db;
