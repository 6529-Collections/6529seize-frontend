import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

let inputGroupProps: any = {};
jest.mock("react-bootstrap", () => {
  const Modal = (props: any) => <div>{props.children}</div>;
  Modal.Header = (props: any) => <div>{props.children}</div>;
  Modal.Title = (props: any) => <div>{props.children}</div>;
  Modal.Body = (props: any) => <div>{props.children}</div>;
  
  const Form = { Control: (props: any) => <input {...props} /> };
  
  return {
    Modal,
    InputGroup: (props: any) => {
      inputGroupProps = props;
      return <div {...props} />;
    },
    Form,
    Button: (props: any) => <button {...props}>{props.children}</button>,
  };
});

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => <div data-testid="font-awesome-icon" {...props} />
}));

jest.mock("@tippyjs/react", () => {
  return (props: any) => <div>{props.children}</div>;
});

jest.mock("../../../helpers/Helpers", () => ({
  formatAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
}));

jest.mock("../../../components/searchModal/SearchModal.module.scss", () => ({
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
  searchBtnActive: "search-btn-active"
}));

jest.mock("@fortawesome/free-solid-svg-icons", () => ({
  faSearch: "fa-search",
  faSquareXmark: "fa-square-xmark",
  faTimesCircle: "fa-times-circle"
}));

import { SearchWalletsDisplay, SearchModalDisplay } from "../../../components/searchModal/SearchModal";



describe("SearchWalletsDisplay", () => {
  it("formats addresses", () => {
    function Wrapper() {
      const [wallets, setWallets] = React.useState(["0x1234567890abcdef1234567890abcdef12345678", "bob.eth"]);
      return (
        <SearchWalletsDisplay searchWallets={wallets} setSearchWallets={setWallets} setShowSearchModal={jest.fn()} />
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
  beforeEach(() => {
    inputGroupProps = {};
  });

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
    const input = screen.getByPlaceholderText(
      "Search for address, ENS or username"
    );
    fireEvent.change(input, { target: { value: "0xabc" } });
    fireEvent.click(screen.getByLabelText("Add search wallet"));
    expect(screen.getByText("0xabc")).toBeInTheDocument();
  });

  it("prevents duplicate wallets and toggles error class", () => {
    render(<Wrapper initial={["dup"]} />);
    const input = screen.getByPlaceholderText(
      "Search for address, ENS or username"
    );
    fireEvent.change(input, { target: { value: "dup" } });
    fireEvent.click(screen.getByLabelText("Add search wallet"));
    expect(screen.getAllByText("dup").length).toBe(1);
    expect(inputGroupProps.className).toContain("shakeWalletInput");
  });

  it("clears all wallets", () => {
    render(<Wrapper initial={["a", "b"]} />);
    fireEvent.click(screen.getByText("Clear All"));
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    expect(screen.getByText("No search queries added")).toBeInTheDocument();
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
