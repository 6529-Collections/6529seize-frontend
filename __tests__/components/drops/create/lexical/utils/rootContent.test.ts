import type * as RootContentModule from "@/components/drops/create/lexical/utils/rootContent";

type MockElementNode = {
  readonly kind: "element";
  readonly insertBefore: jest.Mock;
  readonly selectEnd: jest.Mock;
  readonly selectStart: jest.Mock;
};

type MockDecoratorNode = {
  readonly kind: "decorator";
  readonly insertBefore: jest.Mock;
};

type MockRootNode = {
  readonly kind: "root";
  children: MockLexicalNode[];
  readonly append: jest.Mock;
  readonly getChildren: jest.Mock;
  readonly getChildrenSize: jest.Mock;
};

type MockLexicalNode = MockDecoratorNode | MockElementNode | MockRootNode;

let mockRoot: MockRootNode;

const insertBeforeRootNode =
  (referenceNode: MockDecoratorNode | MockElementNode) =>
  (node: MockLexicalNode) => {
    const referenceIndex = mockRoot.children.indexOf(referenceNode);
    if (referenceIndex >= 0) {
      mockRoot.children.splice(referenceIndex, 0, node);
    }
    return node;
  };

const mockCreateElementNode = (): MockElementNode => {
  const node: MockElementNode = {
    kind: "element",
    insertBefore: jest.fn(),
    selectEnd: jest.fn(),
    selectStart: jest.fn(),
  };
  node.insertBefore.mockImplementation(insertBeforeRootNode(node));
  return node;
};

const mockCreateDecoratorNode = (): MockDecoratorNode => {
  const node: MockDecoratorNode = {
    kind: "decorator",
    insertBefore: jest.fn(),
  };
  node.insertBefore.mockImplementation(insertBeforeRootNode(node));
  return node;
};

const mockCreateRootNode = (): MockRootNode => {
  const root: MockRootNode = {
    kind: "root",
    children: [],
    append: jest.fn((node: MockLexicalNode) => {
      root.children.push(node);
      return root;
    }),
    getChildren: jest.fn(() => root.children),
    getChildrenSize: jest.fn(() => root.children.length),
  };
  return root;
};

mockRoot = mockCreateRootNode();
let mockSelection: unknown = null;
const mockCreateParagraphNode = jest.fn(
  (): MockElementNode => mockCreateElementNode()
);

jest.mock("lexical", () => ({
  $createParagraphNode: () => mockCreateParagraphNode(),
  $getRoot: () => mockRoot,
  $getSelection: () => mockSelection,
  $isElementNode: (node: MockLexicalNode | null | undefined) =>
    node?.kind === "element",
  $isRangeSelection: (
    selection: { readonly kind?: string } | null | undefined
  ) => selection?.kind === "range",
  $isRootNode: (node: MockLexicalNode | null | undefined) =>
    node?.kind === "root",
}));

const {
  $ensureRootBlockSelection,
  $ensureRootHasBlock,
  $moveRootSelectionToBlock,
  $selectEndOfRootBlock,
} = require(
  "@/components/drops/create/lexical/utils/rootContent"
) as typeof RootContentModule;

const createSelection = ({
  anchorNode = mockRoot,
  anchorOffset,
  focusNode = mockRoot,
  focusOffset = anchorOffset,
  isCollapsed = true,
}: {
  readonly anchorNode?: MockLexicalNode;
  readonly anchorOffset: number;
  readonly focusNode?: MockLexicalNode;
  readonly focusOffset?: number;
  readonly isCollapsed?: boolean;
}) => ({
  kind: "range",
  isCollapsed: jest.fn(() => isCollapsed),
  anchor: {
    offset: anchorOffset,
    getNode: jest.fn(() => anchorNode),
  },
  focus: {
    offset: focusOffset,
    getNode: jest.fn(() => focusNode),
  },
});

const createRootSelection = (offset: number, isCollapsed = true) => ({
  ...createSelection({ anchorOffset: offset, isCollapsed }),
});

