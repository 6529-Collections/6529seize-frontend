import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import CompetitionDraftEditor from "@/components/competitions/CompetitionDraftEditor";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { competitionFormToDraft } from "@/helpers/competition-config.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import {
  createCompetition,
  updateCompetition,
  performCompetitionAction,
} from "@/services/api/competitions-api";

let mockConfiguration: ApiCompetitionDraftInput | undefined;
const mockRequestAuth = jest.fn().mockResolvedValue({ success: true });
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockConfiguration,
    isPending: false,
    isError: false,
  }),
  useQueryClient: () => ({}),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "admin" },
    requestAuth: mockRequestAuth,
  }),
}));
jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: () => ({ submit: jest.fn() }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "admin:self",
  useCompetitionResource: () => ({ isError: false }),
}));
jest.mock("@/components/waves/create-wave/hooks/useMemeCardCount", () => ({
  useMemeCardCount: () => ({}),
}));
jest.mock(
  "@/components/waves/create-wave/hooks/useWaveGroupValidation",
  () => ({ useWaveGroupValidation: () => ({}) })
);
jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroup",
  () => () => null
);
jest.mock(
  "@/components/waves/create-wave/overview/CreateWaveDisplaySettings",
  () => () => null
);
jest.mock(
  "@/components/waves/create-wave/overview/type/RankScheduleModeSelector",
  () => () => null
);
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () => () => null
);
jest.mock("@/components/waves/create-wave/CreateWaveStepContent", () => {
  const Threshold =
    require("@/components/waves/create-wave/voting/CreateWaveVotingThreshold").default;
  const { CreateWaveStep } = require("@/types/waves.types");
  const {
    CREATE_WAVE_VALIDATION_ERROR,
  } = require("@/helpers/waves/create-wave.validation");
  return {
    __esModule: true,
    default: ({
      controller,
    }: {
      controller: ReturnType<typeof useWaveConfig>;
    }) =>
      controller.step === CreateWaveStep.VOTING ? (
        <Threshold
          threshold={controller.config.approval.threshold}
          error={controller.errors.includes(
            CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED
          )}
          setThreshold={controller.onThresholdChange}
        />
      ) : null,
  };
});
jest.mock("@/services/api/competitions-api", () => ({
  competitionScope: () => ({}),
  competitionEndpoint: () => "competitions/draft",
  createCompetition: jest
    .fn()
    .mockResolvedValue({ id: "draft", config_version: 1 }),
  updateCompetition: jest
    .fn()
    .mockResolvedValue({ id: "draft", config_version: 2 }),
  invalidateCompetition: jest.fn().mockResolvedValue(undefined),
  performCompetitionAction: jest
    .fn()
    .mockResolvedValue({ id: "draft", config_version: 3 }),
}));

const wave = {
  id: "wave",
  visibility: { scope: { group: null } },
  chat: { scope: { group: null } },
  wave: { admin_group: { group: null } },
} as ApiWave;
const draft = {
  id: "draft",
  lifecycle: "DRAFT",
  config_version: 1,
} as ApiCompetition;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockConfiguration = undefined;
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.useRealTimers());

it("keeps an incomplete Approve draft locally and validates the threshold before the next step", async () => {
  jest.useFakeTimers();
  render(<CompetitionDraftEditor wave={wave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Competition type" }), {
    target: { value: "APPROVE" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Approve test" },
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(createCompetition).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "Save changes" })
  ).not.toBeInTheDocument();
  for (let step = 0; step < 5; step++)
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
  const threshold = screen.getByRole("textbox", { name: "Approval threshold" });
  expect(threshold).toHaveFocus();
  expect(threshold).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(threshold, { target: { value: "50" } });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(createCompetition).toHaveBeenCalledTimes(1);
  expect(createCompetition).toHaveBeenCalledWith(
    "wave",
    expect.objectContaining({
      config: expect.objectContaining({
        title: "Approve test",
        rules: expect.objectContaining({ winning_threshold: 50 }),
      }),
    })
  );
});

