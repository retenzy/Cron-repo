const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
module.exports = (sequelize) => {
  const User = sequelize.define(
    'platform_user',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true, // Allow null for OAuth users
        validate: {
          len: {
            args: [6, 100],
            msg: 'Password must be at least 6 characters long',
          },
        },
      },
      storeUrl: {
        type: Sequelize.STRING,
      },
      country: {
        type: Sequelize.STRING,
      },
      mobile: {
        type: Sequelize.STRING,
      },
      isInstalled: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'local', // Can be 'local', 'google', or 'facebook'
      },
      providerId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referal_Id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      hooks: {
        // Hash password before saving
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  // Method to compare password
  User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};
