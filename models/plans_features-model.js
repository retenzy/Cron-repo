const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'plan_features',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      plan_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'pricing_plans',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['key', 'plan_id'],
        },
      ],
    }
  );
};