it("continues to save Rank drafts without an approval threshold", async () => {
  render(<CompetitionDraftEditor wave={wave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Rank test" },
  });
  await waitFor(() => expect(createCompetition).toHaveBeenCalledTimes(1), {
    timeout: 1500,
  });
  expect(createCompetition).toHaveBeenCalledWith(
    "wave",
    expect.objectContaining({
      config: expect.objectContaining({
        rules: expect.objectContaining({
          type: "RANK",
          winning_threshold: null,
        }),
      }),
    })
  );
});

it("does not autosave an empty threshold and resumes autosaving after it is corrected", async () => {
  const form = renderHook(() =>
    useWaveConfig({ initialWaveType: ApiWaveType.Approve })
  );
  mockConfiguration = competitionFormToDraft(
    {
      ...form.result.current.config,
      overview: {
        ...form.result.current.config.overview,
        name: "Existing draft",
      },
      approval: { ...form.result.current.config.approval, threshold: 50 },
    },
    ""
  );
  form.unmount();
  jest.useFakeTimers();
  render(
    <CompetitionDraftEditor
      wave={wave}
      competition={draft}
      onClose={jest.fn()}
    />
  );
  for (let step = 0; step < 4; step++) {
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
  }
  const threshold = screen.getByRole("textbox", { name: "Approval threshold" });
  fireEvent.change(threshold, { target: { value: "" } });
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(updateCompetition).not.toHaveBeenCalled();
  expect(mockRequestAuth).not.toHaveBeenCalled();
  expect(threshold).toHaveAttribute("aria-invalid", "false");

  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(threshold).toHaveAttribute("aria-invalid", "true");
  expect(updateCompetition).not.toHaveBeenCalled();
  fireEvent.change(threshold, { target: { value: "75" } });
  await act(async () => {
    jest.advanceTimersByTime(1500);
  });
  expect(updateCompetition).toHaveBeenCalledTimes(1);
  expect(updateCompetition).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "draft" },
    expect.objectContaining({
      config_version: 1,
      config: expect.objectContaining({
        rules: expect.objectContaining({ winning_threshold: 75 }),
      }),
    })
  );
});

