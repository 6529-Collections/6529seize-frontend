import { render } from "@testing-library/react";
import CollectionPageShell from "@/app/nextgen/collection/[collection]/CollectionPageShell";

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({ NextGenCollectionHead: () => <div data-testid="head" /> })
);
jest.mock(
  "@/components/nextGen/collections/NextGenNavigationHeader",
  () => () => <div data-testid="nav" />
);
jest.mock("@/app/nextgen/collection/[collection]/useShallowRedirect", () => ({
  useShallowRedirect: jest.fn(),
}));

describe("CollectionPageShell", () => {
  it("renders nav when withNav true", () => {
    const { getByTestId } = render(
      <CollectionPageShell collection={{ id: 1 } as any}>
        <div data-testid="child" />
      </CollectionPageShell>
    );
    expect(getByTestId("nav")).toBeInTheDocument();
  });

  it("hides nav when withNav false", () => {
    const { queryByTestId } = render(
      <CollectionPageShell collection={{ id: 1 } as any} withNav={false}>
        <div data-testid="child" />
      </CollectionPageShell>
    );
    expect(queryByTestId("nav")).toBeNull();
  });
});
