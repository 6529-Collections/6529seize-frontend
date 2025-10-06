import { render, screen } from "@testing-library/react";
import React from "react";
import HeaderUserConnected from "@/components/header/user/HeaderUserConnected";

const connectingMock = jest.fn((props: any) => <div data-testid="connecting" />);
const contextMock = jest.fn((props: any) => <div data-testid="context">{JSON.stringify(props)}</div>);

jest.mock("@/components/header/user/HeaderUserConnecting", () => ({
  __esModule: true,
  default: (props: any) => connectingMock(props),
}));

jest.mock("@/components/header/user/HeaderUserContext", () => ({
  __esModule: true,
  default: (props: any) => contextMock(props),
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(),
}));

const { useIdentity } = require("@/hooks/useIdentity");

function setup(result: { profile: any; isLoading: boolean }) {
  (useIdentity as jest.Mock).mockReturnValue(result);
  return render(<HeaderUserConnected connectedAddress="0xabc" />);
}

afterEach(() => jest.clearAllMocks());

describe("HeaderUserConnected", () => {
  it("shows connecting component while loading", () => {
    setup({ profile: null, isLoading: true });
    expect(screen.getByTestId("connecting")).toBeInTheDocument();
    expect(connectingMock).toHaveBeenCalled();
    expect(contextMock).not.toHaveBeenCalled();
    expect(useIdentity).toHaveBeenCalledWith({ handleOrWallet: "0xabc", initialProfile: null });
  });

  it("shows connecting component when profile missing", () => {
    setup({ profile: null, isLoading: false });
    expect(screen.getByTestId("connecting")).toBeInTheDocument();
    expect(contextMock).not.toHaveBeenCalled();
  });

  it("renders context when profile available", () => {
    const profile = { handle: "alice" };
    setup({ profile, isLoading: false });
    expect(screen.getByTestId("context")).toBeInTheDocument();
    expect(contextMock).toHaveBeenCalledWith({ profile });
  });
});
