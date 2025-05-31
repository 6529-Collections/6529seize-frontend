import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth, { useAuth } from "../../../components/auth/Auth";
import { ReactQueryWrapperContext } from "../../../components/react-query-wrapper/ReactQueryWrapper";

jest.mock("../../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x1",
    isConnected: true,
    seizeDisconnectAndLogout: jest.fn(),
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ data: [] })),
}));

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ id: "1", handle: "user", query: "user" })),
  commonApiPost: jest.fn(() => Promise.resolve({})),
}));

jest.mock("wagmi", () => ({
  useSignMessage: () => ({ signMessageAsync: jest.fn(), isPending: false }),
}));

jest.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ children }: any) => <div>{children}</div>,
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <h4>{children}</h4>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: jest.fn(),
  Slide: {},
}));

function Wrapper() {
  const { title, setTitle } = useAuth();
  return (
    <div>
      <span data-testid="title">{title}</span>
      <button onClick={() => setTitle({ title: "New" })}>set</button>
    </div>
  );
}

describe("Auth", () => {
  it("updates title via context", async () => {
    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
        <Auth>
          <Wrapper />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    
    // Wait for the component to render and check initial title
    const titleElement = await screen.findByTestId("title");
    expect(titleElement.textContent).toBe("6529");
    
    // Click the set button and wait for the title to update
    await userEvent.click(screen.getByText("set"));
    expect(await screen.findByTestId("title")).toHaveTextContent("New");
  });
});
