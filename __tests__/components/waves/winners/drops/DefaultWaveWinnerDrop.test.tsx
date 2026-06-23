import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultWaveWinnersDrop } from "@/components/waves/winners/drops/DefaultWaveWinnerDrop";

const mockMobileMenuOpenClick = jest.fn();
const mockWaveWinnersDropContent = jest.fn(() => <div data-testid="content" />);

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
  () => (props: any) => (
    <div
      data-testid="voters"
      data-is-approval-wave={props.isApprovalWave ? "true" : undefined}
    />
  )
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropOutcome",
  () => () => <div data-testid="outcome" />
);
jest.mock("@/components/waves/winners/drops/WaveWinnersDropContent", () => ({
  WaveWinnersDropContent: (props: any) => mockWaveWinnersDropContent(props),
}));
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <div data-testid="actions" />
));
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => ({
  __esModule: true,
  default: (props: { onOpenChange: () => void }) => (
    <button
      type="button"
      data-testid="mobile-menu"
      onClick={() => {
        mockMobileMenuOpenClick();
        props.onOpenChange();
      }}
    >
      Open drop
    </button>
  ),
}));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (props: any) =>
    props.isOpen ? (
      <div data-testid="mobile-wrapper">{props.children}</div>
    ) : null
);
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isMemesWave: () => false,
    isQuorumWave: () => false,
  }),
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
    mockMobileMenuOpenClick.mockClear();
    mockWaveWinnersDropContent.mockClear();
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

  it("forwards content presentation to drop content", () => {
    render(
      <DefaultWaveWinnersDrop
        winner={winner}
        onDropClick={jest.fn()}
        contentPresentation="quorumCompact"
      />
    );

    expect(mockWaveWinnersDropContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("does not pass approval wave state to the lower voter row", () => {
    render(
      <DefaultWaveWinnersDrop
        winner={winner}
        onDropClick={jest.fn()}
        isApprovalWave={true}
      />
    );

    expect(screen.getByTestId("voters")).not.toHaveAttribute(
      "data-is-approval-wave"
    );
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

  it("lets the first portal menu tap run after a long press", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    const setIsActive = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
    useLongPressInteraction.mockReturnValue({
      isActive: true,
      setIsActive,
      touchHandlers: {},
    });

    const { container } = render(
      <DefaultWaveWinnersDrop winner={winner} onDropClick={onDropClick} />
    );

    const longPressOptions = useLongPressInteraction.mock.calls[0][0];
    longPressOptions.onInteractionStart();

    await user.click(screen.getByTestId("mobile-menu"));
    expect(mockMobileMenuOpenClick).toHaveBeenCalledTimes(1);
    expect(setIsActive).toHaveBeenCalledWith(false);
    expect(onDropClick).not.toHaveBeenCalled();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });
});
