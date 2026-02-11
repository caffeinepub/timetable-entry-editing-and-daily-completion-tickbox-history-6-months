/**
 * Wraps a promise with a timeout, rejecting if the promise doesn't resolve within the specified time.
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns Promise that rejects on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}
