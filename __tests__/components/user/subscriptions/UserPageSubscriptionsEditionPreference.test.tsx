import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAuth } from "@/__tests__/utils/testContexts";
import EditionPreference from "@/components/user/subscriptions/UserPageSubscriptionsEditionPreference";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const post = jest.mocked(commonApiPost);
const details = {
  consolidation_key: "test-key",
  last_update: 0,
  balance: 1,
  automatic: true,
  subscribe_all_editions: false,
  subscription_eligibility_count: 2,
};

function setup(readonly = false) {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const refresh = jest.fn();
  renderWithAuth(
    <EditionPreference
      profileKey="test-key"
      details={details}
      readonly={readonly}
      refresh={refresh}
    />,
    { requestAuth }
  );
  return { requestAuth, refresh, user: userEvent.setup() };
}

describe("Edition Preference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ subscribe_all_editions: true });
  });
  it("exposes the saved selection and eligibility without resubmitting it", async () => {
    const { requestAuth, user } = setup();
    expect(screen.getByText("Eligibility x2")).toBeVisible();
    expect(screen.getByRole("radio", { name: "One edition" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "One edition" }));
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
  it("uses keyboard arrow selection and the existing authenticated API", async () => {
    const { refresh, user } = setup();
    await user.click(screen.getByRole("radio", { name: "One edition" }));
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "All eligible" })).toBeChecked()
    );
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscribe-all-editions",
      body: { subscribe_all_editions: true },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("keeps the saved choice if authentication is rejected", async () => {
    const { requestAuth, user } = setup();
    requestAuth.mockResolvedValue({ success: false });
    await user.click(screen.getByRole("radio", { name: "All eligible" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "One edition" })).toBeChecked();
  });
  it("keeps visitors read-only", async () => {
    const { requestAuth, user } = setup(true);
    expect(screen.getByRole("radio", { name: "One edition" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "All eligible" }));
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
