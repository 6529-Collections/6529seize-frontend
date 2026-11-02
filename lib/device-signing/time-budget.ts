/**
 * Resolves to the task's result, or to null once the budget elapses, so
 * optional device-key work never holds up a write or a sign-in.
 */
export async function withinTimeBudget<T>(
  task: Promise<T | null>,
  budgetMs: number
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), budgetMs);
  });
  try {
    return await Promise.race([task, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
