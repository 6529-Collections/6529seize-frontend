import { permanentRedirect } from "next/navigation";
import MuseumMethodologyPage from "@/app/museum/network/methodology/page";

jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(() => {
    throw new Error("permanent_redirect");
  }),
}));

const mockedPermanentRedirect = jest.mocked(permanentRedirect);

describe("Museum methodology compatibility route", () => {
  it("permanently redirects the legacy methodology entry point to Research", async () => {
    await expect(MuseumMethodologyPage()).rejects.toThrow("permanent_redirect");
    expect(mockedPermanentRedirect).toHaveBeenCalledWith(
      "/museum/network/research"
    );
  });
});
