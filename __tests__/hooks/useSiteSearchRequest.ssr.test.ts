/**
 * @jest-environment node
 */
import { requestSiteSearch } from "@/hooks/useSiteSearchRequest";

it("does nothing outside a browser", () => {
  expect(typeof window).toBe("undefined");
  expect(requestSiteSearch()).toBeUndefined();
});
