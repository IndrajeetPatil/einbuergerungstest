/**
 * A readable message for any thrown value.
 * @param error - Whatever was thrown.
 * @returns The error's message, or the value as text.
 */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export { describeError };
