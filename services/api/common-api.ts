import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../../constants";

export const commonApiFetch = async <T>(param: {
  endpoint: string;
  headers?: Record<string, string>;
}): Promise<T> => {
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  const headers = {
    "Content-Type": "application/json",
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...param.headers,
  };
  const res = await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    headers,
  });
  return res.json();
};

export const commonApiPost = async <T>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string>;
}): Promise<void> => {
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
      ...param.headers,
    },
    body: JSON.stringify(param.body),
  });
};
