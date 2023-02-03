export class RequestWasThrottledError extends Error {
  delay = 0;

  constructor(message, delay) {
    super(message);
    this.delay = delay;

    Object.setPrototypeOf(this, RequestWasThrottledError.prototype);
  }
}
