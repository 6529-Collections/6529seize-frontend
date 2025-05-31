import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import UserPageIdentityAddStatementsContactInput from "../../../../../../components/user/identity/statements/utils/UserPageIdentityAddStatementsInput";
import { STATEMENT_META, STATEMENT_TYPE } from "../../../../../../helpers/Types";

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
    expect(input).toHaveAttribute("placeholder", STATEMENT_META[STATEMENT_TYPE.EMAIL].inputPlaceholder);
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
    expect(newInput).toHaveAttribute("placeholder", STATEMENT_META[STATEMENT_TYPE.DISCORD].inputPlaceholder);
    await waitFor(() => expect(newInput).toHaveFocus());
  });
});
