import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import UserPageIdentityAddStatementsContactInput from "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsInput";
import { STATEMENT_META, STATEMENT_TYPE } from "@/helpers/Types";

describe("UserPageIdentityAddStatementsContactInput", () => {
  it("focuses input and calls onChange when typing", async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <UserPageIdentityAddStatementsContactInput
        activeType={STATEMENT_TYPE.EMAIL}
        value=""
        onChange={onChange}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute(
      "placeholder",
      STATEMENT_META[STATEMENT_TYPE.EMAIL].inputPlaceholder
    );
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.type(input, "abc");
    expect(onChange).toHaveBeenCalled();

    rerender(
      <UserPageIdentityAddStatementsContactInput
        activeType={STATEMENT_TYPE.DISCORD}
        value=""
        onChange={onChange}
      />
    );
    const newInput = screen.getByRole("textbox");
    expect(newInput).toHaveAttribute(
      "placeholder",
      STATEMENT_META[STATEMENT_TYPE.DISCORD].inputPlaceholder
    );
    await waitFor(() => expect(newInput).toHaveFocus());

    rerender(
      <UserPageIdentityAddStatementsContactInput
        activeType={STATEMENT_TYPE.MANIFOLD}
        value=""
        onChange={onChange}
      />
    );
    const manifoldInput = screen.getByRole("textbox");
    expect(manifoldInput).toHaveAttribute(
      "placeholder",
      STATEMENT_META[STATEMENT_TYPE.MANIFOLD].inputPlaceholder
    );

    rerender(
      <UserPageIdentityAddStatementsContactInput
        activeType={STATEMENT_TYPE.TRANSIENT}
        value=""
        onChange={onChange}
      />
    );
    const transientInput = screen.getByRole("textbox");
    expect(transientInput).toHaveAttribute(
      "placeholder",
      STATEMENT_META[STATEMENT_TYPE.TRANSIENT].inputPlaceholder
    );
  });
});
