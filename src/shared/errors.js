export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
