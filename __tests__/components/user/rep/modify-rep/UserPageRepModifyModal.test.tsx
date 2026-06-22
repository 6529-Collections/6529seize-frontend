// Mock react-dom before imports so createPortal renders inline
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "@/components/user/rep/modify-rep/UserPageRepModifyModal";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");
jest.mock("@/hooks/useRepAllocation", () => ({
  useRepAllocation: () => ({
    repState: {
      category: "Artist",
      rating: 1234,
      contributor_count: 7,
      rater_contribution: 0,
    },
    heroAvailableRep: 100,
    proxyAvailableCredit: null,
    minMaxValues: { min: -100, max: 100 },
  }),
}));

const useMutationMock = useMutation as jest.Mock;

const auth = {
  requestAuth: jest.fn().mockResolvedValue({ success: false }),
  setToast: jest.fn(),
  connectedProfile: null,
  activeProfileProxy: null,
} as any;

const rq = { onProfileRepModify: jest.fn() } as any;

const profile = {
  handle: "alice",
  query: "alice",
  primary_wallet: "0x1",
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  useMutationMock.mockReturnValue({ mutateAsync: jest.fn() });
});

describe("UserPageRepModifyModal edit form", () => {
  it("calls onClose when cancel clicked", async () => {
    const onClose = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={onClose} profile={profile} category="Artist" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables save button initially", () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={() => {}} profile={profile} category="Artist" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("renders category name and rater stats", () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={() => {}} profile={profile} category="Artist" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getByText("Your available Rep:")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(
      screen.getByText("Your max/min Rep Rating to Artist:")
    ).toBeInTheDocument();
  });

  it("renders edit form actions", () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={() => {}} profile={profile} category="Artist" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={onClose} profile={profile} category="Artist" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
