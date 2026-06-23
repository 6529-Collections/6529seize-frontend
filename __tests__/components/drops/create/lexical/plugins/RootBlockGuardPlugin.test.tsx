import { render } from "@testing-library/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";

import RootBlockGuardPlugin from "@/components/drops/create/lexical/plugins/RootBlockGuardPlugin";
import { $ensureRootBlockSelection } from "@/components/drops/create/lexical/utils/rootContent";

type CommandHandler = () => boolean;

let commandHandlers = new Map<unknown, CommandHandler>();

const registerCommandMock = jest.fn(
  (command: unknown, handler: CommandHandler) => {
    commandHandlers.set(command, handler);
    return jest.fn();
  }
);
const updateMock = jest.fn((callback: () => void) => callback());

const editor = {
  registerCommand: registerCommandMock,
  update: updateMock,
} as const;

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock("lexical", () => ({
  COMMAND_PRIORITY_CRITICAL: 4,
  INDENT_CONTENT_COMMAND: "INDENT_CONTENT_COMMAND",
  KEY_TAB_COMMAND: "KEY_TAB_COMMAND",
  OUTDENT_CONTENT_COMMAND: "OUTDENT_CONTENT_COMMAND",
}));

jest.mock("@/components/drops/create/lexical/utils/rootContent", () => ({
  $ensureRootBlockSelection: jest.fn(),
}));

const getCommandHandler = (command: unknown): CommandHandler => {
  const handler = commandHandlers.get(command);
  if (!handler) {
    throw new Error(`Command handler not registered for ${String(command)}`);
  }
  return handler;
};

describe("RootBlockGuardPlugin", () => {
  beforeEach(() => {
    commandHandlers = new Map();
    registerCommandMock.mockClear();
    updateMock.mockClear();
    ($ensureRootBlockSelection as jest.Mock).mockReset();
    ($ensureRootBlockSelection as jest.Mock).mockReturnValue(false);
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
  });

  it("registers tab and indent guards with critical priority", () => {
    render(<RootBlockGuardPlugin />);

    expect(registerCommandMock).toHaveBeenCalledWith(
      KEY_TAB_COMMAND,
      expect.any(Function),
      COMMAND_PRIORITY_CRITICAL
    );
    expect(registerCommandMock).toHaveBeenCalledWith(
      INDENT_CONTENT_COMMAND,
      expect.any(Function),
      COMMAND_PRIORITY_CRITICAL
    );
    expect(registerCommandMock).toHaveBeenCalledWith(
      OUTDENT_CONTENT_COMMAND,
      expect.any(Function),
      COMMAND_PRIORITY_CRITICAL
    );
  });

  it("normalizes root content on mount", () => {
    render(<RootBlockGuardPlugin />);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect($ensureRootBlockSelection).toHaveBeenCalledTimes(1);
  });

  it("swallows commands only when a root selection was normalized", () => {
    render(<RootBlockGuardPlugin />);
    ($ensureRootBlockSelection as jest.Mock).mockClear();

    ($ensureRootBlockSelection as jest.Mock).mockReturnValue(false);
    expect(getCommandHandler(KEY_TAB_COMMAND)()).toBe(false);

    ($ensureRootBlockSelection as jest.Mock).mockReturnValue(true);
    expect(getCommandHandler(KEY_TAB_COMMAND)()).toBe(true);
  });
});
