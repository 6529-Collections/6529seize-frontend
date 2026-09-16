/** @jest-environment node */
import { fullScreenSupported } from "@/helpers/Helpers";

it("returns false without accessing a missing server document", () => {
  expect(typeof globalThis.document).toBe("undefined");
  expect(fullScreenSupported()).toBe(false);
});
