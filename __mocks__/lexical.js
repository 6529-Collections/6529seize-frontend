class LexicalNode {
  constructor(key) {
    this.__key = key;
  }
  getKey() { return this.__key; }
  getType() { return 'text'; }
  createDOM() { return document.createElement('span'); }
  updateDOM() { return false; }
  exportJSON() { return { key: this.__key, type: this.getType() }; }
  static importJSON() { return new this(); }
  static getType() { return 'text'; }
  setFormat() { return this; }
  setDetail() { return this; }
  setMode() { return this; }
  setStyle() { return this; }
  toggleDirectionless() { return this; }
}

class TextNode extends LexicalNode {
  constructor(text = "", key) {
    super(key);
    this.__text = text;
  }
  exportJSON() { return { text: this.__text, type: "text" }; }
  setTextContent(text) { this.__text = text; return this; }
  getTextContent() { return this.__text; }
  static getType() { return 'text'; }
}

class ElementNode extends LexicalNode {
  constructor(key) {
    super(key);
    this.__children = [];
  }
  append(...nodesToAppend) {
    this.__children.push(...nodesToAppend);
    return this;
  }
  getChildren() { return this.__children; }
  getChildrenSize() { return this.__children.length; }
  isEmpty() { return this.__children.length === 0; }
  static getType() { return 'element'; }
}

class RootNode extends ElementNode {
  static getType() { return 'root'; }
}

class ParagraphNode extends ElementNode {
  static getType() { return 'paragraph'; }
}

class LineBreakNode extends LexicalNode {
  static getType() { return 'linebreak'; }
}

class DecoratorNode extends LexicalNode {
  static getType() { return 'decorator'; }
}

// Mock command creation
const mockCommands = new Map();
function createCommand(type) {
  if (!mockCommands.has(type)) {
    mockCommands.set(type, { type });
  }
  return mockCommands.get(type);
}

// Mock editor state
class EditorState {
  constructor() {
    this._nodeMap = new Map();
  }
  read(fn) { return fn && fn(); }
  clone() { return new EditorState(); }
  toJSON() { return {}; }
}

// Mock lexical editor
class LexicalEditor {
  constructor() {
    this._editorState = new EditorState();
  }
  getEditorState() { return this._editorState; }
  setEditorState() {}
  update(fn) { fn && fn(); }
  registerCommand() { return () => {}; }
  registerUpdateListener() { return () => {}; }
  registerEditableListener() { return () => {}; }
  registerDecoratorListener() { return () => {}; }
  registerTextContentListener() { return () => {}; }
  registerRootListener() { return () => {}; }
  registerNodeTransform() { return () => {}; }
  hasNodes() { return true; }
  dispatchCommand() {}
  focus() {}
  blur() {}
  isEditable() { return true; }
  setEditable() {}
}

module.exports = {
  TextNode,
  ElementNode,
  RootNode,
  ParagraphNode,
  LineBreakNode,
  DecoratorNode,
  LexicalNode,
  EditorState,
  LexicalEditor,
  createCommand,
  createEditor: () => new LexicalEditor(),
  $applyNodeReplacement: (node) => node,
  $createTextNode: (text) => new TextNode(text),
  $createParagraphNode: () => new ParagraphNode(),
  $createLineBreakNode: () => new LineBreakNode(),
  $getRoot: () => new RootNode(),
  $getSelection: () => null,
  $setSelection: () => {},
  $isNodeSelection: () => false,
  $isRangeSelection: () => false,
  $isTextNode: (node) => node instanceof TextNode,
  $isParagraphNode: (node) => node instanceof ParagraphNode,
  $isElementNode: (node) => node instanceof ElementNode,
  $isRootNode: (node) => node instanceof RootNode,
  $isDecoratorNode: (node) => node instanceof DecoratorNode,
  $isLineBreakNode: (node) => node instanceof LineBreakNode,
  $nodesOfType: () => [],
  KEY_ARROW_DOWN_COMMAND: createCommand('KEY_ARROW_DOWN_COMMAND'),
  KEY_ARROW_UP_COMMAND: createCommand('KEY_ARROW_UP_COMMAND'),
  KEY_ENTER_COMMAND: createCommand('KEY_ENTER_COMMAND'),
  KEY_ESCAPE_COMMAND: createCommand('KEY_ESCAPE_COMMAND'),
  KEY_TAB_COMMAND: createCommand('KEY_TAB_COMMAND'),
  SELECTION_CHANGE_COMMAND: createCommand('SELECTION_CHANGE_COMMAND'),
  FORMAT_TEXT_COMMAND: createCommand('FORMAT_TEXT_COMMAND'),
  UNDO_COMMAND: createCommand('UNDO_COMMAND'),
  REDO_COMMAND: createCommand('REDO_COMMAND'),
  CUT_COMMAND: createCommand('CUT_COMMAND'),
  COPY_COMMAND: createCommand('COPY_COMMAND'),
  PASTE_COMMAND: createCommand('PASTE_COMMAND'),
  COMMAND_PRIORITY_LOW: 0,
  COMMAND_PRIORITY_NORMAL: 1,
  COMMAND_PRIORITY_HIGH: 2,
  COMMAND_PRIORITY_CRITICAL: 3,
  COMMAND_PRIORITY_EDITOR: 4,
};
