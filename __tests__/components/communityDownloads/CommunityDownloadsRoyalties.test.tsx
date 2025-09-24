import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import CommunityDownloadsRoyalties from "@/components/community-downloads/CommunityDownloadsRoyalties";
import { TitleProvider } from "@/contexts/TitleContext";
import { render } from "@testing-library/react";

jest.mock("@/components/community-downloads/CommunityDownloadsComponent");

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<
  typeof CommunityDownloadsComponent
>;

describe("CommunityDownloadsRoyalties", () => {
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
        props.url === "https://api.test.6529.io/api/royalties/uploads"
    );

    expect(match).toBeTruthy();
  });
});
