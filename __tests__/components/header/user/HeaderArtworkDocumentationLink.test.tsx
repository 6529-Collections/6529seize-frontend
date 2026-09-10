import { fireEvent, render, screen } from "@testing-library/react";
import HeaderArtworkDocumentationLink from "@/components/header/user/HeaderArtworkDocumentationLink";

const mockAccess = jest.fn();
jest.mock(
  "@/hooks/artwork-documentation/useArtworkDocumentationAccess",
  () => ({
    useArtworkDocumentationAccess: () => mockAccess(),
  })
);

it("opens the private work list when the server enables access", () => {
  mockAccess.mockReturnValue({ enabled: true });
  const close = jest.fn();
  render(<HeaderArtworkDocumentationLink onClose={close} />);
  const link = screen.getByRole("link", { name: "My artwork documentation" });
  expect(link).toHaveAttribute("href", "/artwork-documentation");
  fireEvent.click(link);
  expect(close).toHaveBeenCalledTimes(1);
});

it("omits the entry while access is unavailable", () => {
  mockAccess.mockReturnValue({ enabled: false });
  render(<HeaderArtworkDocumentationLink onClose={jest.fn()} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
