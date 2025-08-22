const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'tour',
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
      completed: {
        type: Sequelize.TEXT,
      },
      skip: {
        type: Sequelize.STRING,
        defaultValue: 'false',
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
      indexes: [
        {
          unique: true,
          fields: ['store_id'],
        },
      ],
    }
  );
};
