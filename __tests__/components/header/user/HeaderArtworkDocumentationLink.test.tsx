import { fireEvent, render, screen } from "@testing-library/react";
import HeaderArtworkDocumentationLink from "@/components/header/user/HeaderArtworkDocumentationLink";

it("opens the private work list when the server enables access", () => {
  const close = jest.fn();
  render(<HeaderArtworkDocumentationLink enabled={true} onClose={close} />);
  const link = screen.getByRole("link", { name: "My artwork documentation" });
  expect(link).toHaveAttribute("href", "/artwork-documentation");
  fireEvent.click(link);
  expect(close).toHaveBeenCalledTimes(1);
});

it("omits the entry while access is unavailable", () => {
  render(
    <HeaderArtworkDocumentationLink enabled={false} onClose={jest.fn()} />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
