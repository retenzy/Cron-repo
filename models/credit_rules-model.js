const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'credit_rule',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('Unlimited', 'Expired'),
        allowNull: false,
      },
      expiry_days: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      value: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      point: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      // rule_type: {
      //   type: Sequelize.ENUM("birthday", "quantity", "amount", 'signup', 'referral','facebook','instagram','twitter','tiktok')
      // },
      rule_type: {
        type: Sequelize.ENUM(
          'birthday',
          'order',
          'anniversary',
          'quantity',
          'amount',
          'signup',
          'referral', // ✅ Only once
          'facebook',
          'instagram',
          'twitter',
          'tiktok',
          'review',
          'share_facebook',
          'share_twitter',
          'linkedin',
          'pinterest',
          'youtube'
        ),
      },
      is_active: {
        type: Sequelize.ENUM('0', '1'),
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};

//how to sync this model
