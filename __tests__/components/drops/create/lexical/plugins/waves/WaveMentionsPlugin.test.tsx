import React, { createRef } from "react";
import { act, render } from "@testing-library/react";
import NewWaveMentionsPlugin, {
  WaveMentionTypeaheadOption,
} from "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin";

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [{ update: (fn: () => void) => fn() }],
}));

let capturedProps: any;
jest.mock("@lexical/react/LexicalTypeaheadMenuPlugin", () => ({
  LexicalTypeaheadMenuPlugin: (props: any) => {
    capturedProps = props;
    return <div data-testid="typeahead" />;
  },
  MenuOption: class {
    key: string;
    ref: { current: HTMLElement | null };

    constructor(key: string) {
      this.key = key;
      this.ref = { current: null };
    }

    setRefElement = (element: HTMLElement | null) => {
      this.ref.current = element;
    };
  },
  useBasicTypeaheadTriggerMatch: () => jest.fn(() => null),
}));

jest.mock("@/hooks/useWavesSearch", () => ({
  useWavesSearch: jest.fn(),
}));

jest.mock("@/components/drops/create/lexical/nodes/WaveMentionNode", () => ({
  $createWaveMentionNode: jest.fn(),
}));

jest.mock(
  "@/components/drops/create/lexical/utils/codeContextDetection",
  () => ({
    isInCodeContext: jest.fn(() => false),
  })
);

const { useWavesSearch } = require("@/hooks/useWavesSearch");
const {
  $createWaveMentionNode,
} = require("@/components/drops/create/lexical/nodes/WaveMentionNode");

describe("WaveMentionsPlugin", () => {
  beforeEach(() => {
    capturedProps = null;
    jest.clearAllMocks();
  });

  it("builds options from waves and exposes open state", () => {
    (useWavesSearch as jest.Mock).mockReturnValue({
      waves: [
        { id: "wave-1", name: "Wave Alpha", picture: null },
        { id: "wave-2", name: "Wave Beta", picture: null },
      ],
    });

    const ref = createRef<any>();
    render(<NewWaveMentionsPlugin onSelect={jest.fn()} ref={ref} />);

    expect(capturedProps.options).toHaveLength(2);
    expect(capturedProps.options[0]).toBeInstanceOf(WaveMentionTypeaheadOption);

    act(() => {
      capturedProps.onOpen();
    });
    expect(ref.current.isWaveMentionsOpen()).toBe(true);

    act(() => {
      capturedProps.onClose();
    });
    expect(ref.current.isWaveMentionsOpen()).toBe(false);
  });

  it("creates wave mention node and emits sanitized mention payload", () => {
    (useWavesSearch as jest.Mock).mockReturnValue({
      waves: [{ id: "wave-1", name: "Brack]et Wave", picture: null }],
    });

    const mentionNode = {
      select: jest.fn(),
    };
    ($createWaveMentionNode as jest.Mock).mockReturnValue(mentionNode);

    const onSelect = jest.fn();
    render(<NewWaveMentionsPlugin onSelect={onSelect} ref={createRef()} />);

    const closeMenu = jest.fn();
    const nodeToReplace = {
      replace: jest.fn(),
    };

    act(() => {
      capturedProps.onSelectOption(
        capturedProps.options[0],
        nodeToReplace,
        closeMenu
      );
    });

    expect($createWaveMentionNode).toHaveBeenCalledWith("#Bracket Wave");
    expect(nodeToReplace.replace).toHaveBeenCalledWith(mentionNode);
    expect(mentionNode.select).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith({
      wave_id: "wave-1",
      wave_name_in_content: "Bracket Wave",
    });
    expect(closeMenu).toHaveBeenCalled();
  });
});
