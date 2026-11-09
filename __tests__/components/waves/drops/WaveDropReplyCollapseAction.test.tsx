import WaveDropReplyCollapseAction from "@/components/waves/drops/WaveDropReplyCollapseAction";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPost = jest.fn();
const mockApplyReplyPlacement = jest.fn();
const mockScrollToSerialNo = jest.fn();
const mockAuth = { connectedProfile: { id: "author" } };
const mockThreads = { waveId: "wave", collapseAll: false };

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (...args: unknown[]) => mockPost(...args),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActionsOptional: () => ({
    applyReplyPlacement: mockApplyReplyPlacement,
  }),
}));
jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => ({
    requestScrollToSerialNo: mockScrollToSerialNo,
  }),
}));
jest.mock(
  "@/components/waves/drops/reply-threads/WaveReplyThreadsContext",
  () => ({ useWaveReplyThreads: () => mockThreads })
);

const root = {
  id: "root",
  serial_no: 15,
  drop_type: ApiDropType.Chat,
  wave: { id: "wave" },
  author: { id: "author" },
  collapse_replies: false,
} as ApiDrop;

function renderAction(drop: ApiDrop) {
  const onSelected = jest.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WaveDropReplyCollapseAction drop={drop} onSelected={onSelected} />
    </QueryClientProvider>
  );
  return onSelected;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPost.mockReset();
  mockApplyReplyPlacement.mockReset().mockResolvedValue(false);
  mockAuth.connectedProfile.id = "author";
  mockThreads.collapseAll = false;
});

it.each([
  [false, "Collapse replies"],
  [true, "Show replies inline"],
] as const)(
  "requests the opposite of the saved state %s",
  async (collapsed, label) => {
    mockPost.mockResolvedValue({
      collapse_replies: !collapsed,
      reply_placement_has_replies: false,
    });
    const onSelected = renderAction({ ...root, collapse_replies: collapsed });
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(onSelected).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledWith({
      endpoint: "drops/root/collapse-replies",
      body: { collapse_replies: !collapsed },
    });
    expect(mockApplyReplyPlacement).toHaveBeenCalledWith({
      waveId: "wave",
      dropId: "root",
      collapseReplies: !collapsed,
      hasReplies: false,
    });
    expect(mockScrollToSerialNo).not.toHaveBeenCalled();
  }
);

it("returns to the message after a populated thread refreshes", async () => {
  mockPost.mockResolvedValue({
    collapse_replies: true,
    reply_placement_has_replies: true,
  });
  mockApplyReplyPlacement.mockResolvedValue(true);
  renderAction(root);
  fireEvent.click(screen.getByRole("button", { name: "Collapse replies" }));
  await waitFor(() =>
    expect(mockScrollToSerialNo).toHaveBeenCalledWith({
      waveId: "wave",
      serialNo: 15,
    })
  );
});

it("hides the option from a different author", () => {
  mockAuth.connectedProfile.id = "other-profile";
  renderAction(root);
  expect(screen.queryByRole("button")).toBeNull();
});

it("hides the option on replies", () => {
  renderAction({
    ...root,
    reply_to: { drop_id: "other-root", drop_part_id: 1, is_deleted: false },
  });
  expect(screen.queryByRole("button")).toBeNull();
});

it("hides the option while wave-wide collapse is on", () => {
  mockThreads.collapseAll = true;
  renderAction(root);
  expect(screen.queryByRole("button")).toBeNull();
});
