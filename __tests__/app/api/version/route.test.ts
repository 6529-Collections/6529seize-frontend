jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import { GET } from "@/app/api/version/route";
import { NextResponse } from "next/server";

const jsonMock = NextResponse.json as jest.Mock;

describe("GET version route", () => {
  it("returns version from env and disables cache", async () => {
    const expected = { foo: "bar" }; // placeholder return object
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: "test-version" },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
    expect(result).toBe(expected);
  });

  it("returns default version when env variable is undefined", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = undefined;
    const expected = { foo: "bar" };
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: "unknown" },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
    expect(result).toBe(expected);
  });
});
