import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import CityMuseumRedirectPage, {
  generateMetadata,
} from "@/app/city/6529-museum-district/page";
import type { Metadata } from "next";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn(),
}));

describe("CityMuseumRedirectPage", () => {
  const redirectMock = redirect as jest.MockedFunction<typeof redirect>;
  const getAppMetadataMock =
    getAppMetadata as jest.MockedFunction<typeof getAppMetadata>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the museum district path", () => {
    CityMuseumRedirectPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/om/6529-museum-district/");
  });

  it("builds metadata using the shared helper", async () => {
    const metadata: Metadata = { title: "Redirecting..." };
    getAppMetadataMock.mockReturnValue(metadata);

    await expect(generateMetadata()).resolves.toBe(metadata);
    expect(getAppMetadataMock).toHaveBeenCalledWith({
      title: "Redirecting...",
    });
  });
});
