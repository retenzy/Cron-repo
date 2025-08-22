const Sequelize = require('sequelize');
/** @type {import('sequelize').Model} */
module.exports = (sequelize) => {
  return sequelize.define(
    'referrals',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      referral_sender_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'customers', // Change this if your customer model/table is named differently
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      referral_receiver_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'customers', // Same here
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      referral_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referrer_rewarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      receiver_rewarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [],
    }
  );
};
