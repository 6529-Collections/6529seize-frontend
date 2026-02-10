import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ProfileProxyCreditEdit from "@/components/user/proxy/proxy/action/utils/credit/ProfileProxyCreditEdit";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
}));

test("submits updated credit", async () => {
  const mutateAsync = jest.fn().mockResolvedValue({});
  (useMutation as jest.Mock).mockImplementation((opts) => ({ mutateAsync }));

  const auth = {
    requestAuth: jest.fn(async () => ({ success: true })),
    setToast: jest.fn(),
  } as any;
  const ctx = { onProfileProxyModify: jest.fn() } as any;

  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={ctx}>
        <ProfileProxyCreditEdit
          profileProxy={{ id: "1", granted_to: { handle: "g" }, created_by: { handle: "c" } } as any}
          profileProxyAction={{ id: "2", credit_amount: 1 } as any}
          setViewMode={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  const input = screen.getByPlaceholderText("Credit Amount");
  await userEvent.clear(input);
  await userEvent.type(input, "5");
  await userEvent.click(screen.getByText("Update"));
  expect(mutateAsync).toHaveBeenCalledWith({ credit_amount: 5 });
});
