class CustomError extends Error {
  constructor(statusCode, message) {
    super();
    // assign the error class name in your custom error
    this.name = this.constructor.name;

    this.message = message || 'Something went wrong please try again';
    this.code = statusCode || 500; // error code for responding to client
  }
}

module.exports = CustomError;
