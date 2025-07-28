import { render } from "@testing-library/react";
import CommunityDownloadsRoyalties from "@/components/community-downloads/CommunityDownloadsRoyalties";
import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock("@/components/community-downloads/CommunityDownloadsComponent");

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<
  typeof CommunityDownloadsComponent
>;

describe("CommunityDownloadsRoyalties", () => {
  const originalEnv = process.env.API_ENDPOINT;
  beforeEach(() => {
    mockComponent.mockClear();
    process.env.API_ENDPOINT = "https://test.6529.io.test";
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEnv;
  });

  it("renders CommunityDownloadsComponent with royalties data", () => {
    render(
      <TitleProvider>
        <CommunityDownloadsRoyalties />
      </TitleProvider>
    );

    const calls = mockComponent.mock.calls;

    const match = calls.find(
      ([props]) =>
        props.title === "Royalties" &&
        props.url === "https://test.6529.io.test/api/royalties/uploads"
    );

    expect(match).toBeTruthy();
  });
});
