import { DBResponse } from "../entities/IDBResponse";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../constants";

export async function fetchUrl(url: string): Promise<DBResponse> {
  let headers = {};
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  if (apiAuth) {
    headers = { "x-6529-auth": apiAuth };
  }
  const res = await fetch(url, {
    headers: headers,
  });
  if (res.status == 401) {
    Cookies.remove(API_AUTH_COOKIE);
  }
  return await res.json();
}

export async function fetchAllPages(url: string, data?: any[]): Promise<any[]> {
  let allData: any[] = [];
  if (data) {
    allData = data;
  }
  const response = await fetchUrl(url);
  allData = [...allData].concat(response.data);
  if (response.next) {
    return fetchAllPages(response.next, allData);
  }
  return allData;
}

export async function postData(url: string, body: any) {
  let headers = {};
  const apiAuth = Cookies.get(API_AUTH_COOKIE);
  if (apiAuth) {
    headers = { "x-6529-auth": apiAuth };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: headers,
  });
  if (res.ok) {
    const json = await res.json();
    return {
      status: res.status,
      response: json,
    };
  } else {
    return {
      status: res.status,
      response: {},
    };
  }
}
