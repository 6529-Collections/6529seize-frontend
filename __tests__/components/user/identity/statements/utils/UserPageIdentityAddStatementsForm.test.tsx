import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import UserPageIdentityAddStatementsForm from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm";
import { STATEMENT_TYPE, STATEMENT_GROUP } from "@/helpers/Types";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({ useMutation: jest.fn() }));

const mutate = jest.fn();
(useMutation as jest.Mock).mockReturnValue({ mutate, isPending: false });

const auth = {
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
} as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider
      value={{ onProfileStatementAdd: jest.fn() }}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

describe("UserPageIdentityAddStatementsForm", () => {
  const profile: any = { query: "q" };

  beforeEach(() => {
    mutate.mockClear();
    auth.requestAuth.mockClear().mockResolvedValue({ success: true });
    (useMutation as jest.Mock).mockReturnValue({ mutate, isPending: false });
  });

  it("resets value when active type changes and submits", async () => {
    render(
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={STATEMENT_TYPE.DISCORD}
        group={STATEMENT_GROUP.CONTACT}
        onClose={jest.fn()}
      />,
      { wrapper }
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });

    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutate).toHaveBeenCalledWith(
      {
        statement_group: STATEMENT_GROUP.CONTACT,
        statement_type: STATEMENT_TYPE.DISCORD,
        statement_comment: null,
        statement_value: "abc",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("submits a custom NFT art link with its display name", async () => {
    render(
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={STATEMENT_TYPE.LINK}
        group={STATEMENT_GROUP.NFT_ACCOUNTS}
        onClose={jest.fn()}
      />,
      { wrapper }
    );

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "  AOTM  " },
    });
    const urlInput = screen.getByLabelText("Art link URL");
    fireEvent.change(urlInput, {
      target: { value: "https://https://example.art/artist" },
    });
    fireEvent.submit(urlInput.closest("form") as HTMLFormElement);

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutate).toHaveBeenCalledWith(
      {
        statement_group: STATEMENT_GROUP.NFT_ACCOUNTS,
        statement_type: STATEMENT_TYPE.LINK,
        statement_comment: "AOTM",
        statement_value: "https://example.art/artist",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("announces a spaces-only custom label before authentication", () => {
    render(
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={STATEMENT_TYPE.LINK}
        group={STATEMENT_GROUP.NFT_ACCOUNTS}
        onClose={jest.fn()}
      />,
      { wrapper }
    );

    const labelInput = screen.getByLabelText("Display name");
    fireEvent.change(labelInput, { target: { value: "   " } });
    const urlInput = screen.getByLabelText("Art link URL");
    fireEvent.change(urlInput, {
      target: { value: "https://example.art/artist" },
    });
    fireEvent.submit(urlInput.closest("form") as HTMLFormElement);

    expect(auth.requestAuth).not.toHaveBeenCalled();
    expect(labelInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a display name that is not only spaces."
    );
  });

  it("rejects an insecure built-in NFT link before authentication", () => {
    render(
      <UserPageIdentityAddStatementsForm
        profile={profile}
        activeType={STATEMENT_TYPE.NINFA}
        group={STATEMENT_GROUP.NFT_ACCOUNTS}
        onClose={jest.fn()}
      />,
      { wrapper }
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("pattern", "https://.*");
    fireEvent.change(input, { target: { value: "http://ninfa.io/artist" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(auth.requestAuth).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
