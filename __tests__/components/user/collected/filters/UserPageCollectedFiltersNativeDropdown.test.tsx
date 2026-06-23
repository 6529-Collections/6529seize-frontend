import UserPageCollectedFiltersNativeDropdown from "@/components/user/collected/filters/UserPageCollectedFiltersNativeDropdown";
import { CollectedCollectionType } from "@/entities/IProfile";
import { render } from "@testing-library/react";

let capturedProps: any = null;

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdown",
  () => (props: any) => {
    capturedProps = props;
    return <div data-testid="dropdown" />;
  }
);

describe("UserPageCollectedFiltersNativeDropdown", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it("passes source-locale collection labels to the dropdown", () => {
    render(
      <UserPageCollectedFiltersNativeDropdown
        selected={CollectedCollectionType.MEMES}
        setSelected={jest.fn()}
      />
    );

    expect(capturedProps.filterLabel).toBe("Collection");
    expect(capturedProps.activeItem).toBe(CollectedCollectionType.MEMES);
    expect(capturedProps.items).toEqual([
      expect.objectContaining({
        label: "All",
        mobileLabel: "All Collections",
        value: null,
      }),
      expect.objectContaining({
        label: "The Memes",
        value: CollectedCollectionType.MEMES,
      }),
      expect.objectContaining({
        label: "NextGen",
        value: CollectedCollectionType.NEXTGEN,
      }),
      expect.objectContaining({
        label: "Gradients",
        value: CollectedCollectionType.GRADIENTS,
      }),
      expect.objectContaining({
        label: "Meme Lab",
        value: CollectedCollectionType.MEMELAB,
      }),
    ]);
  });
});
