import type { ContextType } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityHeaderCICRate from "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x1" }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
jest.mock("react-use", () => ({ createBreakpoint: () => () => "MD" }));

function setup({
  isTooltip = false,
  auth = {},
}: {
  readonly isTooltip?: boolean;
  readonly auth?: Partial<ContextType<typeof AuthContext>>;
} = {}) {
  const authValue = createMockAuthContext({
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    ...auth,
  });
  const onProfileCICModify = jest.fn();
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  const queryContext = { onProfileCICModify } as unknown as ContextType<
    typeof ReactQueryWrapperContext
  >;
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <ReactQueryWrapperContext.Provider value={queryContext}>
          <UserPageIdentityHeaderCICRate
            profile={{ query: "bob", handle: "bob" } as ApiIdentity}
            isTooltip={isTooltip}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  return { authValue, onProfileCICModify, onSuccess, onCancel };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useQuery).mockReturnValue({
    data: { cic_rating_by_rater: 0, cic_ratings_left_to_give_by_rater: 5 },
  } as ReturnType<typeof useQuery>);
  jest.mocked(commonApiPost).mockResolvedValue(undefined);
});

it.each([false, true])(
  "submits a negative total and reports success (tooltip: %s)",
  async (isTooltip) => {
    const user = userEvent.setup();
    const { authValue, onProfileCICModify, onSuccess } = setup({ isTooltip });
    const input = screen.getByRole("textbox", {
      name: /Your total NIC Rating of bob/,
    });
    expect(input).toHaveAccessibleDescription(
      /Your available NIC:.*Current NIC:.*Adjustment:/
    );
    await user.clear(input);
    await user.type(input, "-3");
    await user.click(screen.getByRole("button", { name: "Rate", exact: true }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "profiles/bob/cic/rating",
      body: { amount: -3 },
    });
    expect(onProfileCICModify).toHaveBeenCalled();
    expect(authValue.setToast).toHaveBeenCalledWith({
      message: "NIC rating updated.",
      type: "success",
    });
  }
);

it("shows the existing login message without submitting when auth fails", async () => {
  const user = userEvent.setup();
  const { authValue } = setup({
    auth: { requestAuth: jest.fn().mockResolvedValue({ success: false }) },
  });
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "1" } });
  await user.click(screen.getByRole("button", { name: "Rate", exact: true }));
  expect(authValue.setToast).toHaveBeenCalledWith({
    message: "Log in to continue.",
    type: "error",
  });
  expect(commonApiPost).not.toHaveBeenCalled();
});

it.each(["", "-", "0", "6", "-6"])(
  "disables submission for unchanged or invalid amount %s",
  (value) => {
    setup();
    fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    expect(
      screen.getByRole("button", { name: "Rate", exact: true })
    ).toBeDisabled();
  }
);

it("keeps failure details and the edited amount available for retry", async () => {
  const user = userEvent.setup();
  jest.mocked(commonApiPost).mockRejectedValue(new Error("Rating failed"));
  const { authValue, onSuccess } = setup();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  await user.click(screen.getByRole("button", { name: "Rate", exact: true }));
  await waitFor(() =>
    expect(authValue.setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Couldn't update this NIC rating.",
        description: "Please try again.",
        type: "error",
      })
    )
  );
  expect(onSuccess).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toHaveValue("2");
  expect(
    screen.getByRole("button", { name: "Rate", exact: true })
  ).toBeEnabled();
});

it("disables both actions during the request", async () => {
  const user = userEvent.setup();
  let finish: (() => void) | undefined;
  jest.mocked(commonApiPost).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const { onSuccess } = setup();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  await user.click(screen.getByRole("button", { name: "Rate", exact: true }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Rate", exact: true })
    ).toHaveAttribute("aria-busy", "true")
  );
  expect(
    screen.getByRole("button", { name: "Cancel", exact: true })
  ).toBeDisabled();
  finish?.();
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});

it("cancels without sending a rating", async () => {
  const user = userEvent.setup();
  const { onCancel } = setup();
  await user.click(screen.getByRole("button", { name: "Cancel", exact: true }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("blocks repeated submits while authentication is pending", async () => {
  let finishAuth: ((value: { success: boolean }) => void) | undefined;
  const requestAuth = jest.fn().mockImplementation(
    () =>
      new Promise<{ success: boolean }>((resolve) => {
        finishAuth = resolve;
      })
  );
  const { onSuccess } = setup({ auth: { requestAuth } });
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "2" } });
  const form = input.closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(requestAuth).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Rate", exact: true })
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Cancel", exact: true })
  ).toBeDisabled();
  expect(commonApiPost).not.toHaveBeenCalled();
  await act(async () => finishAuth?.({ success: true }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(commonApiPost).toHaveBeenCalledTimes(1);
});

it("allows retry after authentication rejects", async () => {
  const user = userEvent.setup();
  const requestAuth = jest
    .fn()
    .mockRejectedValueOnce(new Error("Authentication failed"))
    .mockResolvedValue({ success: true });
  const { authValue, onSuccess } = setup({ auth: { requestAuth } });
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  const submit = screen.getByRole("button", { name: "Rate", exact: true });
  await user.click(submit);
  await waitFor(() => expect(submit).toBeEnabled());
  expect(authValue.setToast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Couldn't update this NIC rating.",
      type: "error",
    })
  );
  expect(commonApiPost).not.toHaveBeenCalled();
  await user.click(submit);
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});
