export const commonApiFetch = async <T>(endpoint: string): Promise<T> => {
  const res = await fetch(`${process.env.API_ENDPOINT}/api/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.json();
};

export const commonApiPost = async <T>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string>;
}): Promise<void> => {
  await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...param.headers,
    },
    body: JSON.stringify(param.body),
  });
};
