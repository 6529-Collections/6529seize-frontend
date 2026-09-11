import GroupCreateNfts from "@/components/groups/page/create/config/nfts/GroupCreateNfts";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
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
  match_mode: ApiGroupNftOwnershipMatchMode.AllTokens,
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
      {
        name: ApiGroupOwnsNftNameEnum.Memes,
        tokens: ["3"],
        match_mode: ApiGroupNftOwnershipMatchMode.AllTokens,
      },
    ]);

    setNfts.mockClear();
    selectedProps.onRemove({ name: ApiGroupOwnsNftNameEnum.Memes, token: "3" });
    expect(setNfts).toHaveBeenCalledWith([]);
  });

  it("preserves collection rules when removing a specific token", () => {
    const setNfts = jest.fn();
    renderComponent(
      [
        { name: ApiGroupOwnsNftNameEnum.Memes, tokens: ["3"] },
        { name: ApiGroupOwnsNftNameEnum.Gradients, tokens: [] },
      ],
      setNfts
    );

    selectedProps.onRemove({ name: ApiGroupOwnsNftNameEnum.Memes, token: "3" });

    expect(setNfts).toHaveBeenCalledWith([
      {
        name: ApiGroupOwnsNftNameEnum.Gradients,
        tokens: [],
        match_mode: ApiGroupNftOwnershipMatchMode.AllTokens,
      },
    ]);
  });

  it("removes a specific-token rule when search toggles off its last token", () => {
    const setNfts = jest.fn();
    renderComponent(
      [{ name: ApiGroupOwnsNftNameEnum.Memes, tokens: ["3"] }],
      setNfts
    );

    selectProps.onSelect({ id: "3", contract: MEMES_CONTRACT } as any);

    expect(setNfts).toHaveBeenCalledWith([]);
  });

  it("updates token ownership match mode", () => {
    const setNfts = jest.fn();
    renderComponent(
      [{ name: ApiGroupOwnsNftNameEnum.Memes, tokens: ["3"] }],
      setNfts
    );

    selectedProps.onMatchModeChange({
      name: ApiGroupOwnsNftNameEnum.Memes,
      matchMode: ApiGroupNftOwnershipMatchMode.AnyToken,
    });

    expect(setNfts).toHaveBeenCalledWith([
      {
        name: ApiGroupOwnsNftNameEnum.Memes,
        tokens: ["3"],
        match_mode: ApiGroupNftOwnershipMatchMode.AnyToken,
      },
    ]);
  });
});
