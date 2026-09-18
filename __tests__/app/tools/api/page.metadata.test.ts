import { generateMetadata } from "@/app/tools/api/page";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn().mockReturnValue({
    title: "API | Tools",
  } as Metadata),
}));

describe("tools API metadata", () => {
  it("publishes the API reference canonical", () => {
    expect(generateMetadata()).toEqual({ title: "API | Tools" });
    expect(getAppMetadata).toHaveBeenCalledWith(
      { title: "API | Tools", description: "API" },
      { canonicalPath: "/tools/api" }
    );
  });
});
