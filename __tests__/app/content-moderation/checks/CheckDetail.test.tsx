import CheckDetail from "@/app/content-moderation/checks/CheckDetail";
import { ApiModerationCheckSubjectTypeEnum } from "@/generated/models/ApiModerationCheck";
import { ApiModerationCheckDetailActionEffectEnum } from "@/generated/models/ApiModerationCheckDetail";
import {
  fetchModerationCheck,
  fetchModerationReportCheck,
} from "@/services/api/moderation-checks-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { checkFixture } from "./check.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/moderation-checks-api", () => ({
  fetchModerationCheck: jest.fn(),
  fetchModerationReportCheck: jest.fn(),
}));

it("labels a profile action correctly and never displays expired evidence", async () => {
  jest.mocked(fetchModerationCheck).mockResolvedValue(
    checkFixture({
      action_effect: ApiModerationCheckDetailActionEffectEnum.ProfileStatus,
      evidence_expired: true,
      evidence: { text: "expired private evidence must not be displayed" },
      allowed_actions: [],
    })
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CheckDetail
        id="check-1"
        source="check"
        profileId="dev-1"
        onClose={jest.fn()}
      />
    </QueryClientProvider>
  );
  expect(
    await screen.findByRole("heading", { name: "Profile posting status" })
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/expired private evidence must not be displayed/)
  ).not.toBeInTheDocument();
});

it.each([false, true])(
  "provides the original published post link with deleted=%s",
  async (deleted) => {
    const detail = checkFixture({ allowed_actions: [] });
    detail.check.subject_type = ApiModerationCheckSubjectTypeEnum.Drop;
    detail.check.operation = "REPORT";
    detail.check.subject_id = "reported-drop";
    detail.check.published_subject_id = "reported-drop";
    detail.check.scope = { wave_id: "reported-wave" };
    detail.evidence = {
      text: "https://example.com/unrelated",
      wave_id: "wrong-wave",
      id: "wrong-drop",
    };
    detail.current_state = {
      ...detail.current_state,
      deleted,
      published: !deleted,
    };
    jest.mocked(fetchModerationReportCheck).mockResolvedValue(detail);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CheckDetail
          id="report-1"
          source="report"
          profileId="dev-1"
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    );
    expect(
      await screen.findByRole("link", { name: "Open original post" })
    ).toHaveAttribute("href", "/waves/reported-wave?drop=reported-drop");
    expect(fetchModerationReportCheck).toHaveBeenCalledWith(
      "report-1",
      expect.any(AbortSignal)
    );
    expect(screen.queryByText("Deleted") !== null).toBe(deleted);
    if (deleted)
      expect(
        screen.getByText(/The original post has been deleted/)
      ).toBeVisible();
  }
);
