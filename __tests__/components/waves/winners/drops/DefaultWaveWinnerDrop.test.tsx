import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  default: jest.fn(),
}));
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useDeviceInfo = require("@/hooks/useDeviceInfo").default as jest.Mock;
const useLongPressInteraction = require("@/hooks/useLongPressInteraction")
  .default as jest.Mock;

const winner = {
  place: 1,
  drop: {
    id: "drop-1",
    wave: { voting_credit_type: "REP" },
    context_profile_context: null,
    author: {},
  },
} as any;

describe("DefaultWaveWinnerDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
    useLongPressInteraction.mockReturnValue({
      isActive: false,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
  });

  it("renders the winner identity section", () => {
    render(<DefaultWaveWinnersDrop winner={winner} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("identity")).toBeInTheDocument();
  });

  it("keeps native tap behavior for touch long-press handlers", () => {
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });

    render(<DefaultWaveWinnersDrop winner={winner} onDropClick={jest.fn()} />);

    expect(useLongPressInteraction).toHaveBeenCalledWith({
      hasTouchScreen: true,
      onInteractionStart: expect.any(Function),
      preventDefault: false,
    });
  });

  it("suppresses the click that follows a long press", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });

    const { container } = render(
      <DefaultWaveWinnersDrop winner={winner} onDropClick={onDropClick} />
    );

    const longPressOptions = useLongPressInteraction.mock.calls[0][0];
    longPressOptions.onInteractionStart();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).not.toHaveBeenCalled();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });
});
