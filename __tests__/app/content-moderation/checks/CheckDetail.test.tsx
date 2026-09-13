import CheckDetail from "@/app/content-moderation/checks/CheckDetail";
import { ApiModerationCheckDetailActionEffectEnum } from "@/generated/models/ApiModerationCheckDetail";
import { fetchModerationCheck } from "@/services/api/moderation-checks-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { checkFixture } from "./check.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/moderation-checks-api", () => ({
  fetchModerationCheck: jest.fn(),
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
