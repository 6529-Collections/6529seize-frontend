import CheckActions, {
  moderationActionLabel,
} from "@/app/content-moderation/checks/CheckActions";
import { ApiModerationAction } from "@/generated/models/ApiModerationAction";
import { ApiModerationCheckDetailActionEffectEnum } from "@/generated/models/ApiModerationCheckDetail";
import { applyModerationAction } from "@/services/api/moderation-checks-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { checkFixture } from "./check.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/moderation-checks-api", () => ({
  applyModerationAction: jest.fn(),
}));

function setup() {
  const saved = jest.fn();
  const reload = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mounted = render(
    <QueryClientProvider client={client}>
      <CheckActions detail={checkFixture()} onSaved={saved} onReload={reload} />
    </QueryClientProvider>
  );
  return { saved, reload, ...mounted };
}

beforeEach(() => jest.clearAllMocks());

it("explains distinct allow scopes", () => {
  expect(
    moderationActionLabel("en-US", ApiModerationAction.Allow, checkFixture())
  ).toBe("Approve exact resubmission");
  expect(
    moderationActionLabel(
      "en-US",
      ApiModerationAction.Allow,
      checkFixture({
        action_effect:
          ApiModerationCheckDetailActionEffectEnum.GlobalCategoryRule,
      })
    )
  ).toBe("Allow future category use");
});

it("requires a reason and retries the same version and idempotency key after lost response", async () => {
  const user = userEvent.setup();
  const { saved } = setup();
  jest
    .mocked(applyModerationAction)
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(checkFixture());
  await user.selectOptions(
    screen.getByRole("combobox"),
    ApiModerationAction.Allow
  );
  expect(
    screen.getByRole("button", { name: "Confirm Approve exact resubmission" })
  ).toBeDisabled();
  await user.type(
    screen.getByRole("textbox"),
    "Reviewed the exact synthetic revision."
  );
  await user.click(
    screen.getByRole("button", { name: "Confirm Approve exact resubmission" })
  );
  await screen.findByRole("alert");
  expect(screen.getByRole("textbox")).toBeDisabled();
  await user.click(
    screen.getByRole("button", { name: "Confirm Approve exact resubmission" })
  );
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  const calls = jest.mocked(applyModerationAction).mock.calls;
  expect(calls[0]).toEqual(calls[1]);
  expect(calls[0]?.[1]).toEqual(
    expect.objectContaining({
      action: "ALLOW",
      expected_version: 4,
      reason: "Reviewed the exact synthetic revision.",
      idempotency_key: expect.any(String),
    })
  );
});

it("requires fresh review after a version conflict", async () => {
  const user = userEvent.setup();
  const { reload } = setup();
  jest.mocked(applyModerationAction).mockRejectedValue({ status: 409 });
  await user.selectOptions(
    screen.getByRole("combobox"),
    ApiModerationAction.Reevaluate
  );
  await user.type(screen.getByRole("textbox"), "Check updated evaluator.");
  await user.click(screen.getByRole("button", { name: "Confirm Re-evaluate" }));
  await screen.findByRole("alert");
  expect(
    screen.getByRole("button", { name: "Confirm Re-evaluate" })
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Load latest version" }));
  expect(reload).toHaveBeenCalledTimes(1);
});

it("does not restore review data after the private surface unmounts", async () => {
  const user = userEvent.setup();
  const { saved, unmount } = setup();
  let resolve!: (value: ReturnType<typeof checkFixture>) => void;
  jest.mocked(applyModerationAction).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  await user.selectOptions(
    screen.getByRole("combobox"),
    ApiModerationAction.Allow
  );
  await user.type(screen.getByRole("textbox"), "Reviewed.");
  await user.click(
    screen.getByRole("button", { name: "Confirm Approve exact resubmission" })
  );
  unmount();
  await act(async () => {
    resolve(checkFixture());
  });
  expect(saved).not.toHaveBeenCalled();
});