it("flushes the latest edit when closing without publishing", async () => {
  const onClose = jest.fn();
  render(<CompetitionDraftEditor wave={wave} onClose={onClose} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Quick close" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
  await waitFor(() => expect(createCompetition).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(mockReplace).not.toHaveBeenCalled();
});

it("restores incomplete edits after closing and reopening", async () => {
  const onClose = jest.fn();
  const view = render(<CompetitionDraftEditor wave={wave} onClose={onClose} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Competition type" }), {
    target: { value: "APPROVE" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Incomplete Approve" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  view.unmount();
  render(<CompetitionDraftEditor wave={wave} onClose={onClose} />);
  expect(screen.getByRole("textbox", { name: "Competition name" })).toHaveValue(
    "Incomplete Approve"
  );
  expect(
    screen.getByRole("combobox", { name: "Competition type" })
  ).toHaveValue("APPROVE");
  expect(createCompetition).not.toHaveBeenCalled();
});

it("saves edits made during creation using the returned draft version before closing", async () => {
  jest.useFakeTimers();
  let completeCreate!: (value: ApiCompetition) => void;
  jest.mocked(createCompetition).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        completeCreate = resolve;
      })
  );
  const onClose = jest.fn();
  render(<CompetitionDraftEditor wave={wave} onClose={onClose} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "First name" },
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(createCompetition).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("textbox", { name: "Competition name" })
  ).toBeEnabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Latest name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
  await act(async () => {
    completeCreate({ id: "draft", config_version: 1 } as ApiCompetition);
  });
  expect(createCompetition).toHaveBeenCalledTimes(1);
  expect(updateCompetition).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "draft" },
    expect.objectContaining({
      config_version: 1,
      config: expect.objectContaining({ title: "Latest name" }),
    })
  );
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it("replays an uncertain create before saving newer edits after reopening", async () => {
  jest.useFakeTimers();
  jest
    .mocked(createCompetition)
    .mockRejectedValueOnce(new TypeError("Lost response"));
  const view = render(
    <CompetitionDraftEditor wave={wave} onClose={jest.fn()} />
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Original name" },
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(createCompetition).toHaveBeenCalledTimes(1);
  const originalRequest = jest.mocked(createCompetition).mock.calls[0];
  view.unmount();
  const onClose = jest.fn();
  render(<CompetitionDraftEditor wave={wave} onClose={onClose} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Recovered name" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
  });
  expect(createCompetition).toHaveBeenCalledTimes(2);
  expect(jest.mocked(createCompetition).mock.calls[1]).toEqual(originalRequest);
  expect(updateCompetition).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "draft" },
    expect.objectContaining({
      config_version: 1,
      config: expect.objectContaining({ title: "Recovered name" }),
    })
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("resolves a lost update response before reverting to the last saved values", async () => {
  jest.useFakeTimers();
  const view = render(
    <CompetitionDraftEditor wave={wave} onClose={jest.fn()} />
  );
  const name = screen.getByRole("textbox", { name: "Competition name" });
  fireEvent.change(name, { target: { value: "Saved name" } });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  mockConfiguration = jest.mocked(createCompetition).mock.calls[0]![1].config;
  jest
    .mocked(updateCompetition)
    .mockRejectedValueOnce(new TypeError("Lost response"));
  fireEvent.change(name, { target: { value: "Uncertain name" } });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  const uncertainRequest = jest.mocked(updateCompetition).mock.calls[0];
  fireEvent.change(name, { target: { value: "Saved name" } });
  view.unmount();
  const onClose = jest.fn();
  render(
    <CompetitionDraftEditor wave={wave} competition={draft} onClose={onClose} />
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
  });
  expect(updateCompetition).toHaveBeenCalledTimes(3);
  expect(jest.mocked(updateCompetition).mock.calls[1]).toEqual(
    uncertainRequest
  );
  expect(jest.mocked(updateCompetition).mock.calls[2]).toEqual([
    { waveId: "wave", competitionId: "draft" },
    expect.objectContaining({
      config_version: 2,
      config: expect.objectContaining({ title: "Saved name" }),
    }),
  ]);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("offers Previous, Close editor and Publish on review and publishes the saved version", async () => {
  const form = renderHook(() =>
    useWaveConfig({ initialWaveType: ApiWaveType.Rank })
  );
  mockConfiguration = competitionFormToDraft(
    {
      ...form.result.current.config,
      overview: {
        ...form.result.current.config.overview,
        name: "Publish test",
      },
      dates: { ...form.result.current.config.dates, ongoingRanking: true },
    },
    ""
  );
  form.unmount();
  render(
    <CompetitionDraftEditor
      wave={wave}
      competition={draft}
      onClose={jest.fn()}
    />
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
    target: { value: "Latest description" },
  });
  for (let step = 0; step < 6; step++)
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(
    screen.getAllByRole("button").map((button) => button.textContent)
  ).toEqual(["Previous", "Close editor", "Publish"]);
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  await waitFor(() =>
    expect(performCompetitionAction).toHaveBeenCalledWith(
      { waveId: "wave", competitionId: "draft" },
      "publish",
      expect.objectContaining({ config_version: 2 })
    )
  );
  expect(updateCompetition).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      config: expect.objectContaining({ description: "Latest description" }),
    })
  );
  expect(mockReplace).toHaveBeenCalledWith("/waves/wave/competitions/draft");
});

it.each([false, true])(
  "warns before leaving an unsaved draft only when local backup is unavailable: %s",
  (storageUnavailable) => {
    const storage = jest.spyOn(Storage.prototype, "setItem");
    if (storageUnavailable)
      storage.mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
    try {
      const view = render(
        <CompetitionDraftEditor wave={wave} onClose={jest.fn()} />
      );
      fireEvent.change(
        screen.getByRole("combobox", { name: "Competition type" }),
        { target: { value: "APPROVE" } }
      );
      fireEvent.change(
        screen.getByRole("textbox", { name: "Competition name" }),
        { target: { value: "Unfinished approve draft" } }
      );
      const leaving = new Event("beforeunload", { cancelable: true });
      globalThis.dispatchEvent(leaving);
      expect(leaving.defaultPrevented).toBe(storageUnavailable);
      view.unmount();
      const afterClosing = new Event("beforeunload", { cancelable: true });
      globalThis.dispatchEvent(afterClosing);
      expect(afterClosing.defaultPrevented).toBe(false);
    } finally {
      storage.mockRestore();
    }
  }
);
