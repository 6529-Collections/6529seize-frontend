import { render, screen } from "@testing-library/react";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";

jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));

describe("Prenodes deprecation notice", () => {
  it("explains the replacement without requesting the registry", () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    try {
      render(<PrenodesStatus />);
      expect(
        screen.getByRole("heading", { level: 1, name: "Prenodes" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "6529 Prenodes have been deprecated. Use the 6529 Desktop app to calculate TDH."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Explore 6529 Desktop" })
      ).toHaveAttribute("href", "/about/6529-apps");
      expect(screen.queryByText("Register Date")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
