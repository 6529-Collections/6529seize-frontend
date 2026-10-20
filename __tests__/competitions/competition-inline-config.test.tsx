import CompetitionApprovalThresholds from "@/components/competitions/CompetitionApprovalThresholds";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompetitionOverview from "@/components/competitions/CompetitionOverview";
import CompetitionAppearance from "@/components/competitions/CompetitionAppearance";
import { commonApiFetch } from "@/services/api/common-api";
import {
  invalidateCompetition,
  updateCompetition,
} from "@/services/api/competitions-api";
import { WAVE_DISPLAY_METADATA_KEYS as keys } from "@/helpers/waves/wave-metadata.helpers";
import type { ReactNode } from "react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/locales";
import { loadLocaleMessages, t } from "@/i18n/messages";

let mockLocale: SupportedLocale = "en-US";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));

let mockLegacyPrimary: string | null = null;
const mockCompetition = {
  id: "competition",
  wave_id: "wave",
  title: "Current name",
  description: "Current description",
  type: "RANK",
  lifecycle: "PUBLISHED",
  computed_phase: "VOTING_OPEN",
  config_version: 4,
  permissions: { administer: true },
  decisions: {
    strategy: {},
    winning_min_threshold: 10,
    winning_threshold_min_duration_ms: 5000,
  },
  participation: {
    starts_at: 0 as number | null,
    ends_at: 100000 as number | null,
  },
  voting: { ends_at: 100000 as number | null },
  presentation: [
    { data_key: keys.customRules, data_value: "Current guidelines" },
    { data_key: keys.submissionButtonLabel, data_value: "Submit art" },
  ],
};
const config = {
  title: "Current name",
  description: "Current description",
  presentation: [...mockCompetition.presentation],
  participation: {
    scope: { group_id: "participants" },
    signature_required: true,
  },
  voting: { scope: { group_id: "voters" }, credit_type: "TDH" },
  rules: { type: "RANK", time_lock_ms: 60000 },
  outcomes: [{ description: "Prize" }],
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: mockCompetition,
    hub: { legacy_primary_competition_id: mockLegacyPrimary },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: async () => ({ success: true }) }),
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
  newCompetitionRequestKey: () => "request-key",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: { status?: number }) => error?.status,
}));
jest.mock("@/services/api/competitions-api", () => ({
  competitionEndpoint: () => "competitions/competition",
  updateCompetition: jest.fn(),
  invalidateCompetition: jest.fn(),
}));
jest.mock(
  "@/components/utils/animation/CommonAnimationHeight",
  () =>
    ({ children }: { children: ReactNode }) => <>{children}</>
);
function setup(component: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      {component}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockLegacyPrimary = null;
  mockLocale = "en-US";
  mockCompetition.participation.starts_at = 0;
  mockCompetition.participation.ends_at = 100000;
  mockCompetition.voting.ends_at = 100000;
  mockCompetition.permissions.administer = true;
  mockCompetition.config_version = 4;
  mockCompetition.type = "RANK";
  jest.mocked(commonApiFetch).mockResolvedValue(config);
  jest.mocked(updateCompetition).mockResolvedValue(mockCompetition as never);
  jest.mocked(invalidateCompetition).mockResolvedValue(undefined);
});
it.each([null, "competition"])(
  "edits name, description and guidelines using the same competition configuration for original primary %s",
  async (primary) => {
    mockLegacyPrimary = primary;
    setup(<CompetitionOverview />);
    fireEvent.click(
      screen.getByRole("button", { name: "Edit competition details" })
    );
    fireEvent.change(screen.getByLabelText("Competition name"), {
      target: { value: "New name" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New description" },
    });
    fireEvent.change(screen.getByLabelText("Guidelines"), {
      target: { value: "New guidelines" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(updateCompetition).toHaveBeenCalledWith(
        { waveId: "wave", competitionId: "competition" },
        {
          idempotency_key: "request-key",
          config_version: 4,
          config: {
            ...config,
            title: "New name",
            description: "New description",
            presentation: [
              config.presentation[1],
              { data_key: keys.customRules, data_value: "New guidelines" },
            ],
          },
        }
      )
    );
    await waitFor(() =>
      expect(
        screen.queryByLabelText("Competition name")
      ).not.toBeInTheDocument()
    );
  }
);
it("requires a non-blank title and cancels without saving", () => {
  setup(<CompetitionOverview />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit competition details" })
  );
  fireEvent.change(screen.getByLabelText("Competition name"), {
    target: { value: "   " },
  });
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(updateCompetition).not.toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Current name" })
  ).toBeInTheDocument();
});
it("keeps public overview readable and hides editing controls from members", () => {
  mockCompetition.permissions.administer = false;
  setup(
    <>
      <CompetitionOverview />
      <CompetitionAppearance />
    </>
  );
  expect(screen.getByText("Current guidelines")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("preserves an uncertain request and entered text for retry", async () => {
  jest.mocked(updateCompetition).mockRejectedValueOnce(new Error("Network"));
  setup(<CompetitionOverview />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit competition details" })
  );
  fireEvent.change(screen.getByLabelText("Competition name"), {
    target: { value: "New name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Competition name")).toHaveValue("New name");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(updateCompetition).toHaveBeenCalledTimes(2));
  expect(jest.mocked(updateCompetition).mock.calls[0]).toEqual(
    jest.mocked(updateCompetition).mock.calls[1]
  );
});
it("blocks stale saves until the inline editor is reopened", async () => {
  jest.mocked(updateCompetition).mockRejectedValueOnce({ status: 409 });
  setup(<CompetitionOverview />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit competition details" })
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  mockCompetition.config_version = 5;
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Edit competition details" })
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(updateCompetition).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ config_version: 5 })
    )
  );
});
it("edits appearance in its own section without changing guidelines, access, or rules", async () => {
  setup(<CompetitionAppearance />);
  fireEvent.click(
    screen.getByRole("button", { name: "Appearance and labels" })
  );
  fireEvent.change(screen.getByLabelText("Submission button label"), {
    target: { value: "Enter" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(updateCompetition).toHaveBeenCalled());
  const saved = jest.mocked(updateCompetition).mock.calls[0]![1].config;
  expect(saved).toMatchObject({ ...config, presentation: expect.any(Array) });
  expect(saved.presentation).toContainEqual({
    data_key: keys.customRules,
    data_value: "Current guidelines",
  });
  expect(saved.presentation).toContainEqual({
    data_key: keys.submissionButtonLabel,
    data_value: "Enter",
  });
});
it("uses the existing Approve label validation", () => {
  mockCompetition.type = "APPROVE";
  setup(<CompetitionAppearance />);
  fireEvent.click(
    screen.getByRole("button", { name: "Appearance and labels" })
  );
  const inputs = screen.getAllByRole("textbox");
  expect(inputs).toHaveLength(3);
  fireEvent.change(inputs[1]!, { target: { value: "Same" } });
  fireEvent.change(inputs[2]!, { target: { value: "Same" } });
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

it("saves custom Approve tab labels in the competition presentation", async () => {
  mockCompetition.type = "APPROVE";
  setup(<CompetitionAppearance />);
  fireEvent.click(
    screen.getByRole("button", { name: "Appearance and labels" })
  );
  fireEvent.change(screen.getByPlaceholderText("Proposals"), {
    target: { value: "Suggestions" },
  });
  fireEvent.change(screen.getByPlaceholderText("Approved"), {
    target: { value: "Accepted" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(updateCompetition).toHaveBeenCalled());
  const saved = jest.mocked(updateCompetition).mock.calls[0]![1].config;
  expect(saved.presentation).toEqual(
    expect.arrayContaining([
      { data_key: keys.approvalsTabLabel, data_value: "Suggestions" },
      { data_key: keys.approvedTabLabel, data_value: "Accepted" },
    ])
  );
});

it.each([null, "competition"])(
  "edits approval thresholds through the native config for primary %s",
  async (primary) => {
    mockLegacyPrimary = primary;
    mockCompetition.type = "APPROVE";
    setup(<CompetitionApprovalThresholds />);
    fireEvent.click(
      screen.getByRole("button", { name: "Edit approval thresholds" })
    );
    fireEvent.change(screen.getByLabelText("Winning threshold"), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText("Threshold hold (seconds)"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(updateCompetition).toHaveBeenCalledWith(
        { waveId: "wave", competitionId: "competition" },
        expect.objectContaining({
          config_version: 4,
          config: {
            ...config,
            rules: {
              ...config.rules,
              winning_threshold: 25,
              winning_threshold_min_duration_ms: 10000,
            },
          },
        })
      )
    );
  }
);
it("keeps approval thresholds invalid when fractional or longer than the approval window", async () => {
  setup(<CompetitionApprovalThresholds />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit approval thresholds" })
  );
  const save = screen.getByRole("button", { name: "Save changes" });
  fireEvent.change(screen.getByLabelText("Winning threshold"), {
    target: { value: "1.5" },
  });
  expect(save).toBeDisabled();
  expect(screen.getByLabelText("Winning threshold")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  expect(
    screen.getByLabelText("Winning threshold")
  ).toHaveAccessibleDescription("Enter a positive whole number.");
  fireEvent.change(screen.getByLabelText("Winning threshold"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("Threshold hold (seconds)"), {
    target: { value: "101" },
  });
  expect(save).toBeDisabled();
  expect(screen.getByLabelText("Winning threshold")).toHaveAttribute(
    "aria-invalid",
    "false"
  );
  expect(screen.getByLabelText("Threshold hold (seconds)")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  expect(
    screen.getByLabelText("Threshold hold (seconds)")
  ).toHaveAccessibleDescription(
    /The hold cannot exceed the competition’s approval window/
  );
  fireEvent.change(screen.getByLabelText("Threshold hold (seconds)"), {
    target: { value: "" },
  });
  expect(save).toBeEnabled();
  expect(screen.getByLabelText("Threshold hold (seconds)")).toHaveAttribute(
    "aria-invalid",
    "false"
  );
  fireEvent.click(save);
  await waitFor(() =>
    expect(updateCompetition).toHaveBeenCalledWith(
      { waveId: "wave", competitionId: "competition" },
      expect.objectContaining({
        config: expect.objectContaining({
          rules: expect.objectContaining({
            winning_threshold: 1,
            winning_threshold_min_duration_ms: 0,
          }),
        }),
      })
    )
  );
});

it.each(SUPPORTED_LOCALES)(
  "names the threshold controls and terms in supported locale %s",
  async (locale) => {
    await loadLocaleMessages(locale);
    mockLocale = locale;
    setup(<CompetitionApprovalThresholds />);
    fireEvent.click(
      screen.getByRole("button", {
        name: t(locale, "competitions.editThresholds"),
      })
    );
    for (const key of [
      "competitions.rulesLabel.threshold",
      "competitions.thresholdHoldSeconds",
      "competitions.terms",
    ] as const)
      expect(t(locale, key).trim()).not.toBe("");
    expect(
      screen.getByRole("textbox", {
        name: t(locale, "competitions.rulesLabel.threshold"),
      })
    ).toHaveAccessibleName(t(locale, "competitions.rulesLabel.threshold"));
    expect(
      screen.getByRole("textbox", {
        name: t(locale, "competitions.thresholdHoldSeconds"),
      })
    ).toHaveAccessibleName(t(locale, "competitions.thresholdHoldSeconds"));
  }
);

it("allows a safe whole-second hold when the approval window has no end", () => {
  mockCompetition.participation.ends_at = null;
  mockCompetition.voting.ends_at = null;
  setup(<CompetitionApprovalThresholds />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit approval thresholds" })
  );
  fireEvent.change(screen.getByLabelText("Threshold hold (seconds)"), {
    target: { value: "86400" },
  });
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
});
