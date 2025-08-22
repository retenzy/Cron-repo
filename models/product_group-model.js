const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'product_group',
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
      name: {
        type: Sequelize.STRING,
      },
      productIds: {
        type: Sequelize.JSON, // Storing an array of product IDs in JSON format
        allowNull: false,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
