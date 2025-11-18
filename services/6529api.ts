import { Paginated } from "@/components/pagination/Pagination";
import { API_AUTH_COOKIE } from "@/constants";
import { DBResponse } from "@/entities/IDBResponse";
import Cookies from "js-cookie";
import { getStagingAuth } from "./auth/auth.utils";

export async function fetchUrl<T = DBResponse>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const baseHeaders = new Headers(init?.headers);
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    baseHeaders.set("x-6529-auth", apiAuth);
  }
  const res = await fetch(url, {
    ...init,
    headers: baseHeaders,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return await res.json();
}

export async function fetchAllPages<T>(startUrl: string): Promise<T[]> {
  const all: T[] = [];
  let url = startUrl;

  while (url) {
    const response = await fetchUrl<Paginated<T>>(url);

    if (Array.isArray(response.data)) {
      all.push(...response.data);
    }

    url = getNextUrl(url, response.next);
  }

  return all;
}

function getNextUrl(currentUrl: string, next?: string | boolean): string {
  if (!next) return "";

  if (typeof next === "string") {
    try {
      return new URL(next, currentUrl).toString();
    } catch (error) {
      console.error("Invalid next URL:", next, error);
      return "";
    }
  }

  try {
    const u = new URL(currentUrl);
    const cur = u.searchParams.get("page");
    const curNum = cur ? Number.parseInt(cur, 10) || 1 : 1;
    u.searchParams.set("page", String(curNum + 1));
    return u.toString();
  } catch (error) {
    console.error("Invalid current URL:", currentUrl, error);
    return "";
  }
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
  const res = await fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
    headers: baseHeaders,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}

export async function postFormData(url: string, formData: FormData) {
  const headers = new Headers();
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    headers.set("x-6529-auth", apiAuth);
  }
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
  });
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}
