import { render } from "@testing-library/react";
import UserPageCollectedFiltersSortBy from "@/components/user/collected/filters/UserPageCollectedFiltersSortBy";
import { CollectedCollectionType, CollectionSort } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";

let capturedProps: any = null;
jest.mock("@/components/utils/select/CommonSelect", () => (props: any) => {
  capturedProps = props;
  return <div data-testid="select" />;
});

describe("UserPageCollectedFiltersSortBy", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it("filters sort items based on collection", () => {
    const { rerender } = render(
      <UserPageCollectedFiltersSortBy
        selected={CollectionSort.TOKEN_ID}
        direction={SortDirection.ASC}
        collection={CollectedCollectionType.MEMELAB}
        setSelected={jest.fn()}
      />
    );
    expect(capturedProps.items.map((i: any) => i.value)).toEqual([
      CollectionSort.TOKEN_ID,
    ]);

    rerender(
      <UserPageCollectedFiltersSortBy
        selected={CollectionSort.TOKEN_ID}
        direction={SortDirection.ASC}
        collection={CollectedCollectionType.MEMES}
        setSelected={jest.fn()}
      />
    );
    expect(capturedProps.items.map((i: any) => i.value)).toEqual([
      CollectionSort.TOKEN_ID,
      CollectionSort.TDH,
      CollectionSort.RANK,
    ]);
  });

  it("shows all sorts when collection is null", () => {
    render(
      <UserPageCollectedFiltersSortBy
        selected={CollectionSort.TOKEN_ID}
        direction={SortDirection.DESC}
        collection={null}
        setSelected={jest.fn()}
      />
    );
    expect(capturedProps.items.map((i: any) => i.value)).toEqual([
      CollectionSort.TOKEN_ID,
      CollectionSort.TDH,
      CollectionSort.RANK,
    ]);
  });

  it("passes source-locale labels to the select", () => {
    render(
      <UserPageCollectedFiltersSortBy
        selected={CollectionSort.XTDH_DAY}
        direction={SortDirection.DESC}
        collection={CollectedCollectionType.NETWORK}
        setSelected={jest.fn()}
      />
    );

    expect(capturedProps.filterLabel).toBe("Sort By");
    expect(capturedProps.items).toEqual([
      expect.objectContaining({ label: "xTDH", value: CollectionSort.XTDH }),
      expect.objectContaining({
        label: "xTDH/day",
        value: CollectionSort.XTDH_DAY,
      }),
    ]);
  });
});
