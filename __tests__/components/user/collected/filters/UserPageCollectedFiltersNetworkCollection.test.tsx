import UserPageCollectedFiltersNetworkCollection from "@/components/user/collected/filters/UserPageCollectedFiltersNetworkCollection";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";
import { render } from "@testing-library/react";

let capturedProps: any = null;

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdown",
  () => (props: any) => {
    capturedProps = props;
    return <div data-testid="dropdown" />;
  }
);

jest.mock("@/hooks/useXtdhCollectionsQuery", () => ({
  useXtdhCollectionsQuery: jest.fn(),
}));

describe("UserPageCollectedFiltersNetworkCollection", () => {
  const useXtdhCollectionsQueryMock = useXtdhCollectionsQuery as jest.Mock;

  beforeEach(() => {
    capturedProps = null;
    useXtdhCollectionsQueryMock.mockReturnValue({
      collections: [
        { collection_name: "6529 Network", contract: "0x123" },
        { collection_name: null, contract: "0x456" },
      ],
    });
  });

  it("passes source-locale network collection labels to the dropdown", () => {
    render(
      <UserPageCollectedFiltersNetworkCollection
        identity="punk6529"
        selected="0x456"
        setSelected={jest.fn()}
      />
    );

    expect(useXtdhCollectionsQueryMock).toHaveBeenCalledWith({
      identity: "punk6529",
      pageSize: 100,
      sortField: "xtdh",
      order: "DESC",
    });
    expect(capturedProps.filterLabel).toBe("Collection");
    expect(capturedProps.activeItem).toBe("0x456");
    expect(capturedProps.items).toEqual([
      expect.objectContaining({
        label: "All",
        mobileLabel: "All Collections",
        value: null,
      }),
      expect.objectContaining({
        label: "6529 Network",
        value: "0x123",
      }),
      expect.objectContaining({
        label: "Unknown Collection",
        value: "0x456",
      }),
    ]);
  });
});
