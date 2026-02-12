import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MyStreamWaveLeaderboard from "@/components/brain/my-stream/MyStreamWaveLeaderboard";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";

const useWave = jest.fn();
const useLayout = jest.fn();
const useLocalPreference = jest.fn();
const useWaveCurationGroups = jest.fn();
const replace = jest.fn();
let searchParamsString = "";
let dropsProps: any;

jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: (...args: any[]) => useLayout(...args),
}));
jest.mock(
  "@/hooks/useLocalPreference",
  () =>
    (...args: any[]) =>
      useLocalPreference(...args)
);
jest.mock("@/hooks/waves/useWaveCurationGroups", () => ({
  useWaveCurationGroups: (...args: any[]) => useWaveCurationGroups(...args),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/waves",
  useSearchParams: () => ({
    get: (key: string) => new URLSearchParams(searchParamsString).get(key),
    toString: () => searchParamsString,
  }),
}));

jest.mock("@/components/waves/leaderboard/WaveLeaderboardTime", () => ({
  WaveLeaderboardTime: () => <div data-testid="time" />,
}));
let headerProps: any;
jest.mock(
  "@/components/waves/leaderboard/header/WaveleaderboardHeader",
  () => ({
    WaveLeaderboardHeader: (props: any) => {
      headerProps = props;
      return (
        <button data-testid="header" onClick={() => props.onCreateDrop()} />
      );
    },
  })
);
jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => (
    <div data-testid="create-drop" onClick={props.onCancel} />
  ),
}));
jest.mock("@/components/waves/leaderboard/drops/WaveLeaderboardDrops", () => ({
  WaveLeaderboardDrops: (props: any) => {
    dropsProps = props;
    return <div data-testid="drops" onClick={() => props.onCreateDrop()} />;
  },
}));
jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery",
  () => ({ WaveLeaderboardGallery: () => <div data-testid="gallery" /> })
);
jest.mock("@/components/waves/leaderboard/grid/WaveLeaderboardGrid", () => ({
  WaveLeaderboardGrid: (props: any) => (
    <div data-testid="grid" data-mode={props.mode} />
  ),
}));
jest.mock(
  "@/components/waves/memes/MemesArtSubmissionModal",
  () => (props: any) => (props.isOpen ? <div data-testid="memes" /> : null)
);

const wave = {
  id: "1",
  participation: {},
  wave: { type: "RANK" },
} as ApiWave;

describe("MyStreamWaveLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParamsString = "";
    dropsProps = null;
    useLayout.mockReturnValue({ leaderboardViewStyle: {} });
    useWaveCurationGroups.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockImplementation((_: any, def: any) => [
      def,
      jest.fn(),
    ]);
  });

  it("uses list view for non memes wave and can open drop create", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({ isMemesWave: false });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]); // view mode
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]); // sort
    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.viewMode).toBe("list");
    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("create-drop")).toBeInTheDocument();
  });

  it("uses grid view for memes wave and opens meme modal", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({ isMemesWave: true });
    useLocalPreference.mockReturnValueOnce(["grid", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);
    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.viewMode).toBe("grid");
    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("memes")).toBeInTheDocument();
  });

  it("renders non-meme content-only grid mode", () => {
    useWave.mockReturnValue({ isMemesWave: false });
    useLocalPreference.mockReturnValueOnce(["grid_content_only", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);
    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.viewMode).toBe("grid_content_only");
    expect(screen.getByTestId("grid")).toHaveAttribute(
      "data-mode",
      "content_only"
    );
  });

  it("reads curation filter from URL and passes it to leaderboard data views", () => {
    searchParamsString = "curated_by_group=group-1";
    useWave.mockReturnValue({ isMemesWave: false });
    useWaveCurationGroups.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.curatedByGroupId).toBe("group-1");
    expect(dropsProps.curatedByGroupId).toBe("group-1");
  });

  it("updates URL when curation filter changes", () => {
    useWave.mockReturnValue({ isMemesWave: false });
    useWaveCurationGroups.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    headerProps.onCurationGroupChange("group-1");
    expect(replace).toHaveBeenCalledWith("/waves?curated_by_group=group-1", {
      scroll: false,
    });

    headerProps.onCurationGroupChange(null);
    expect(replace).toHaveBeenCalledWith("/waves", { scroll: false });
  });
});
