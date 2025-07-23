import { render } from "@testing-library/react";
import CommunityDownloadsTDH, {
  VIEW,
} from "@/components/community-downloads/CommunityDownloadsTDH";
import CommunityDownloadsComponent from "@/components/community-downloads/CommunityDownloadsComponent";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock(
  "@/components/community-downloads/CommunityDownloadsComponent",
  () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="mock" />),
  })
);

const ComponentMock = CommunityDownloadsComponent as jest.Mock;

describe("CommunityDownloadsTDH", () => {
  beforeEach(() => {
    ComponentMock.mockClear();
    process.env.API_ENDPOINT = "https://api.test";
  });

  it("uses consolidated uploads for CONSOLIDATION view", () => {
    render(
      <TitleProvider>
        <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
      </TitleProvider>
    );
    const calls = ComponentMock.mock.calls;
    const match = calls.find(
      ([props]) =>
        props.url === "https://api.test/api/consolidated_uploads" &&
        props.title === "Consolidated Network Metrics"
    );
    expect(match).toBeTruthy();
  });

  it("uses uploads for WALLET view", () => {
    render(
      <TitleProvider>
        <CommunityDownloadsTDH view={VIEW.WALLET} />
      </TitleProvider>
    );
    const props = ComponentMock.mock.calls[0][0];
    expect(props).toEqual(
      expect.objectContaining({
        url: "https://api.test/api/uploads",
        title: "Network Metrics",
      })
    );
  });
});
