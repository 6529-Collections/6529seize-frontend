import { render, screen } from "@testing-library/react";
import { getJsonData } from "../../../components/nextGen/collections/collectionParts/mint/NextGenMintWidget";

it("renders json data list", () => {
  const data = JSON.stringify({ artist: "bob", year: "2023" });
  render(getJsonData("abc", data));
  expect(screen.getByText("Artist: bob")).toBeInTheDocument();
  expect(screen.getByText("Year: 2023")).toBeInTheDocument();
});

it('handles multiple entries', () => {
  const data = JSON.stringify({ a: '1', b: '2', c: '3' });
  render(getJsonData('def', data));
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});
