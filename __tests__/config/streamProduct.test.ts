/** @jest-environment node */
import {
  getStreamProductEnvironment,
  isStreamProductEnabled,
  STREAM_PRODUCT_PRODUCTION_ENABLED,
} from "@/config/streamProduct";

describe("the 6529 Stream section flag", () => {
  it("is on for local development and staging", () => {
    expect(getStreamProductEnvironment("http://localhost:3001")).toBe("local");
    expect(getStreamProductEnvironment("http://127.0.0.1:3001")).toBe("local");
    expect(getStreamProductEnvironment("https://staging.6529.io")).toBe(
      "staging"
    );
    expect(isStreamProductEnabled("https://staging.6529.io")).toBe(true);
  });

  it("is off in production until launch", () => {
    expect(STREAM_PRODUCT_PRODUCTION_ENABLED).toBe(false);
    expect(isStreamProductEnabled("https://6529.io")).toBe(false);
    expect(isStreamProductEnabled("https://www.6529.io")).toBe(false);
  });

  it("fails closed on unknown or malformed hosts", () => {
    expect(isStreamProductEnabled("https://preview.example.com")).toBe(false);
    expect(isStreamProductEnabled("https://staging.6529.io.evil.test")).toBe(
      false
    );
    expect(isStreamProductEnabled("not a url")).toBe(false);
  });
});
