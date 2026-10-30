import { act, fireEvent, render, waitFor } from "@testing-library/react";
import WebSidebarAccountAvatar from "@/components/layout/sidebar/WebSidebarAccountAvatar";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

afterEach(() => jest.useRealTimers());

it("keeps the shimmer until the actual PFP loads, without a fallback image flash", async () => {
  const { container } = render(<WebSidebarAccountAvatar src="/alice.png" />);
  const image = container.querySelector("img")!;
  expect(image).toHaveAttribute("src", "http://localhost/alice.png");
  expect(image).toHaveClass("tw-opacity-0");
  expect(container.querySelector("span")).toBeInTheDocument();
  fireEvent.load(image);
  await waitFor(() => expect(image).toHaveClass("tw-opacity-100"));
  expect(container.querySelector("span")).not.toBeInTheDocument();
});

it("requests the AUTOx50 derivative of a CDN profile picture", () => {
  const { container } = render(
    <WebSidebarAccountAvatar src={CDN_AVATAR_URL} />
  );
  expect(getRequestedImageSrc(container.querySelector("img"))).toContain(
    scaledAvatarPath(ImageScale.W_AUTO_H_50)
  );
});

it("uses the default icon for a missing or broken PFP", () => {
  const { container, rerender } = render(
    <WebSidebarAccountAvatar src={null} />
  );
  expect(container.querySelector("svg")).toHaveClass("tw-size-6");
  rerender(<WebSidebarAccountAvatar key="alice" src="/alice.png" />);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("svg")).toHaveClass("tw-size-6");
  expect(container.querySelector("img")).not.toBeInTheDocument();
});

it("stops shimmering when an image never completes", () => {
  jest.useFakeTimers();
  const { container } = render(<WebSidebarAccountAvatar src="/stalled.png" />);
  const image = container.querySelector("img")!;
  act(() => jest.advanceTimersByTime(10_000));
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
  fireEvent.load(image);
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
});

it("does not carry a loaded avatar into another account", async () => {
  const { container, rerender } = render(
    <WebSidebarAccountAvatar key="alice" src="/alice.png" />
  );
  fireEvent.load(container.querySelector("img")!);
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveClass("tw-opacity-100")
  );
  rerender(<WebSidebarAccountAvatar key="bob" src="/bob.png" />);
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    "http://localhost/bob.png"
  );
  expect(container.querySelector("img")).toHaveClass("tw-opacity-0");
});
