class RedirectError extends Error {
  constructor(redirectTo) {
    super();
    // assign the error class name in your custom error
    this.name = this.constructor.name;
    this.redirectTo = redirectTo;
  }
}

module.exports = RedirectError;
