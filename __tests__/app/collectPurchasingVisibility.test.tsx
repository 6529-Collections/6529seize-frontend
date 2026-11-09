import CollectPage from "@/app/collect/page";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

const mockReplace = jest.fn();
const mockCheckoutMount = jest.fn();
let mockIsIos = true;

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));
jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: () => ({}),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/components/collect/CollectPageClient", () => ({
  __esModule: true,
  default: () => {
    mockCheckoutMount();
    return <button>Review purchase</button>;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsIos = true;
});

it.each([
  [{}, "/the-memes"],
  [{ collection: "gradients", intent: "full_set" }, "/6529-gradient"],
  [{ collection: "pebbles", intent: "lowest" }, "/nextgen/collection/pebbles"],
] as const)(
  "keeps Collect checkout unmounted on iOS for %j",
  async (params, destination) => {
    const page = await CollectPage({ searchParams: Promise.resolve(params) });

    expect(renderToString(page)).not.toContain("Review purchase");
    render(page);

    expect(mockReplace).toHaveBeenCalledWith(destination);
    expect(mockCheckoutMount).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Review purchase" })
    ).toBeNull();
  }
);

it("renders Collect checkout after hydration outside the iOS app", async () => {
  mockIsIos = false;
  const page = await CollectPage({ searchParams: Promise.resolve({}) });
  render(page);

  expect(screen.getByRole("button", { name: "Review purchase" })).toBeVisible();
  expect(mockReplace).not.toHaveBeenCalled();
});
