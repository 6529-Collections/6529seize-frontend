import { render } from "@testing-library/react";
import CommunityDownloadsRememes from "@/components/community-downloads/CommunityDownloadsRememes";
import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock("@/components/community-downloads/CommunityDownloadsComponent");

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<
  typeof CommunityDownloadsComponent
>;

describe("CommunityDownloadsRememes", () => {
  const originalEnv = process.env.API_ENDPOINT;
  beforeEach(() => {
    mockComponent.mockClear();
    process.env.API_ENDPOINT = "https://test.6529.io.test";
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEnv;
  });

  it("renders CommunityDownloadsComponent with rememe data", () => {
    render(
      <TitleProvider>
        <CommunityDownloadsRememes />
      </TitleProvider>
    );

    const calls = mockComponent.mock.calls;

    const match = calls.find(
      ([props]) =>
        props.title === "Rememes" &&
        props.url === "https://test.6529.io.test/api/rememes_uploads"
    );

    expect(match).toBeTruthy();
  });
});
