import { getRequestOrigin } from "@/config/requestOrigin";

it.each([
  [
    { host: "localhost:3001", "x-forwarded-proto": "http" },
    "http://localhost:3001",
  ],
  [{ host: "staging.6529.io" }, "https://staging.6529.io"],
  [
    {
      host: "internal:3000",
      "x-forwarded-host": "prxtstaging.6529.io",
      "x-forwarded-proto": "https",
    },
    "https://prxtstaging.6529.io",
  ],
  [{ host: "6529.io" }, "https://6529.io"],
  [{ host: "www.6529.io" }, "https://www.6529.io"],
  [
    {
      "x-forwarded-host": "staging.6529.io, internal:3000",
      "x-forwarded-proto": "https, http",
    },
    "https://staging.6529.io",
  ],
  [
    {
      host: "localhost:3001",
      "x-forwarded-host": "invalid/path",
      "x-forwarded-proto": "http",
    },
    "http://localhost:3001",
  ],
  [{ host: "[broken" }, "https://6529.io"],
  [{ host: "user@host" }, "https://6529.io"],
  [{ host: "host?query" }, "https://6529.io"],
  [{}, "https://6529.io"],
])("resolves presentation origin from %j", (values, expected) => {
  const headers = {
    get: (key: string) => (values as Record<string, string>)[key] ?? null,
  };
  expect(getRequestOrigin(headers)).toBe(expected);
});
