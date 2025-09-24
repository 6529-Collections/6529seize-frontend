import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import CommunityDownloadsRememes from "@/components/community-downloads/CommunityDownloadsRememes";
import { TitleProvider } from "@/contexts/TitleContext";
import { render } from "@testing-library/react";

jest.mock("@/components/community-downloads/CommunityDownloadsComponent");

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<
  typeof CommunityDownloadsComponent
>;

describe("CommunityDownloadsRememes", () => {
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
        props.url === "https://api.test.6529.io/api/rememes_uploads"
    );

    expect(match).toBeTruthy();
  });
});
