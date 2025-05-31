import { render, screen, fireEvent, act } from "@testing-library/react";
import HeaderSearchModal from "../../components/header/header-search/HeaderSearchModal";
import { useRouter } from "next/router";

jest.mock("../../components/header/header-search/HeaderSearchModalItem", () => () => null);

jest.mock("../../hooks/useWaves", () => ({ useWaves: () => ({ waves: [], isFetching: false }) }));

jest.mock("../../hooks/useLocalPreference", () => jest.fn(() => ["PROFILES", jest.fn()]));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: jest.fn(() => ({ data: [{ handle: "bob", wallet: "0x1" }], isFetching: false })),
  };
});

(useRouter as jest.Mock) = jest.fn(() => ({ push: jest.fn(), query: {} }));

describe("HeaderSearchModal", () => {
  it("updates input", () => {
    render(<HeaderSearchModal onClose={() => {}} />);
    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "bob" } });
    expect(input).toHaveValue("bob");
  });
});
