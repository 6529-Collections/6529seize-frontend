jest.mock("next/image", () => (props: any) => <img {...props} />);
import { render, screen } from "@testing-library/react";
import { NextGenTokenImage, getNextGenImageUrl, getNextGenIconUrl } from "../../../components/nextGen/collections/nextgenToken/NextGenTokenImage";

const token = {
  id: 1,
  name: "token",
  thumbnail_url: "thumb.png",
  image_url: "image.png",
  owner: "0x1",
  normalised_id: 1,
  level: 1,
  tdh: 0,
  rep_score: 0,
} as any;

test("wraps image with link by default", () => {
  render(<NextGenTokenImage token={token} />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/nextgen/token/1");
});

test("uses original image when requested", () => {
  render(<NextGenTokenImage token={token} hide_link show_original />);
  const img = screen.getByRole("img") as HTMLImageElement;
  expect(img.src).toContain("image.png");
});

test("url helpers", () => {
  expect(getNextGenImageUrl(5)).toContain("/png/5");
  expect(getNextGenIconUrl(5)).toContain("/thumbnail/5");
});
