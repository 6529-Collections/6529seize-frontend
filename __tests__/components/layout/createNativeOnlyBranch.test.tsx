import { createNativeOnlyBranch } from "@/components/layout/createNativeOnlyBranch";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

function Shell({ children }: { readonly children: ReactNode }) {
  return <section data-testid="native-shell">{children}</section>;
}

function WebShell({ children }: { readonly children: ReactNode }) {
  return <section data-testid="web-shell">{children}</section>;
}

const Loading = () => <div role="status">Loading</div>;
const OPTIONS = { name: "test shell", loading: Loading, webBranch: WebShell };

afterEach(() => {
  document.documentElement.removeAttribute("data-native-runtime");
});

it("does not fetch the branch on the web until it renders", async () => {
  const importer = jest.fn(async () => ({ default: Shell }));
  const Branch = createNativeOnlyBranch(importer, OPTIONS);
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
  createNativeOnlyBranch(importer, OPTIONS);
  expect(importer).toHaveBeenCalledTimes(1);
});

it("renders the web branch instead of loading forever when the chunk fails", async () => {
  const importer = jest.fn(async () => {
    throw new Error("Loading chunk failed");
  });
  const Branch = createNativeOnlyBranch(importer, OPTIONS);
  const consoleError = jest.spyOn(console, "error").mockImplementation();
  try {
    render(
      <Branch>
        <p>Content</p>
      </Branch>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();

    expect(await screen.findByTestId("web-shell")).toHaveTextContent(
      "Content"
    );
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load the native test shell"
      )
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("native-shell")).not.toBeInTheDocument();
  } finally {
    consoleError.mockRestore();
  }
});
