import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import { WavePodiumItem } from "@/components/waves/winners/podium/WavePodiumItem";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
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
const longIdentityLabel =
  "identitywithaverylongunbrokenlabelthatmustwrapsafely";

const renderWinner = (dropOverrides: any) => {
  render(
    <WavePodiumItem
      winner={{ drop: { ...drop, ...dropOverrides } } as any}
      position="first"
      onDropClick={jest.fn()}
    />
  );
};

it("renders placeholder when no winner", () => {
  render(<WavePodiumItem position="second" onDropClick={jest.fn()} />);
  expect(screen.getByTestId("placeholder")).toHaveAttribute(
    "data-position",
    "second"
  );
});

it.each([
  {
    name: "resolved profile identity",
    dropOverrides: {
      wave: {
        ...drop.wave,
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
      metadata: [
        {
          data_key: "identity",
          data_value: longIdentityLabel,
          resolved_profile: {
            handle: longIdentityLabel,
            primary_address: "0xabc",
            pfp: null,
          },
        },
      ],
    },
  },
  {
    name: "unresolved identity fallback",
    dropOverrides: {
      wave: {
        ...drop.wave,
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
      metadata: [
        {
          data_key: "identity",
          data_value: longIdentityLabel,
        },
      ],
    },
  },
  {
    name: "regular author",
    dropOverrides: {
      author: { handle: longIdentityLabel, pfp: "pfp.png" },
    },
  },
])(
  "keeps $name labels to one line within the podium card",
  ({ dropOverrides }) => {
    renderWinner(dropOverrides);

    expect(screen.getByText(longIdentityLabel)).toHaveClass(
      "tw-min-w-0",
      "tw-truncate"
    );
  }
);

it("calls onDropClick when clicked", () => {
  const onDropClick = jest.fn();
  render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={onDropClick}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Open 1st alice" }));
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

it("keeps the vote details trigger on one line with responsive height", () => {
  render(
    <WavePodiumItem
      winner={{ drop } as any}
      position="first"
      onDropClick={jest.fn()}
    />
  );

  const trigger = screen.getByRole("button", {
    name: "View voters and vote log for 1 voter",
  });

  expect(trigger).toHaveClass("tw-flex-nowrap", "tw-min-h-7", "sm:tw-min-h-8");
  expect(trigger.parentElement).toHaveClass(
    "tw-flex-col",
    "@[42rem]/podium:tw-flex-row"
  );
  expect(trigger.querySelector("span")).toHaveClass("tw-whitespace-nowrap");
  expect(trigger.querySelector("span")).not.toHaveClass("tw-truncate");
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

it.each(["{Enter}", " "])(
  "opens a winner with %s without nesting profile links",
  async (key) => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    render(
      <WavePodiumItem
        winner={{ drop } as any}
        position="first"
        onDropClick={onDropClick}
      />
    );
    const openButton = screen.getByRole("button", { name: "Open 1st alice" });
    await user.tab();
    expect(openButton).toHaveFocus();
    await user.keyboard(key);
    expect(onDropClick).toHaveBeenCalledTimes(1);
    expect(onDropClick).toHaveBeenCalledWith(drop);
    expect(openButton.querySelector("a, button")).toBeNull();
  }
);

it("keeps avatar and name profile links independent when the avatar is missing", () => {
  const onDropClick = jest.fn();
  render(
    <WavePodiumItem
      winner={
        { drop: { ...drop, author: { handle: "alice", pfp: null } } } as any
      }
      position="first"
      onDropClick={onDropClick}
    />
  );
  const links = screen.getAllByRole("link", { name: "alice" });
  expect(links).toHaveLength(2);
  for (const link of links) {
    fireEvent.click(link);
    expect(link).toHaveAttribute("href", "/alice");
  }
  expect(onDropClick).not.toHaveBeenCalled();
});

it("normalizes and encodes an address fallback in author profile links", () => {
  renderWinner({
    author: { handle: null, primary_address: "0xAbC DEF", pfp: null },
  });

  const links = screen.getAllByRole("link", { name: "0xAbC DEF" });
  expect(links).toHaveLength(2);
  for (const link of links) {
    expect(link).toHaveAttribute("href", "/0xabc%20def");
  }
});
