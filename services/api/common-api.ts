import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../../constants";
import { getAuthJwt } from "../auth/auth.utils";

const getHeaders = (
  headers?: Record<string, string>,
  contentType: boolean = true
) => {
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  const walletAuth = getAuthJwt();
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
    ...(headers || {}),
  };
};

export const commonApiFetch = async <T>(param: {
  endpoint: string;
  headers?: Record<string, string>;
}): Promise<T> => {
  const res = await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    headers: getHeaders(param.headers),
  });
  if (!res.ok) {
    const body: any = await res.json();
    throw new Error(body?.error ?? res.statusText ?? "Something went wrong");
  }
  return res.json();
};

export const commonApiPost = async <T, U>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string>;
}): Promise<U> => {
  const res = await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    method: "POST",
    headers: getHeaders(param.headers),
    body: JSON.stringify(param.body),
  });
  if (!res.ok) {
    const body: any = await res.json();
    throw new Error(body?.error ?? res.statusText ?? "Something went wrong");
  }
  return res.json();
};

export const commonApiPostForm = async <U>(param: {
  endpoint: string;
  body: FormData;
  headers?: Record<string, string>;
}): Promise<U> => {
  const res = await fetch(`${process.env.API_ENDPOINT}/api/${param.endpoint}`, {
    method: "POST",
    headers: getHeaders(param.headers, false),
    body: param.body,
  });
  if (!res.ok) {
    const body: any = await res.json();
    throw new Error(body?.error ?? res.statusText ?? "Something went wrong");
  }
  return res.json();
};
