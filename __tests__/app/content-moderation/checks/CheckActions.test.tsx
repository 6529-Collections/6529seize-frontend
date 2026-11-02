import CheckActions from "@/app/content-moderation/checks/CheckActions";
import { ApiModerationAction } from "@/generated/models/ApiModerationAction";
import { ApiModerationCheckDetailActionEffectEnum } from "@/generated/models/ApiModerationCheckDetail";
import { applyModerationAction } from "@/services/api/moderation-checks-api";
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MODERATION_QUEUE_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "@/hooks/content-moderation/useContentModeratorAccess";
import { checkFixture } from "./check.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/moderation-checks-api", () => ({
  applyModerationAction: jest.fn(),
}));

function setup(detail = checkFixture()) {
  const saved = jest.fn();
  const reload = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mounted = render(
    <QueryClientProvider client={client}>
      <CheckActions detail={detail} onSaved={saved} onReload={reload} />
    </QueryClientProvider>
  );
  return { client, saved, reload, ...mounted };
}

beforeEach(() => jest.clearAllMocks());

it("explains distinct allow scopes", () => {
  const first = setup();
  expect(
    screen.getByRole("option", { name: "Approve exact resubmission" })
  ).toBeInTheDocument();
  first.unmount();
  setup(
    checkFixture({
      action_effect:
        ApiModerationCheckDetailActionEffectEnum.GlobalCategoryRule,
    })
  );
  expect(
    screen.getByRole("option", { name: "Allow future category use" })
  ).toBeInTheDocument();
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

it("resolves deleted reports with confirmation, required reason, and refreshes queue and badge", async () => {
  const user = userEvent.setup();
  const detail = checkFixture({
    allowed_actions: [
      ApiModerationAction.MarkReviewed,
      ApiModerationAction.ResolveDeletedReport,
    ],
  });
  detail.current_state = {
    ...detail.current_state,
    deleted: true,
    open_report_count: 1,
  };
  const updated = {
    ...detail,
    current_state: { ...detail.current_state, open_report_count: 0 },
  };
  const { client, saved } = setup(detail);
  const accessKey = [...CONTENT_MODERATOR_ACCESS_QUERY_KEY, "moderator-1"];
  const queueKey = [...MODERATION_QUEUE_QUERY_KEY, "OPEN", "moderator-1"];
  client.setQueryData(accessKey, {
    has_open_reports: true,
    open_report_count: 1,
  });
  client.setQueryData(queueKey, [{ id: "report-1" }]);
  const accessFetch = jest
    .fn()
    .mockResolvedValue({ has_open_reports: false, open_report_count: 0 });
  const queueFetch = jest.fn().mockResolvedValue([]);
  const accessObserver = new QueryObserver(client, {
    queryKey: accessKey,
    queryFn: accessFetch,
    staleTime: Infinity,
  });
  const queueObserver = new QueryObserver(client, {
    queryKey: queueKey,
    queryFn: queueFetch,
    staleTime: Infinity,
  });
  const stopAccess = accessObserver.subscribe(() => undefined);
  const stopQueue = queueObserver.subscribe(() => undefined);
  jest.mocked(applyModerationAction).mockResolvedValue(updated);
  expect(
    screen.getByText(/closes all its open reports with a reason/)
  ).toBeVisible();
  await user.selectOptions(
    screen.getByRole("combobox"),
    ApiModerationAction.MarkReviewed
  );
  expect(
    screen.getByText(/It does not resolve the post’s open reports/)
  ).toBeVisible();
  await user.selectOptions(
    screen.getByRole("combobox"),
    ApiModerationAction.ResolveDeletedReport
  );
  const confirm = screen.getByRole("button", {
    name: "Confirm Resolve reports — post deleted",
  });
  expect(confirm).toBeDisabled();
  expect(applyModerationAction).not.toHaveBeenCalled();
  await user.type(
    screen.getByRole("textbox"),
    "Confirmed original post was deleted."
  );
  await user.click(confirm);
  await waitFor(() => expect(saved).toHaveBeenCalledWith(updated));
  expect(applyModerationAction).toHaveBeenCalledWith("check-1", {
    action: "RESOLVE_DELETED_REPORT",
    reason: "Confirmed original post was deleted.",
    expected_version: 4,
    idempotency_key: expect.any(String),
  });
  await waitFor(() => {
    expect(client.getQueryData(accessKey)).toEqual({
      has_open_reports: false,
      open_report_count: 0,
    });
    expect(client.getQueryData(queueKey)).toEqual([]);
  });
  expect(accessFetch).toHaveBeenCalledTimes(1);
  expect(queueFetch).toHaveBeenCalledTimes(1);
  stopAccess();
  stopQueue();
  client.clear();
});
