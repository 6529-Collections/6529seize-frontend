import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveChatReplies from "@/components/waves/specs/WaveChatReplies";
import { useWaveSettingUpdater } from "@/components/waves/specs/useWaveSettingUpdater";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/components/waves/specs/useWaveSettingUpdater", () => ({
  useWaveSettingUpdater: jest.fn(),
}));

const useWaveSettingUpdaterMock = useWaveSettingUpdater as jest.Mock;

const makeWave = (replies?: ApiWave["chat"]["replies"] | undefined): ApiWave =>
  ({
    chat: {
      enabled: true,
      scope: { group: null },
      links_disabled: false,
      ...(replies ? { replies } : {}),
    },
  }) as ApiWave;

describe("WaveChatReplies", () => {
  let saveChatUpdate: jest.Mock;

  beforeEach(() => {
    saveChatUpdate = jest.fn();
    useWaveSettingUpdaterMock.mockReturnValue({
      canEdit: true,
      mutating: false,
      saveChatUpdate,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows who can reply and where replies appear", () => {
    render(
      <WaveChatReplies
        wave={makeWave({
          open: true,
          collapsed: true,
          authenticated_user_eligible: true,
          authenticated_user_can_delete: false,
        })}
      />
    );

    expect(screen.getByText("Replies")).toBeInTheDocument();
    expect(screen.getByText("Everyone · Collapsed")).toBeInTheDocument();
  });

  it("treats waves without reply settings as members-only and inline", () => {
    render(<WaveChatReplies wave={makeWave()} />);

    expect(screen.getByText("Chat members · Inline")).toBeInTheDocument();
  });

  it("saves both reply settings through the chat update", async () => {
    const user = userEvent.setup();
    render(<WaveChatReplies wave={makeWave()} />);

    await user.click(screen.getByRole("button", { name: "Edit replies" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Anyone who can see this wave can reply",
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Collapse replies under each drop",
      })
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveChatUpdate).toHaveBeenCalledTimes(1);
    const getChatUpdate = saveChatUpdate.mock.calls[0][1] as (
      chat: ApiUpdateWaveRequest["chat"]
    ) => ApiUpdateWaveRequest["chat"];
    expect(
      getChatUpdate({
        scope: { group_id: "dev-team" },
        enabled: true,
        links_disabled: true,
      })
    ).toEqual({
      scope: { group_id: "dev-team" },
      enabled: true,
      links_disabled: true,
      replies: { open: true, collapsed: true },
    });
  });

  it("hides the edit control from viewers who cannot edit the wave", () => {
    useWaveSettingUpdaterMock.mockReturnValue({
      canEdit: false,
      mutating: false,
      saveChatUpdate,
    });
    render(<WaveChatReplies wave={makeWave()} />);

    expect(
      screen.queryByRole("button", { name: "Edit replies" })
    ).not.toBeInTheDocument();
  });
});
