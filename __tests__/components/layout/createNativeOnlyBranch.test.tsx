import { createNativeOnlyBranch } from "@/components/layout/createNativeOnlyBranch";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

function Shell({ children }: { readonly children: ReactNode }) {
  return <section data-testid="native-shell">{children}</section>;
}

const Fallback = () => <div role="status">Loading</div>;

afterEach(() => {
  document.documentElement.removeAttribute("data-native-runtime");
});

it("does not fetch the branch on the web until it renders", async () => {
  const importer = jest.fn(async () => ({ default: Shell }));
  const Branch = createNativeOnlyBranch(importer, Fallback);
  expect(importer).not.toHaveBeenCalled();

  render(
    <Branch>
      <p>Content</p>
    </Branch>
  );
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(await screen.findByTestId("native-shell")).toHaveTextContent(
    "Content"
  );
  expect(importer).toHaveBeenCalledTimes(1);
});

it("starts the download when the native startup script marked the document", () => {
  document.documentElement.setAttribute("data-native-runtime", "ios");
  const importer = jest.fn(async () => ({ default: Shell }));
  createNativeOnlyBranch(importer, Fallback);
  expect(importer).toHaveBeenCalledTimes(1);
});
