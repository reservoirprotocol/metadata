export class RequestWasThrottledError extends Error {
  delay = 0;

  constructor(message, delay) {
    super(message);
    this.delay = delay;

    Object.setPrototypeOf(this, RequestWasThrottledError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
