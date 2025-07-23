import { render, screen } from "@testing-library/react";
import React from "react";
import ElevatedDeconstructions from "@/app/museum/genesis/elevated-deconstructions/page";
import Ringers from "@/app/museum/genesis/ringers/page";
import Screens from "@/app/museum/genesis/screens/page";
import Skulptuur from "@/app/museum/genesis/skulptuur/page";
import Synapses from "@/app/museum/genesis/synapses/page";
import BlocksOfArt from "@/app/museum/genesis/the-blocks-of-art/page";
import Vortex from "@/app/museum/genesis/vortex/page";
import OMRedirect from "@/app/om/OM/page";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

const renderWithAuth = (ui: React.ReactElement, overrides = {}) => {
  const value = { setTitle: jest.fn(), ...overrides } as any;
  return {
    ...render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>),
    setTitle: value.setTitle,
  };
};

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("additional museum and misc pages render", () => {
  it("renders Elevated Deconstructions", () => {
    render(<ElevatedDeconstructions />);
    expect(
      screen.getAllByText(/ELEVATED DECONSTRUCTIONS/i).length
    ).toBeGreaterThan(0);
  });

  it("renders Ringers", () => {
    render(<Ringers />);
    expect(screen.getAllByText(/RINGERS/i).length).toBeGreaterThan(0);
  });

  it("renders Screens", () => {
    render(<Screens />);
    expect(screen.getAllByText(/SCREENS/i).length).toBeGreaterThan(0);
  });

  it("renders Skulptuur", () => {
    render(<Skulptuur />);
    expect(screen.getAllByText(/SKULPTUUR/i).length).toBeGreaterThan(0);
  });

  it("renders Synapses", () => {
    render(<Synapses />);
    expect(screen.getAllByText(/SYNAPSES/i).length).toBeGreaterThan(0);
  });

  it("renders Blocks Of Art", () => {
    render(<BlocksOfArt />);
    expect(screen.getAllByText(/THE BLOCKS OF ART/i).length).toBeGreaterThan(0);
  });

  it("renders Vortex", () => {
    render(<Vortex />);
    expect(screen.getAllByText(/VORTEX/i).length).toBeGreaterThan(0);
  });

  it("renders OM redirect page", () => {
    render(<OMRedirect />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });
});
