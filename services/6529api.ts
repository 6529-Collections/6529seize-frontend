import type { Paginated } from "@/components/pagination/Pagination";
import { API_AUTH_COOKIE } from "@/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import Cookies from "js-cookie";
import { getStagingAuth } from "./auth/auth.utils";

function buildAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    headers.set("x-6529-auth", apiAuth);
  }
  return headers;
}

function handleResponseError(res: Response): void {
  if (res.status === 401) {
    Cookies.remove(API_AUTH_COOKIE);
    return;
  }
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
}

export async function fetchUrl<T = DBResponse>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const headers = buildAuthHeaders(init?.headers);
  const res = await fetch(url, {
    ...init,
    headers,
  });
  handleResponseError(res);
  return await res.json();
}

export async function fetchAllPages<T>(
  startUrl: string,
  init?: RequestInit
): Promise<T[]> {
  const all: T[] = [];
  let url = startUrl;

  while (url) {
    const response = await fetchUrl<Paginated<T>>(url, init);

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
  const headers = buildAuthHeaders(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
  handleResponseError(res);
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}

export async function postFormData(url: string, formData: FormData) {
  const headers = buildAuthHeaders();
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
  });
  handleResponseError(res);
  const json = await res.json();
  return {
    status: res.status,
    response: json,
  };
}
