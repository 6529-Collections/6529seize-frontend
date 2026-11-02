import { AuthContext, type AuthContextType } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Modal from "@/components/user/rep/modify-rep/UserPageRepModifyModal";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, useState, type ReactNode } from "react";

jest.mock("@/hooks/useRepAllocation");
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));

const allocation = jest.mocked(useRepAllocation);
const post = jest.mocked(commonApiPost);
const requestAuth = jest.fn();
const setToast = jest.fn();
const onProfileRepModify = jest.fn();
const onClose = jest.fn();
const retry = jest.fn();
const profile = { query: "alice", handle: "alice" } as ApiIdentity;
const connectedProfile = { handle: "rater" } as ApiIdentity;
const proxy = {
  created_by: { handle: "grantor" },
  actions: [
    { action_type: "ALLOCATE_REP", credit_amount: 100, credit_spent: 20 },
  ],
} as ApiProfileProxy;
let activeProfileProxy: AuthContextType["activeProfileProxy"] = null;

function Wrapper({ children }: { readonly children: ReactNode }) {
  const authDefaults = useContext(AuthContext);
  const queryDefaults = useContext(ReactQueryWrapperContext);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { mutations: { retry: false, gcTime: 0 } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{
          ...authDefaults,
          connectedProfile,
          activeProfileProxy,
          requestAuth,
          setToast,
        }}
      >
        <ReactQueryWrapperContext.Provider
          value={{ ...queryDefaults, onProfileRepModify }}
        >
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function renderModal() {
  return render(
    <Modal profile={profile} category="Artist" onClose={onClose} />,
    { wrapper: Wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  activeProfileProxy = null;
  requestAuth.mockResolvedValue({ success: true });
  post.mockResolvedValue(undefined);
  allocation.mockReturnValue({
    repState: {
      category: "Artist",
      rating: 50,
      contributor_count: 2,
      rater_contribution: 20,
    },
    heroAvailableRep: 80,
    proxyAvailableCredit: null,
    minMaxValues: { min: -100, max: 100 },
    isError: false,
    isFetching: false,
    retry,
  });
});

it("prefills the current contribution in a named dialog and labels the input", async () => {
  renderModal();
  expect(
    await screen.findByRole("dialog", { name: "Add Rep to alice" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: /Your total Rep for Artist\s*:/ })
  ).toHaveValue("20");
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

it.each(["Cancel", "Close"])(
  "closes through the shared dialog using %s",
  async (name) => {
    renderModal();
    await userEvent.click(await screen.findByRole("button", { name }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  }
);

it("closes on Escape", async () => {
  renderModal();
  await screen.findByRole("dialog");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it("keeps the form read-only and Save disabled until the allowance loads", async () => {
  const ready = allocation.getMockImplementation()!({
    profile,
    category: "Artist",
  });
  allocation.mockReturnValue({ ...ready, repState: null, isFetching: true });
  const { rerender } = renderModal();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Loading your Rep allowance"
  );
  const input = screen.getByRole("textbox");
  expect(input).toHaveValue("");
  expect(input).toHaveAttribute("readonly");
  fireEvent.submit(input.closest("form")!);
  expect(requestAuth).not.toHaveBeenCalled();
  allocation.mockReturnValue(ready);
  rerender(<Modal profile={profile} category="Artist" onClose={onClose} />);
  expect(input).toHaveValue("20");
  expect(input).not.toHaveAttribute("readonly");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("shows a retryable allowance error and blocks submission, even with cached data", async () => {
  allocation.mockReturnValue({
    ...allocation.getMockImplementation()!({ profile, category: "Artist" }),
    isError: true,
  });
  renderModal();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Couldn't load your Rep allowance."
  );
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
  expect(post).not.toHaveBeenCalled();
});

it("clamps non-proxy input on blur and blocks out-of-range form submission", async () => {
  renderModal();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "101" } });
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  fireEvent.submit(input.closest("form")!);
  expect(requestAuth).not.toHaveBeenCalled();
  fireEvent.blur(input);
  expect(input).toHaveValue("100");
  fireEvent.change(input, { target: { value: "-101" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("-100");
});

it("saves the desired total, shows the existing toast and refreshes profile data", async () => {
  renderModal();
  fireEvent.change(await screen.findByRole("textbox"), {
    target: { value: "30" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith({
      endpoint: "profiles/alice/rep/rating",
      body: { amount: 30, category: "Artist" },
    })
  );
  expect(setToast).toHaveBeenCalledWith({
    message: "Rep updated.",
    type: "success",
  });
  expect(onProfileRepModify).toHaveBeenCalledWith({
    targetProfile: profile,
    connectedProfile,
    profileProxy: null,
  });
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it("preserves proxy amounts and includes the proxy when refreshing", async () => {
  activeProfileProxy = proxy;
  renderModal();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "150" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("150");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(onProfileRepModify).toHaveBeenCalledWith({
      targetProfile: profile,
      connectedProfile,
      profileProxy: proxy,
    })
  );
});

it("keeps the dialog open and the draft intact after a save failure", async () => {
  post.mockRejectedValue(new Error("Request failed"));
  renderModal();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "30" } });
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't update this Rep rating.",
      })
    )
  );
  expect(input).toHaveValue("30");
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
});

it("does not submit if authentication is declined", async () => {
  requestAuth.mockResolvedValue({ success: false });
  renderModal();
  fireEvent.change(await screen.findByRole("textbox"), {
    target: { value: "30" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(post).not.toHaveBeenCalled();
  expect(setToast).toHaveBeenCalledWith({
    message: "Log in to continue.",
    type: "error",
  });
});

it("preserves the draft and allows retry when authentication rejects", async () => {
  requestAuth.mockRejectedValueOnce(new Error("Authentication unavailable"));
  renderModal();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "30" } });
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(post).not.toHaveBeenCalled();
  expect(setToast).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "error",
      title: "Couldn't update this Rep rating.",
    })
  );
  expect(input).toHaveValue("30");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
});

it("does not overwrite an edited amount when the allowance refreshes", async () => {
  const { rerender } = renderModal();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "30" } });
  const state = allocation.getMockImplementation()!({
    profile,
    category: "Artist",
  });
  allocation.mockReturnValue({
    ...state,
    repState: { ...state.repState!, rater_contribution: 25 },
  });
  rerender(<Modal profile={profile} category="Artist" onClose={onClose} />);
  expect(input).toHaveValue("30");
});
