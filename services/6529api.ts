import { DBResponse } from "../entities/IDBResponse";

export function fetchAllPages(url: string, data?: any[]): Promise<any[]> {
  let allData: any[] = [];
  if (data) {
    allData = data;
  }
  return fetch(url)
    .then((res) => res.json())
    .then((response: DBResponse) => {
      allData = [...allData].concat(response.data);
      if (response.next) {
        return fetchAllPages(response.next, allData);
      } else {
        allData = [...allData].filter((value, index, self) => {
          return self.findIndex((v) => v.id === value.id) === index;
        });
        return allData;
      }
    });
}
