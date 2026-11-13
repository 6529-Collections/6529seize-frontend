import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleWaveDropLogs } from "@/components/waves/drop/SingleWaveDropLogs";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { useAuth } from "@/components/auth/Auth";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

jest.mock("@/hooks/useWaveActivityLogs");
jest.mock("@/hooks/useDropVoteLogs");
jest.mock("@/components/auth/Auth");
jest.mock("@/hooks/useIntersectionObserver");
jest.mock("@/components/waves/drop/SingleWaveDropLog", () => ({
  SingleWaveDropLog: (p: any) => <div data-testid="log">{p.log.id}</div>,
}));

const useWaveActivityLogsMock = useWaveActivityLogs as jest.Mock;
(useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });
(useIntersectionObserver as jest.Mock).mockReturnValue({ current: null });

const drop = { id: "d1", wave: { id: "w", voting_credit_type: 0 } } as any;

beforeEach(() => {
  jest
    .mocked(useDropVoteLogs)
    .mockReturnValue({ logs: [], isError: false } as unknown as ReturnType<
      typeof useDropVoteLogs
    >);
});

test("toggles logs display", async () => {
  const user = userEvent.setup();
  useWaveActivityLogsMock.mockReturnValue({
    logs: [{ id: "1" }],
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
  });
  render(<SingleWaveDropLogs drop={drop} />);
  expect(useWaveActivityLogsMock).toHaveBeenLastCalledWith(
    expect.objectContaining({ enabled: false })
  );
  expect(screen.queryByTestId("log")).toBeNull();
  await user.click(screen.getByRole("button"));
  expect(useWaveActivityLogsMock).toHaveBeenLastCalledWith(
    expect.objectContaining({ enabled: true })
  );
  expect(screen.getByTestId("log")).toBeInTheDocument();
});

test("uses native Decision history when its panel opens", async () => {
  useWaveActivityLogsMock.mockReturnValue({ logs: [], isLoading: false });
  jest
    .mocked(useDropVoteLogs)
    .mockReturnValue({
      logs: [{ id: "native-change" }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDropVoteLogs>);
  render(<SingleWaveDropLogs drop={{ ...drop, competition_id: "decision" }} />);
  expect(useDropVoteLogs).toHaveBeenLastCalledWith({
    dropId: "d1",
    enabled: false,
  });
  await userEvent.click(screen.getByRole("button", { name: "Activity log" }));
  expect(useDropVoteLogs).toHaveBeenLastCalledWith({
    dropId: "d1",
    enabled: true,
  });
  expect(useWaveActivityLogsMock).toHaveBeenLastCalledWith(
    expect.objectContaining({ enabled: false })
  );
  expect(screen.getByTestId("log")).toHaveTextContent("native-change");
});

test("shows retry instead of no-vote guidance when Decision history fails", async () => {
  const refetch = jest.fn();
  useWaveActivityLogsMock.mockReturnValue({ logs: [], isLoading: false });
  jest
    .mocked(useDropVoteLogs)
    .mockReturnValue({
      logs: [],
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDropVoteLogs>);
  render(<SingleWaveDropLogs drop={{ ...drop, competition_id: "decision" }} />);
  await userEvent.click(screen.getByRole("button", { name: "Activity log" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Could not load vote log."
  );
  expect(
    screen.queryByText("Be the First to Make a Vote")
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
