const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'store_tags',
    {
      tag_id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tag_name: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    }
  );
};
