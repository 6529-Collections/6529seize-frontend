import { render, screen } from "@testing-library/react";
import React from "react";
import ArcheologyOfTheFuture from "@/app/museum/6529-fund-szn1/archeology-of-the-future/page";
import PhotoB from "@/app/museum/6529-photo-b/page";
import GeneralAssembly from "@/app/museum/general-assembly/page";
import Hyperhash from "@/app/museum/genesis/hyperhash/page";
import SecretSurprise from "@/app/museum/genesis/secret-surprise/page";
import SozetLounge from "@/app/museum/sozet-lounge/page";
import TheInstitutions from "@/app/museum/the-institutions/page";
import IntroducingOM from "@/app/news/introducing-om/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

// Some of these pages rely on SeizeConnectContext, so provide a minimal mock
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x0",
    seizeConnect: jest.fn(),
    seizeDisconnect: jest.fn(),
    seizeDisconnectAndLogout: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    seizeConnectOpen: false,
    isConnected: false,
    isAuthenticated: false,
  }),
}));

describe("additional museum pages render", () => {
  it("renders Archeology Of The Future page", () => {
    render(<ArcheologyOfTheFuture />);
    expect(
      screen.getAllByText(/ARCHEOLOGY OF THE FUTURE/i).length
    ).toBeGreaterThan(0);
  });

  it("renders 6529 Photo B page", () => {
    render(<PhotoB />);
    expect(screen.getAllByText(/6529 PHOTO B/i).length).toBeGreaterThan(0);
  });

  it("renders General Assembly page", () => {
    render(<GeneralAssembly />);
    expect(screen.getAllByText(/GENERAL ASSEMBLY/i).length).toBeGreaterThan(0);
  });

  it("renders Hyperhash page", () => {
    render(<Hyperhash />);
    expect(screen.getAllByText(/HYPERHASH/i).length).toBeGreaterThan(0);
  });

  it("renders Secret Surprise page", () => {
    render(<SecretSurprise />);
    expect(screen.getAllByText(/SECRET SURPRISE/i).length).toBeGreaterThan(0);
  });

  it("renders Sozet Lounge page", () => {
    render(<SozetLounge />);
    expect(screen.getAllByText(/SOZET LOUNGE/i).length).toBeGreaterThan(0);
  });

  it("renders The Institutions page", () => {
    render(<TheInstitutions />);
    expect(screen.getAllByText(/THE INSTITUTIONS/i).length).toBeGreaterThan(0);
  });

  it("renders Introducing OM news page", () => {
    render(<IntroducingOM />);
    expect(screen.getAllByText(/INTRODUCING OM/i).length).toBeGreaterThan(0);
  });
});
