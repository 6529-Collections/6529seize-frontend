import { render, screen } from "@testing-library/react";

import DropPreviewPlaceholder from "@/components/waves/drops/DropPreviewPlaceholder";

test("a not-found preview is terminal without a separate unavailable flag", () => {
  render(<DropPreviewPlaceholder notFound href="/waves/w?drop=d" />);

  expect(screen.getByRole("status", { name: "Drop preview" })).toHaveAttribute(
    "aria-busy",
    "false"
  );
  expect(screen.getByText("Drop not found")).toBeInTheDocument();
  expect(screen.queryByText("Loading drop preview")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open drop" })).toHaveAttribute(
    "href",
    "/waves/w?drop=d"
  );
});
