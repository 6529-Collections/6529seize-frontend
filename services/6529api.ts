import { DBResponse } from "@/entities/IDBResponse";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "@/constants";
import { getStagingAuth } from "./auth/auth.utils";

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    const normalized = key.toLowerCase() === "content-type" ? "Content-Type" : key;
    result[normalized] = value;
  });
  return result;
}

export async function fetchUrl<T = DBResponse>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const baseHeaders = new Headers(init?.headers);
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    baseHeaders.set("x-6529-auth", apiAuth);
  }
  const headers = headersToObject(baseHeaders);
  const res = await fetch(url, {
    ...init,
    headers,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  return (await res.json()) as T;
}

export async function fetchAllPages(url: string, data?: any[]): Promise<any[]> {
  let allData: any[] = [];
  if (data) {
    allData = data;
  }
  const response = await fetchUrl<DBResponse>(url);
  allData = [...allData].concat(response.data);
  if (response.next) {
    return fetchAllPages(response.next, allData);
  }
  return allData;
}

export async function postData(url: string, body: any, init?: RequestInit) {
  const baseHeaders = new Headers(init?.headers);
  if (!baseHeaders.has("Content-Type")) {
    baseHeaders.set("Content-Type", "application/json");
  }
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    baseHeaders.set("x-6529-auth", apiAuth);
  }
  const headers = headersToObject(baseHeaders);
  const res = await fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}

export async function postFormData(url: string, formData: FormData) {
  let headers: any = {};
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    headers = { "x-6529-auth": apiAuth };
  }
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: headers,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}
