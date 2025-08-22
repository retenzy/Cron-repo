const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'roles',
    {
      first_name: {
        type: Sequelize.STRING(20),
        allowNull: false,
        validate: {
          len: [1, 20],
        },
      },
      last_name: {
        type: Sequelize.STRING(20),
      },
      email: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [5, 50],
        },
      },
      role: {
        type: Sequelize.ENUM('admin', 'developer', 'support', 'sales'),
        defaultValue: 'support',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
