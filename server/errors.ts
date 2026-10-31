/** A request the API rejects with HTTP 400. */
class ValidationError extends Error {
  public override readonly name = "ValidationError";

  public constructor(message: string) {
    super(message);
  }
}

export { ValidationError };
