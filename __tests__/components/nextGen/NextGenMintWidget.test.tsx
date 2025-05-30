import { render, screen } from "@testing-library/react";
import { getJsonData } from "../../../components/nextGen/collections/collectionParts/mint/NextGenMintWidget";

it("renders json data list", () => {
  const data = JSON.stringify({ artist: "bob", year: "2023" });
  render(getJsonData("abc", data));
  expect(screen.getByText("Artist: bob")).toBeInTheDocument();
  expect(screen.getByText("Year: 2023")).toBeInTheDocument();
});
