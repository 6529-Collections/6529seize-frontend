import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import NotificationsContainer from "@/components/brain/notifications/NotificationsContainer";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropClientDeliveryState } from "@/helpers/waves/drop.helpers";
import {
  ActiveDropAction,
  type ActiveDropState,
} from "@/types/dropInteractionTypes";

type NotificationProps = {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (target: ActiveDropState | null) => void;
};

let mockIdentityKey: string;
let mockCanReply: boolean;
let mockReplyTarget: ActiveDropState;
const mockNotifications = jest.fn();

jest.mock("@/hooks/drops/useDropReplyAccess", () => ({
  useDropReplyAccess: (waveId: string) => ({
    identityKey: mockIdentityKey,
    canReply: Boolean(waveId) && mockCanReply,
  }),
}));
jest.mock("@/components/brain/notifications/index", () => ({
  __esModule: true,
  default: (props: NotificationProps) => {
    mockNotifications(props);
    return (
      <div
        data-testid="notifications"
        data-active-drop={props.activeDrop?.drop.id}
      >
        <button onClick={() => props.setActiveDrop(mockReplyTarget)}>
          Reply to notification
        </button>
      </div>
    );
  },
}));
jest.mock("@/components/brain/content/BrainContent", () => ({
  __esModule: true,
  default: ({
    activeDrop,
    onCancelReplyQuote,
    children,
  }: {
    readonly activeDrop: ActiveDropState | null;
    readonly onCancelReplyQuote: () => void;
    readonly children: ReactNode;
  }) => (
    <div data-testid="composer" data-active-drop={activeDrop?.drop.id}>
      {children}
      <button onClick={onCancelReplyQuote}>Cancel reply</button>
    </div>
  ),
}));

const drop = {
  id: "drop-1",
  wave: { id: "wave-1" },
} as ApiDrop;
const target: ActiveDropState = {
  action: ActiveDropAction.REPLY,
  drop,
  partId: 1,
};

function expectSelection(dropId?: string) {
  for (const testId of ["composer", "notifications"]) {
    const surface = screen.getByTestId(testId);
    if (dropId) expect(surface).toHaveAttribute("data-active-drop", dropId);
    else expect(surface).not.toHaveAttribute("data-active-drop");
  }
}

beforeEach(() => {
  mockIdentityKey = "own-profile-1";
  mockCanReply = true;
  mockReplyTarget = target;
  mockNotifications.mockClear();
});

it("selects an eligible notification reply for both the message and composer", () => {
  render(<NotificationsContainer />);
  expectSelection();
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection(drop.id);
  fireEvent.click(screen.getByRole("button", { name: "Cancel reply" }));
  expectSelection();
});

it("clears a selected notification after losing access and does not restore it", () => {
  const { rerender } = render(<NotificationsContainer />);
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection(drop.id);
  mockCanReply = false;
  rerender(<NotificationsContainer />);
  expectSelection();
  mockCanReply = true;
  rerender(<NotificationsContainer />);
  expectSelection();
});

it("rejects notification selection while reply access is unavailable", () => {
  mockCanReply = false;
  render(<NotificationsContainer />);
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection();
});

it("clears selection when changing direct profiles and ignores an old actor's setter", () => {
  const { rerender } = render(<NotificationsContainer />);
  const oldSetter = (
    mockNotifications.mock.calls.at(-1)?.[0] as NotificationProps
  ).setActiveDrop;
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  mockIdentityKey = "own-profile-2";
  rerender(<NotificationsContainer />);
  expectSelection();
  mockReplyTarget = { ...target, drop: { ...drop, id: "drop-2" } };
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection("drop-2");
  act(() => oldSetter(target));
  expectSelection("drop-2");
  act(() => oldSetter(null));
  expectSelection("drop-2");
});

it("can select a notification from another wave after an eligible reply", () => {
  render(<NotificationsContainer />);
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  mockReplyTarget = {
    ...target,
    drop: { ...drop, id: "drop-2", wave: { ...drop.wave, id: "wave-2" } },
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection("drop-2");
});

it.each([
  { ...drop, id: "temp-drop" },
  { ...drop, clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED },
])("rejects an unavailable notification target", (unavailableDrop) => {
  mockReplyTarget = { ...target, drop: unavailableDrop };
  render(<NotificationsContainer />);
  fireEvent.click(
    screen.getByRole("button", { name: "Reply to notification" })
  );
  expectSelection();
});
