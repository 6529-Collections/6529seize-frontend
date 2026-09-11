import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import NewHashtagsPlugin, {
  HashtagsTypeaheadOption,
} from "@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import HashtagsTypeaheadMenuItem from "@/components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenuItem";
import { getPossibleQueryMatch } from "@/components/drops/create/lexical/plugins/hashtags/getPossibleQueryMatch";

const mockEditor = {
  update: jest.fn((fn: any) => fn()),
};

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

let capturedProps: any;
jest.mock("@lexical/react/LexicalTypeaheadMenuPlugin", () => ({
  LexicalTypeaheadMenuPlugin: (props: any) => {
    capturedProps = props;
    return <div data-testid="lexical" />;
  },
  MenuOption: class MockMenuOption {},
  useBasicTypeaheadTriggerMatch: () => () => null,
}));

jest.mock(
  "@/components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenu",
  () => () => <div data-testid="menu" />
);
jest.mock("@/components/drops/create/lexical/nodes/HashtagNode", () => ({
  $createHashtagNode: jest.fn(),
}));
jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useTokenMetadataQuery: jest.fn(),
}));

const {
  $createHashtagNode,
} = require("@/components/drops/create/lexical/nodes/HashtagNode");
const { useTokenMetadataQuery } = require("@/hooks/useAlchemyNftQueries");

beforeEach(() => {
  capturedProps = null;
  jest.clearAllMocks();
  (useTokenMetadataQuery as jest.Mock).mockReturnValue({ data: [] });
});

test("renders without crashing", () => {
  render(<NewHashtagsPlugin onSelect={jest.fn()} />);
  expect(capturedProps).not.toBeNull();
});

test("getPossibleQueryMatch finds hashtag info", () => {
  const match = getPossibleQueryMatch(" $hello");
  expect(match).toEqual({
    leadOffset: 1,
    matchingString: "hello",
    replaceableString: "$hello",
  });
});

test("requires a complete contract and numeric token id", () => {
  const contract = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
  render(<NewHashtagsPlugin onSelect={jest.fn()} />);

  act(() => {
    capturedProps.onQueryChange(`${contract}:`);
  });

  expect(useTokenMetadataQuery).toHaveBeenLastCalledWith({
    tokens: [],
    enabled: false,
  });
  expect(capturedProps.options).toEqual([]);
});

test("resolves a complete reference through the internal metadata query", () => {
  const contract = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
  (useTokenMetadataQuery as jest.Mock).mockReturnValue({
    data: [
      {
        tokenId: 1n,
        tokenIdRaw: "1",
        contract,
        name: "The Memes #1",
        imageUrl: "meme-1.png",
        collectionName: "The Memes",
        isSpam: false,
      },
    ],
  });
  render(<NewHashtagsPlugin onSelect={jest.fn()} />);

  act(() => {
    capturedProps.onQueryChange(`${contract}:1`);
  });

  expect(useTokenMetadataQuery).toHaveBeenLastCalledWith({
    tokens: [{ contract, tokenId: "1" }],
    enabled: true,
  });
  expect(capturedProps.options).toHaveLength(1);
  expect(capturedProps.options[0]).toEqual(
    expect.objectContaining({
      contract,
      tokenId: "1",
      name: "The Memes #1",
      picture: "meme-1.png",
      collectionName: "The Memes",
    })
  );
});

test("HashtagsTypeaheadOption creates option correctly", () => {
  const option = new HashtagsTypeaheadOption({
    contract: "0x1234567890123456789012345678901234567890",
    tokenId: "1",
    name: "Test NFT",
    picture: "test.jpg",
    collectionName: "Test Collection",
  });

  expect(option.contract).toBe("0x1234567890123456789012345678901234567890");
  expect(option.tokenId).toBe("1");
  expect(option.name).toBe("Test NFT");
  expect(option.picture).toBe("test.jpg");
  expect(option.collectionName).toBe("Test Collection");
});

test("keeps editor focus while selecting an NFT suggestion with the mouse", () => {
  const onClick = jest.fn();

  render(
    <ul>
      <HashtagsTypeaheadMenuItem
        index={0}
        isSelected
        onClick={onClick}
        onMouseEnter={jest.fn()}
        name="Test NFT"
        picture="https://example.com/nft.png"
        collectionName="Test Collection"
        tokenId="1"
        setRefElement={jest.fn()}
      />
    </ul>
  );

  const button = screen.getByRole("button", { name: /Test NFT/i });
  expect(screen.getByRole("img", { name: "NFT Test NFT" })).toHaveAttribute(
    "src",
    "https://example.com/nft.png"
  );
  expect(screen.getByText("Test Collection · #1")).toBeInTheDocument();
  expect(button.closest("li")).not.toBeNull();
  expect(fireEvent.mouseDown(button)).toBe(false);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("selection creates an editor node containing the NFT identity", () => {
  const mentionNode = { select: jest.fn() };
  ($createHashtagNode as jest.Mock).mockReturnValue(mentionNode);
  const contract = "0x1234567890123456789012345678901234567890";
  const onSelect = jest.fn();
  (useTokenMetadataQuery as jest.Mock).mockReturnValue({
    data: [
      {
        tokenId: 42n,
        tokenIdRaw: "42",
        contract,
        name: "Test NFT",
        imageUrl: null,
        collectionName: "Collection",
        isSpam: false,
      },
    ],
  });
  render(<NewHashtagsPlugin onSelect={onSelect} />);

  act(() => {
    capturedProps.onQueryChange(`${contract}:42`);
  });
  const nodeToReplace = { replace: jest.fn() };
  const closeMenu = jest.fn();
  act(() => {
    capturedProps.onSelectOption(
      capturedProps.options[0],
      nodeToReplace,
      closeMenu
    );
  });

  expect($createHashtagNode).toHaveBeenCalledWith("$Test NFT", {
    contract,
    token: "42",
    name: "Test NFT",
  });
  expect(nodeToReplace.replace).toHaveBeenCalledWith(mentionNode);
  expect(mentionNode.select).toHaveBeenCalled();
  expect(onSelect).toHaveBeenCalledWith({
    contract,
    token: "42",
    name: "Test NFT",
  });
  expect(closeMenu).toHaveBeenCalled();
});
