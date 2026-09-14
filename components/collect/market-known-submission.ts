/** A known hash is never a reason to request another wallet send. Retry only acknowledgement. */
export async function acknowledgeMarketSubmission<T>(
  submit: () => Promise<T>,
  retry: () => void
): Promise<T> {
  try {
    return await submit();
  } catch {
    retry();
    try {
      return await submit();
    } catch {
      throw new Error("MARKET_SUBMISSION_PENDING");
    }
  }
}
