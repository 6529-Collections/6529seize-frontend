import HeroArtworkFan from "@/components/home/hero/HeroArtworkFan";
import { fireEvent, render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import path from "node:path";

it("renders the fixed OG cards from local assets without query or wallet providers", () => {
  const { container, rerender } = render(<HeroArtworkFan />);
  const captions = [
    "rekt6529#5",
    "NakamotoFreedom#4",
    "UncleSeize#3",
    "SeizeJPGs#2",
    "6529Seizing#1",
  ];
  expect(
    Array.from(container.querySelectorAll("figcaption"), (el) => el.textContent)
  ).toEqual(captions);
  expect(container.querySelectorAll("figure")).toHaveLength(5);
  const sources = Array.from(container.querySelectorAll("img"), (img) =>
    new URL(img.src).pathname
  );
  expect(sources).toEqual([
    "/home/hero/5.webp",
    "/home/hero/4.webp",
    "/home/hero/3.webp",
    "/home/hero/2.webp",
    "/home/hero/1.webp",
  ]);
  for (const source of sources) {
    expect(existsSync(path.join(process.cwd(), "public", source))).toBe(true);
  }
  rerender(<HeroArtworkFan />);
  expect(
    Array.from(container.querySelectorAll("figcaption"), (el) => el.textContent)
  ).toEqual(captions);
});

it("keeps the artwork fan decorative and outside keyboard navigation", () => {
  const { container } = render(<HeroArtworkFan />);
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(screen.queryAllByRole("img")).toHaveLength(0);
  expect(container.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
});

it("retains the frame and caption if a local image fails", () => {
  const { container } = render(<HeroArtworkFan />);
  const front = container.querySelector('[data-slot="4"]')!;
  fireEvent.error(front.querySelector("img")!);
  expect(front.querySelector("img")).toBeNull();
  expect(front).toHaveTextContent("6529Seizing#1");
  expect(container.querySelectorAll("figure")).toHaveLength(5);
  expect(container.querySelectorAll("img")).toHaveLength(4);
});
