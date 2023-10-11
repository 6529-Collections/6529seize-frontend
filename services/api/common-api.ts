import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../../constants";
import { getAuthJwt } from "../auth/auth.utils";

const getHeaders = (headers?: Record<string, string>) => {
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  const walletAuth = getAuthJwt();
  return {
    "Content-Type": "application/json",
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
  return res.json();
};
