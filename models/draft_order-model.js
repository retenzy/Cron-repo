const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'draft_order',
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
      draft_order_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customer_email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      amount: {
        type: Sequelize.STRING(30),
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed'),
        defaultValue: 'pending',
      },
      draftorder_created_at: {
        type: Sequelize.DATE,
      },
      draftorder_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      credit: {
        type: Sequelize.INTEGER(20),
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