describe("rootContent", () => {
  beforeEach(() => {
    mockRoot = mockCreateRootNode();
    mockSelection = null;
    mockCreateParagraphNode.mockClear();
  });

  it("seeds an empty root with a paragraph block", () => {
    const block = $ensureRootHasBlock();

    expect(mockCreateParagraphNode).toHaveBeenCalledTimes(1);
    expect(mockRoot.append).toHaveBeenCalledWith(block);
    expect(mockRoot.children).toEqual([block]);
  });

  it("reuses an existing root block", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];

    const block = $ensureRootHasBlock();

    expect(block).toBe(paragraph);
    expect(mockCreateParagraphNode).not.toHaveBeenCalled();
    expect(mockRoot.append).not.toHaveBeenCalled();
  });

  it("moves an end-of-root selection into the last block", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];
    mockSelection = createRootSelection(1);

    expect($moveRootSelectionToBlock()).toBe(true);
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
    expect(paragraph.selectStart).not.toHaveBeenCalled();
  });

  it("moves a start-of-root selection into the first block", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];
    mockSelection = createRootSelection(0);

    expect($moveRootSelectionToBlock()).toBe(true);
    expect(paragraph.selectStart).toHaveBeenCalledTimes(1);
    expect(paragraph.selectEnd).not.toHaveBeenCalled();
  });

  it("moves a non-collapsed root selection into a block", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];
    mockSelection = createRootSelection(1, false);

    expect($moveRootSelectionToBlock()).toBe(true);
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
  });

  it("moves a focus root selection when the anchor is inside a block", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];
    mockSelection = createSelection({
      anchorNode: paragraph,
      anchorOffset: 0,
      focusOffset: 1,
    });

    expect($moveRootSelectionToBlock()).toBe(true);
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
  });

  it("reports whether root block selection was normalized", () => {
    const paragraph = mockCreateElementNode();
    mockRoot.children = [paragraph];

    expect($ensureRootBlockSelection()).toBe(false);

    mockSelection = createRootSelection(1);

    expect($ensureRootBlockSelection()).toBe(true);
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
  });

  it("creates a paragraph when root selection has no block target", () => {
    mockRoot.children = [mockCreateDecoratorNode()];
    mockSelection = createRootSelection(1);

    expect($moveRootSelectionToBlock()).toBe(true);

    const paragraph = mockRoot.children[1] as MockElementNode;
    expect(mockCreateParagraphNode).toHaveBeenCalledTimes(1);
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
  });

  it("inserts a paragraph at decorator root offsets", () => {
    const beforeDecorator = mockCreateElementNode();
    const decorator = mockCreateDecoratorNode();
    mockRoot.children = [beforeDecorator, decorator];
    mockSelection = createRootSelection(1);

    expect($moveRootSelectionToBlock()).toBe(true);

    const insertedParagraph = mockRoot.children[1] as MockElementNode;
    expect(mockCreateParagraphNode).toHaveBeenCalledTimes(1);
    expect(decorator.insertBefore).toHaveBeenCalledWith(insertedParagraph);
    expect(beforeDecorator.selectStart).not.toHaveBeenCalled();
    expect(beforeDecorator.selectEnd).not.toHaveBeenCalled();
    expect(insertedParagraph.selectStart).toHaveBeenCalledTimes(1);
  });

  it("inserts a paragraph after trailing decorator root offsets", () => {
    const beforeDecorator = mockCreateElementNode();
    const decorator = mockCreateDecoratorNode();
    mockRoot.children = [beforeDecorator, decorator];
    mockSelection = createRootSelection(2);

    expect($moveRootSelectionToBlock()).toBe(true);

    const insertedParagraph = mockRoot.children[2] as MockElementNode;
    expect(mockCreateParagraphNode).toHaveBeenCalledTimes(1);
    expect(mockRoot.append).toHaveBeenCalledWith(insertedParagraph);
    expect(beforeDecorator.selectStart).not.toHaveBeenCalled();
    expect(beforeDecorator.selectEnd).not.toHaveBeenCalled();
    expect(insertedParagraph.selectEnd).toHaveBeenCalledTimes(1);
  });

  it("selects the end of a seeded paragraph after empty imports", () => {
    $selectEndOfRootBlock();

    const paragraph = mockRoot.children[0] as MockElementNode;
    expect(paragraph.selectEnd).toHaveBeenCalledTimes(1);
  });
});
