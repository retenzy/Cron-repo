const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'product',
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
      product_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      tags: {
        type: Sequelize.STRING,
      },
      handle: {
        type: Sequelize.STRING,
      },
      published_at: {
        type: Sequelize.STRING,
      },
      product_type: {
        type: Sequelize.STRING,
      },
      is_active: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '1',
      },
      is_delete: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      asin_no: {
        type: Sequelize.STRING(20),
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      domain: {
        type: Sequelize.STRING(40),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'product_id'],
        },
      ],
    }
  );
};
