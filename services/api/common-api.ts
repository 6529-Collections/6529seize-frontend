export async function commonApiFetch<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const res = await fetch(`${process.env.API_ENDPOINT}${endpoint}`, {
    headers,
  });
  return res.json();
}
