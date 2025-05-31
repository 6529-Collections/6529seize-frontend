import { render, screen, fireEvent } from "@testing-library/react";
import UserPageProxy, { ProxyMode } from "../../../../components/user/proxy/UserPageProxy";
import { useRouter } from "next/router";
import { AuthContext } from "../../../../components/auth/Auth";

jest.mock("../../../../components/user/proxy/list/ProxyList", () => (props: any) => (
  <div data-testid="list">
    <button onClick={() => props.onModeChange(ProxyMode.CREATE)}>create</button>
    <span data-testid="isself">{String(props.isSelf)}</span>
  </div>
));

jest.mock("../../../../components/user/proxy/create/ProxyCreate", () => (props: any) => (
  <div data-testid="create">
    <button onClick={() => props.onModeChange(ProxyMode.LIST)}>list</button>
  </div>
));

jest.mock("../../../../hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: { id: "1", handle: "alice", query: "alice" } }),
}));

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn(() => ({ data: [], isFetching: false })) }));

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
const useRouterMock = useRouter as jest.Mock;
useRouterMock.mockReturnValue({ query: { user: "alice" } });

const auth = { connectedProfile: { id: "1" }, activeProfileProxy: null } as any;

describe("UserPageProxy", () => {
  it("switches modes", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageProxy profile={{ id: "1", handle: "alice" } as any} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("isself").textContent).toBe("true");
    fireEvent.click(screen.getByText("create"));
    expect(screen.getByTestId("create")).toBeInTheDocument();
    fireEvent.click(screen.getByText("list"));
    expect(screen.getByTestId("list")).toBeInTheDocument();
  });
});
