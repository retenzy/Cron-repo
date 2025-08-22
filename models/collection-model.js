const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'collection',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      collection_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
      },
      handle: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      updatedAt: {
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
