const { createLogger, format, transports } = require('winston');
const TransportStream = require('winston-transport');
const db = require('../../models')
class SequelizeTransport extends TransportStream {
  async log(info, callback) {
    setImmediate(() => this.emit('logged', info));
    const { level, message, value, store_id = null } = info;
    try {
      // await db.applicationLogs.create({
      //   level,
      //   message: message,
      //   value,
      //   store_id,
      // });
      callback();
    } catch (error) {
      // console.error("Failed to log to database:", error);
      callback(error);
    }
  }
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json() // Log in JSON format
  ),
  transports: [
    // new transports.Console(), // Logs to console
    new SequelizeTransport(), // Logs to MySQL using Sequelize
  ],
});
// Export the logger for use in controllers
module.exports = logger;
