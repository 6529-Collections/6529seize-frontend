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
  mockConfiguration = undefined;
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.useRealTimers());

it("shows and focuses the missing approval threshold before sending a save, then saves the corrected number", async () => {
  render(<CompetitionDraftEditor wave={wave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Competition type" }), {
    target: { value: "APPROVE" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Competition name" }), {
    target: { value: "Approve test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  const threshold = screen.getByRole("textbox", { name: "Approval threshold" });
  expect(threshold).toHaveFocus();
  expect(threshold).toHaveAttribute("aria-invalid", "true");
  expect(
    screen.getByText("Enter an approval threshold greater than 0.")
  ).toBeVisible();
  expect(mockRequestAuth).not.toHaveBeenCalled();
  expect(createCompetition).not.toHaveBeenCalled();

  fireEvent.change(threshold, { target: { value: "50" } });
  expect(threshold).toHaveAttribute("aria-invalid", "false");
  expect(
    screen.queryByText("Enter an approval threshold greater than 0.")
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(createCompetition).toHaveBeenCalledTimes(1));
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
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(createCompetition).toHaveBeenCalledTimes(1));
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
    fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }));
  }
  const threshold = screen.getByRole("textbox", { name: "Approval threshold" });
  fireEvent.change(threshold, { target: { value: "" } });
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(updateCompetition).not.toHaveBeenCalled();
  expect(mockRequestAuth).not.toHaveBeenCalled();
  expect(threshold).toHaveAttribute("aria-invalid", "false");

  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
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
