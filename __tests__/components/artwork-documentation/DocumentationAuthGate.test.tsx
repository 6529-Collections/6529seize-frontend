import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import DocumentationAuthGate from "@/components/artwork-documentation/DocumentationAuthGate";

let mockProfile: { id: string } | null = { id: "artist-a" };
let mockFetching = false;
let mockConnectionState = "connected";
let mockAddress: string | undefined = "0xabc";
let mockWallet: string | null = "0xabc";
let mockProxy: { id: string } | null = null;
const mockCancel = jest.fn();
const mockRemove = jest.fn();
const mockClient = { cancelQueries: mockCancel, removeQueries: mockRemove };
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockClient,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfile,
    fetchingProfile: mockFetching,
    activeProfileProxy: mockProxy,
    requestAuth: jest.fn(),
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
    connectionState: mockConnectionState,
  }),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockWallet,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

function Editor() {
  const [value, setValue] = useState("");
  return (
    <input
      aria-label="Private draft"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
const gate = () => (
  <DocumentationAuthGate>
    <Editor />
  </DocumentationAuthGate>
);

describe("documentation authenticated actor boundary", () => {
  beforeEach(() => {
    mockProfile = { id: "artist-a" };
    mockFetching = false;
    mockConnectionState = "connected";
    mockAddress = "0xabc";
    mockWallet = "0xabc";
    mockProxy = null;
    jest.clearAllMocks();
  });
  it("keeps private edits during a background refresh of the same identity", () => {
    const { rerender } = render(gate());
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "unsaved private text" },
    });
    mockFetching = true;
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toHaveValue(
      "unsaved private text"
    );
    expect(mockRemove).not.toHaveBeenCalled();
  });
  it("keeps edits if the provider disconnects while the authenticated wallet stays the same", () => {
    const { rerender } = render(gate());
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "unsaved" },
    });
    mockAddress = undefined;
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toHaveValue("unsaved");
  });
  it("destroys private edits and clears private queries on a profile change", () => {
    const { rerender } = render(gate());
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "artist a only" },
    });
    mockProfile = { id: "artist-b" };
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toHaveValue("");
    expect(mockCancel).toHaveBeenCalledWith({
      queryKey: ["artwork-documentation"],
    });
    expect(mockRemove).toHaveBeenCalledWith({
      queryKey: ["artwork-documentation"],
    });
  });
  it("resets the editor when a proxy or authenticated wallet changes", () => {
    const { rerender } = render(gate());
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "direct" },
    });
    mockProxy = { id: "proxy" };
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "proxy" },
    });
    mockWallet = "0xdef";
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toHaveValue("");
  });
});

it.each(["initializing", "connecting"])(
  "waits for %s before deciding documentation access",
  (state) => {
    mockConnectionState = state;
    mockProfile = null;
    mockFetching = false;
    const { rerender } = render(gate());
    expect(screen.getByText("Loading your documentation…")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Private draft")).not.toBeInTheDocument();
    mockConnectionState = "connected";
    mockFetching = true;
    rerender(gate());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    mockFetching = false;
    mockProfile = { id: "artist-a" };
    rerender(gate());
    expect(screen.getByLabelText("Private draft")).toBeInTheDocument();
  }
);
