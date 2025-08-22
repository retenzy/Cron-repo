const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'credit-redeems',
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
      redeem_type: {
        type: Sequelize.ENUM('social-media'),
        allowNull: false,
      },
      target: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_value: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      redeemer_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      redeemer_email: {
        type: Sequelize.STRING,
        allowNull: false,
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
