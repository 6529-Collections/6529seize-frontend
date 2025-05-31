import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("react-bootstrap", () => {
  return {
    Modal: (props: any) => <div>{props.children}</div>,
    InputGroup: (props: any) => <div {...props} />,
    Form: { Control: (props: any) => <input {...props} /> },
    Button: (props: any) => <button {...props}>{props.children}</button>,
  };
});

import { SearchWalletsDisplay } from "../../../components/searchModal/SearchModal";



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
