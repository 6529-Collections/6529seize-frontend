import GroupCreateNfts from "@/components/groups/page/create/config/nfts/GroupCreateNfts";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiGroupOwnsNftNameEnum } from "@/generated/models/ApiGroupOwnsNft";
import { render } from "@testing-library/react";

let selectProps: any = null;
let selectedProps: any = null;

jest.mock(
  "@/components/groups/page/create/config/nfts/GroupCreateNftsSelect",
  () => ({
    __esModule: true,
    default: (props: any) => {
      selectProps = props;
      return <div data-testid="select" />;
    },
  })
);
jest.mock(
  "@/components/groups/page/create/config/nfts/GroupCreateNftsSelected",
  () => ({
    __esModule: true,
    default: (props: any) => {
      selectedProps = props;
      return <div data-testid="selected" />;
    },
  })
);

const gradients = {
  name: ApiGroupOwnsNftNameEnum.Gradients,
  tokens: ["1"],
};

function renderComponent(nfts: any[], setNfts: jest.Mock) {
  return render(<GroupCreateNfts nfts={nfts} setNfts={setNfts} />);
}

describe("GroupCreateNfts", () => {
  beforeEach(() => {
    selectProps = null;
    selectedProps = null;
  });

  it("passes props to child components", () => {
    const setNfts = jest.fn();
    renderComponent([gradients], setNfts);
    expect(selectProps.selected).toEqual([gradients]);
    expect(selectedProps.selected).toEqual([gradients]);
  });

  it("handles selecting and removing tokens", () => {
    const setNfts = jest.fn();
    renderComponent([], setNfts);
    const item = { id: "2", contract: "0x0000" } as any;
    selectProps.onSelect(item);
    expect(setNfts).not.toHaveBeenCalled();
    const validItem = { id: "3", contract: MEMES_CONTRACT } as any;
    selectProps.onSelect(validItem);
    expect(setNfts).toHaveBeenCalledWith([
      { name: ApiGroupOwnsNftNameEnum.Memes, tokens: ["3"] },
    ]);

    setNfts.mockClear();
    selectedProps.onRemove({ name: ApiGroupOwnsNftNameEnum.Memes, token: "3" });
    expect(setNfts).toHaveBeenCalledWith([]);
  });
});
