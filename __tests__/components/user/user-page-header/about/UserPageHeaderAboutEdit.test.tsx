import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderAboutEdit from "@/components/user/user-page-header/about/UserPageHeaderAboutEdit";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

jest.mock("react-use", () => ({ useKeyPressEvent: jest.fn() }));

jest.mock("@tanstack/react-query", () => ({ useMutation: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn().mockResolvedValue({}),
}));
jest.mock("framer-motion", () => ({
  AnimatePresence: (props: any) => <div>{props.children}</div>,
}));
jest.mock(
  "@/components/user/user-page-header/about/UserPageHeaderAboutEditError",
  () => (props: any) => <div id="profile-about-error">{props.msg}</div>
);

let mutationError: Error | null = null;

(useMutation as jest.Mock).mockImplementation((opts) => {
  return {
    mutateAsync: async (val: string) => {
      if (mutationError) {
        opts.onError?.(mutationError);
        opts.onSettled?.();
        throw mutationError;
      }
      await opts.mutationFn(val);
      opts.onSuccess?.();
      opts.onSettled?.();
    },
  };
});

function AboutEditHarness({ onClose = jest.fn() }: { onClose?: () => void }) {
  const [value, setValue] = useState("old");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <UserPageHeaderAboutEdit
      profile={{ query: "alice" } as any}
      statement={{ statement_value: "old" } as any}
      onClose={onClose}
      value={value}
      onValueChange={setValue}
      errorMsg={errorMsg}
      onErrorMsgChange={setErrorMsg}
    />
  );
}

describe("UserPageHeaderAboutEdit", () => {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  } as any;
  const ctx = { onProfileStatementAdd: jest.fn() } as any;

  beforeEach(() => {
    mutationError = null;
  });

  it("enables save when value changes and submits", async () => {
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={ctx}>
          <AboutEditHarness />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    const input = screen.getByRole("textbox", { name: "About statement" });
    expect(input).toHaveAttribute("placeholder", "Write an About statement");
    await userEvent.clear(input);
    await userEvent.type(input, "new");
    expect(screen.getByText("3/500")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(auth.setToast).toHaveBeenCalledWith({
      message: "About statement added.",
      type: "success",
    });
  });

  it("associates the inline save error with the textarea", async () => {
    mutationError = new Error("backend unavailable");

    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={ctx}>
          <AboutEditHarness />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const input = screen.getByRole("textbox", { name: "About statement" });
    await userEvent.clear(input);
    await userEvent.type(input, "new");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("backend unavailable.")).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "aria-describedby",
      "profile-about-character-count profile-about-error"
    );
  });
});
