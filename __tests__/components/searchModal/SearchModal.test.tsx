import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("@/helpers/Helpers", () => ({
  formatAddress: (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`,
}));

jest.mock("@/components/searchModal/SearchModal.module.css", () => ({
  shakeWalletInput: "shakeWalletInput",
  modalInput: "modal-input",
  modalButton: "modal-button",
  removeWalletBtn: "remove-wallet-btn",
  noSearchWalletsText: "no-search-wallets-text",
  modalButtonClear: "modal-button-clear",
  modalButtonDone: "modal-button-done",
  searchWalletDisplayWrapper: "search-wallet-display-wrapper",
  searchWalletDisplayBtn: "search-wallet-display-btn",
  searchWalletDisplay: "search-wallet-display",
  clearSearchBtnIcon: "clear-search-btn-icon",
  searchBtn: "search-btn",
  searchBtnActive: "search-btn-active",
}));

jest.mock("@fortawesome/free-solid-svg-icons", () => ({
  faSearch: "fa-search",
  faSquareXmark: "fa-square-xmark",
  faTimesCircle: "fa-times-circle",
}));

import {
  SearchWalletsDisplay,
  SearchModalDisplay,
} from "@/components/searchModal/SearchModal";

describe("SearchWalletsDisplay", () => {
  it("formats addresses", () => {
    function Wrapper() {
      const [wallets, setWallets] = React.useState([
        "0x1234567890abcdef1234567890abcdef12345678",
        "bob.eth",
      ]);
      return (
        <SearchWalletsDisplay
          searchWallets={wallets}
          setSearchWallets={setWallets}
          setShowSearchModal={jest.fn()}
        />
      );
    }
    render(<Wrapper />);
    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getByText("bob.eth")).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("x")[0]);
    expect(screen.queryByText("0x1234...5678")).not.toBeInTheDocument();
  });
});

describe("SearchModalDisplay", () => {
  function Wrapper({ initial }: { initial: string[] }) {
    const [wallets, setWallets] = React.useState(initial);
    return (
      <SearchModalDisplay
        show={true}
        setShow={jest.fn()}
        searchWallets={wallets}
        setSearchWallets={setWallets}
      />
    );
  }

  it("adds new wallet from input", () => {
    render(<Wrapper initial={[]} />);
    const input = screen.getByPlaceholderText("Handle, ENS, or wallet address");
    fireEvent.change(input, { target: { value: "0xabc" } });
    fireEvent.click(screen.getByLabelText("Add identity filter"));
    expect(screen.getByText("0xabc")).toBeInTheDocument();
  });

  it("prevents duplicate wallets and toggles error class", () => {
    render(<Wrapper initial={["dup"]} />);
    const input = screen.getByPlaceholderText("Handle, ENS, or wallet address");
    fireEvent.change(input, { target: { value: "dup" } });
    fireEvent.click(screen.getByLabelText("Add identity filter"));
    expect(screen.getAllByText("dup").length).toBe(1);
    expect(input.closest("form")).toHaveClass("shakeWalletInput");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That identity is already included."
    );
  });

  it("prevents duplicates that differ only by casing", () => {
    render(<Wrapper initial={["Alice"]} />);
    const input = screen.getByPlaceholderText("Handle, ENS, or wallet address");
    fireEvent.change(input, { target: { value: "alice" } });
    fireEvent.click(screen.getByLabelText("Add identity filter"));

    expect(screen.getAllByText("Alice")).toHaveLength(1);
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That identity is already included."
    );
  });

  it("clears all wallets", () => {
    render(<Wrapper initial={["a", "b"]} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    expect(
      screen.getByText("No identity filters added. Showing everyone.")
    ).toBeInTheDocument();
  });
});

describe("SearchWalletsDisplay button", () => {
  it("opens modal when search button clicked", () => {
    const setShow = jest.fn();
    render(
      <SearchWalletsDisplay
        searchWallets={[]}
        setSearchWallets={jest.fn()}
        setShowSearchModal={setShow}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(setShow).toHaveBeenCalledWith(true);
  });
});
