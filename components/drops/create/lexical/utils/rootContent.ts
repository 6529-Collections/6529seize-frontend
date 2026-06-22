import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  type ElementNode,
  type RootNode,
} from "lexical";

function isRootEndOffset(offset: number, childCount: number): boolean {
  return offset >= childCount;
}

function getElementAtRootOffset(
  root: RootNode,
  offset: number
): ElementNode | null {
  const children = root.getChildren();
  if (!children.length) {
    return null;
  }

  const candidate = children[offset];
  if ($isElementNode(candidate)) {
    return candidate;
  }

  return null;
}

function getElementForRootSelectionOffset(
  root: RootNode,
  offset: number
): ElementNode | null {
  const children = root.getChildren();
  const candidate = getElementAtRootOffset(root, offset);
  if (candidate) {
    return candidate;
  }

  if (isRootEndOffset(offset, children.length)) {
    const previousNode = children[offset - 1];
    if ($isElementNode(previousNode)) {
      return previousNode;
    }
  }

  return null;
}

function getLastElement(root: RootNode): ElementNode | null {
  const children = root.getChildren();
  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i];
    if ($isElementNode(child)) {
      return child;
    }
  }

  return null;
}

function insertParagraphAtRootOffset(
  root: RootNode,
  offset: number
): ElementNode {
  const paragraph = $createParagraphNode();
  const children = root.getChildren();
  const insertionIndex = Math.min(Math.max(offset, 0), children.length);
  const referenceNode = children[insertionIndex];

  if (referenceNode) {
    referenceNode.insertBefore(paragraph);
  } else {
    root.append(paragraph);
  }

  return paragraph;
}

export function $ensureRootHasBlock(root: RootNode = $getRoot()): ElementNode {
  const existingBlock = getLastElement(root);
  if (existingBlock) {
    return existingBlock;
  }

  return insertParagraphAtRootOffset(root, root.getChildrenSize());
}

export function $moveRootSelectionToBlock(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  let rootPoint: typeof selection.anchor | null = null;
  if ($isRootNode(selection.anchor.getNode())) {
    rootPoint = selection.anchor;
  } else if ($isRootNode(selection.focus.getNode())) {
    rootPoint = selection.focus;
  }
  if (!rootPoint) {
    return false;
  }

  const root = $getRoot();
  const childCount = root.getChildrenSize();
  const atEnd = isRootEndOffset(rootPoint.offset, childCount);
  const block =
    getElementForRootSelectionOffset(root, rootPoint.offset) ??
    insertParagraphAtRootOffset(root, rootPoint.offset);

  if (atEnd) {
    block.selectEnd();
  } else {
    block.selectStart();
  }

  return true;
}

export function $ensureRootBlockSelection(): boolean {
  $ensureRootHasBlock();
  return $moveRootSelectionToBlock();
}

export function $selectEndOfRootBlock(root: RootNode = $getRoot()): void {
  const rootEndOffset = root.getChildrenSize();
  const block =
    getElementForRootSelectionOffset(root, rootEndOffset) ??
    insertParagraphAtRootOffset(root, rootEndOffset);
  block.selectEnd();
}
