import { render, screen } from "@testing-library/react";
import { useEffect, useState, type ReactNode } from "react";
import WaveRouteShell from "@/components/waves/WaveRouteShell";
import { canNavigateInWaveTabShell } from "@/helpers/waves/wave-tab-shell";
import { MyStreamWaveTab } from "@/types/waves.types";

let mockPathname = "/waves/wave/competitions/alpha";
let mockViewer: string | null = "profile-a:self";
let mockTab = MyStreamWaveTab.LEADERBOARD;
const mockRegister = jest.fn();
const mockMount = jest.fn();
const mockCleanup = jest.fn();
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => (props: { competitionId?: string }) => (
    <span>{props.competitionId ?? "collection"}</span>
  ),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
}));
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ activeContentTab: mockTab }),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ registerWave: mockRegister }),
}));
jest.mock("@/components/brain/my-stream/MyStreamWave", () => ({
  __esModule: true,
  default: function Wave({
    competitionContent,
  }: {
    competitionContent?: ReactNode;
  }) {
    const [identity] = useState(() => Symbol());
    useEffect(() => {
      mockMount(identity);
      return () => mockCleanup(identity);
    }, [identity]);
    return <div data-testid="wave">{competitionContent ?? "chat"}</div>;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockViewer = "profile-a:self";
  mockTab = MyStreamWaveTab.LEADERBOARD;
  mockPathname = "/waves/wave/competitions/alpha";
});

it("owns both paths, back/forward presentation, and registration until it unmounts", () => {
  const from = new URL(
    "https://6529.io/waves/wave/competitions/alpha?tab=leaderboard"
  );
  const to = new URL("https://6529.io/waves/wave?tab=chat&competition=alpha");
  const { rerender, unmount } = render(<WaveRouteShell waveId="wave" />);
  expect(screen.getByTestId("wave")).toHaveTextContent("alpha");
  expect(canNavigateInWaveTabShell(from, to)).toBe(true);
  mockPathname = to.pathname;
  mockTab = MyStreamWaveTab.CHAT;
  rerender(<WaveRouteShell waveId="wave" />);
  expect(screen.getByTestId("wave")).toHaveTextContent("chat");
  expect(mockRegister).toHaveBeenCalledWith("wave", true);
  mockPathname = from.pathname;
  mockTab = MyStreamWaveTab.LEADERBOARD;
  rerender(<WaveRouteShell waveId="wave" />);
  expect(screen.getByTestId("wave")).toHaveTextContent("alpha");
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(mockCleanup).not.toHaveBeenCalled();
  unmount();
  expect(canNavigateInWaveTabShell(from, to)).toBe(false);
  expect(mockCleanup).toHaveBeenCalledTimes(1);
});

it.each(["profile-b:self", "profile-a:proxy", null])(
  "releases mounted state when the viewer changes to %s",
  (viewer) => {
    const { rerender } = render(<WaveRouteShell waveId="wave" />);
    mockViewer = viewer;
    rerender(<WaveRouteShell waveId="wave" />);
    expect(mockMount).toHaveBeenCalledTimes(2);
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  }
);

it("registers current-viewer Chat again after a profile/proxy change", () => {
  mockPathname = "/waves/wave";
  mockTab = MyStreamWaveTab.CHAT;
  const { rerender } = render(<WaveRouteShell waveId="wave" />);
  expect(mockRegister).toHaveBeenCalledWith("wave", true);
  mockRegister.mockClear();
  mockViewer = "profile-a:new-proxy";
  rerender(<WaveRouteShell waveId="wave" />);
  expect(mockRegister).toHaveBeenCalledTimes(1);
  expect(mockRegister).toHaveBeenCalledWith("wave", true);
});
