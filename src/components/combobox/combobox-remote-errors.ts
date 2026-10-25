/** Initial attempt + retries. */
export const MAX_ATTEMPTS = 3;
/** HTTP statuses that are never retried (auth/permission problems). */
export const NON_RETRYABLE_STATUS = new Set([401, 403]);

export const DEFAULT_REMOTE_ERROR_MESSAGE =
  "Could not load the options. Close and reopen this field to try again.";

/**
 * HTTP-ish status detection: supports `{ status }` and axios-like `{ response: { status } }` errors.
 * Lets retry logic skip auth/permission failures without depending on any HTTP client.
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") return status;
  const response = (error as { response?: { status?: unknown } }).response;
  if (response && typeof response === "object") {
    const responseStatus = (response as { status?: unknown }).status;
    if (typeof responseStatus === "number") return responseStatus;
  }
  return null;
}
