import React from "react";
import { render, screen } from "@testing-library/react";
import { DefaultWaveWinnersDrop } from "@/components/waves/winners/drops/DefaultWaveWinnerDrop";

jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: jest.fn(() => ({ id: "ext-drop" })),
}));

jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeader",
  () => ({
    WaveWinnersDropHeader: () => <div data-testid="header" />,
  })
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorPfp",
  () => () => <div data-testid="pfp" />
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderTotalVotes",
  () => () => <div data-testid="votes" />
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoters",
  () => () => <div data-testid="voters" />
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropOutcome",
  () => () => <div data-testid="outcome" />
);
jest.mock("@/components/waves/winners/drops/WaveWinnersDropContent", () => ({
  WaveWinnersDropContent: () => <div data-testid="content" />,
}));
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <div data-testid="actions" />
));
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => () => (
  <div data-testid="mobile-menu" />
));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (props: any) => <div>{props.children}</div>
);
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: () => ({
    isActive: false,
    setIsActive: jest.fn(),
    touchHandlers: {},
  }),
}));

describe("DefaultWaveWinnerDrop", () => {
  it("renders the winner identity section", () => {
    render(
      <DefaultWaveWinnersDrop
        winner={
          {
            place: 1,
            drop: {
              id: "drop-1",
              wave: { voting_credit_type: "REP" },
              context_profile_context: null,
              author: {},
            },
          } as any
        }
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity")).toBeInTheDocument();
  });
});
