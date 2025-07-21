import { render, screen } from "@testing-library/react";
import React from "react";
import CryptoAdPunks from "@/app/museum/6529-fund-szn1/cryptoad-punks/page";
import CryptoPunks from "@/app/museum/6529-fund-szn1/cryptopunks/page";
import QueensKings from "@/app/museum/6529-fund-szn1/queens-kings/page";
import AckBar from "@/app/museum/ack-bar/page";
import EarlyNftArt from "@/app/museum/early-nft-art/page";
import Autology from "@/app/museum/genesis/autology/page";
import Cryptoblots from "@/app/museum/genesis/cryptoblots/page";
import Dreams from "@/app/museum/genesis/dreams/page";
import DynamicSlices from "@/app/museum/genesis/dynamic-slices/page";
import Edifice from "@/app/museum/genesis/edifice/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

describe("museum static pages render", () => {
  it("renders CryptoAdPunks page", () => {
    render(<CryptoAdPunks />);
    expect(screen.getAllByText(/CRYPTOAD PUNKS/i).length).toBeGreaterThan(0);
  });

  it("renders CryptoPunks page", () => {
    render(<CryptoPunks />);
    expect(screen.getAllByText(/CRYPTOPUNKS/i).length).toBeGreaterThan(0);
  });

  it("renders Queens & Kings page", () => {
    render(<QueensKings />);
    expect(screen.getAllByText(/QUEENS \+ KINGS/i).length).toBeGreaterThan(0);
  });

  it("renders Ack Bar page", () => {
    render(<AckBar />);
    expect(screen.getAllByText(/ACK BAR/i).length).toBeGreaterThan(0);
  });

  it("renders Early NFT Art page", () => {
    render(<EarlyNftArt />);
    expect(screen.getAllByText(/EARLY NFT ART/i).length).toBeGreaterThan(0);
  });

  it("renders Autology page", () => {
    render(<Autology />);
    expect(screen.getAllByText(/AUTOLOGY/i).length).toBeGreaterThan(0);
  });

  it("renders Cryptoblots page", () => {
    render(<Cryptoblots />);
    expect(screen.getAllByText(/CRYPTOBLOTS/i).length).toBeGreaterThan(0);
  });

  it("renders Dreams page", () => {
    render(<Dreams />);
    expect(screen.getAllByText(/DREAMS/i).length).toBeGreaterThan(0);
  });

  it("renders Dynamic Slices page", () => {
    render(<DynamicSlices />);
    expect(screen.getAllByText(/DYNAMIC SLICES/i).length).toBeGreaterThan(0);
  });

  it("renders Edifice page", () => {
    render(<Edifice />);
    expect(screen.getAllByText(/EDIFICE/i).length).toBeGreaterThan(0);
  });
});
