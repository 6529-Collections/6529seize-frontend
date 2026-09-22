import { generateMetadata } from "@/app/tools/api/page";
import { getAppMetadata } from "@/components/providers/metadata";

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((metadata: unknown) => metadata),
}));

describe("API documentation metadata", () => {
  it("summarizes the documentation available on the page", () => {
    generateMetadata();

    expect(getAppMetadata).toHaveBeenCalledWith(
      {
        title: "API | Tools",
        description:
          "Read the open REST API documentation, including authentication and drop media examples.",
      },
      { canonicalPath: "/tools/api" }
    );
  });
});
