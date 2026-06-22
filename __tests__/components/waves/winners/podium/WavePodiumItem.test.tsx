import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WavePodiumItem } from "@/components/waves/winners/podium/WavePodiumItem";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => `scaled:${u}`,
  ImageScale: { W_AUTO_H_50: "x" },
}));
jest.mock(
  "@/components/waves/winners/podium/WavePodiumItemContentOutcomes",
  () => ({
    WavePodiumItemContentOutcomes: () => <div data-testid="outcomes" />,
  })
);
jest.mock(
  "@/components/waves/winners/podium/WaveWinnersPodiumPlaceholder",
  () => ({
    WaveWinnersPodiumPlaceholder: (props: any) => (
      <div data-testid="placeholder" data-position={props.position} />
    ),
  })
);
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useDropVoters", () => ({
  useDropVoters: () => ({
    voters: [],
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/useDropVoteLogs", () => ({
  useDropVoteLogs: () => ({
    logs: [],
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));

const drop: any = {
  id: "drop-1",
  author: { handle: "alice", pfp: "pfp.png" },
  rating: 5,
  raters_count: 1,
  wave: { voting_credit_type: "CIC" },
  parts: [],
  metadata: [],
};

it("renders placeholder when no winner", () => {
  render(<WavePodiumItem position="second" onDropClick={jest.fn()} />);
  expect(screen.getByTestId("placeholder")).toHaveAttribute(
    "data-position",
    "second"
  );
});

it("calls onDropClick when clicked", () => {
  const onDropClick = jest.fn();
  const { container } = render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={onDropClick}
    />
  );
  fireEvent.click(container.querySelector(".tw-cursor-pointer")!);
  expect(onDropClick).toHaveBeenCalledWith(drop);
});

it("keeps static voter text when vote details are explicitly disabled", () => {
  render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={jest.fn()}
      showVoteDetails={false}
    />
  );

  expect(
    screen.queryByRole("button", {
      name: "View voters and vote log for 1 voter",
    })
  ).not.toBeInTheDocument();
  expect(screen.getByText("voter")).toBeInTheDocument();
});

it("renders compact vote details trigger by default", () => {
  render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={jest.fn()}
    />
  );

  expect(
    screen.getByRole("button", {
      name: "View voters and vote log for 1 voter",
    })
  ).toHaveClass("tw-px-1.5", "tw-py-0.5", "tw-text-xs");
});

it("opens vote details without triggering the podium click", () => {
  const onDropClick = jest.fn();
  render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={onDropClick}
      showVoteDetails={true}
    />
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "View voters and vote log for 1 voter",
    })
  );

  expect(onDropClick).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog", { name: "Votes" })).toBeInTheDocument();
});
