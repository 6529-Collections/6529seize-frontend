const formatDuration = (durationMs: number): number =>
  Number(durationMs.toFixed(2));

export async function withServerTiming<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = formatDuration(performance.now() - start);
    console.info(`[server-timing] ${label}=${duration}ms`);
  }
}
