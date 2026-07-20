import React, { createRef } from "react";
import { render, act } from "@testing-library/react";
import NewMentionsPlugin, {
  MentionTypeaheadOption,
} from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";
import { MentionSearchScopeProvider } from "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext";

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [{ update: (fn: any) => fn() }],
}));

let capturedProps: any;
jest.mock("@lexical/react/LexicalTypeaheadMenuPlugin", () => ({
  LexicalTypeaheadMenuPlugin: (props: any) => {
    capturedProps = props;
    return <div data-testid="typeahead" />;
  },
  MenuOption: class {},
  useBasicTypeaheadTriggerMatch: () => jest.fn(),
}));

jest.mock("@/hooks/useIdentitiesSearch", () => ({
  IDENTITY_SEARCH_MIN_HANDLE_LENGTH: 3,
  useIdentitiesSearch: jest.fn(),
}));

jest.mock("@/components/drops/create/lexical/nodes/MentionNode", () => ({
  $createMentionNode: jest.fn(() => ({
    replace: jest.fn(),
    select: jest.fn(),
  })),
}));
jest.mock("@/components/drops/create/lexical/nodes/GroupMentionNode", () => ({
  $createGroupMentionNode: jest.fn(() => ({
    replace: jest.fn(),
    select: jest.fn(),
  })),
}));

const { useIdentitiesSearch } = require("@/hooks/useIdentitiesSearch");
const {
  $createMentionNode,
} = require("@/components/drops/create/lexical/nodes/MentionNode");
const {
  $createGroupMentionNode,
} = require("@/components/drops/create/lexical/nodes/GroupMentionNode");

describe("MentionsPlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds options from identities and exposes open state", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [{ id: "1", handle: "alice", display: "Alice", pfp: null }],
    });
    const ref = createRef<any>();
    render(<NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={ref} />);
    expect(capturedProps.options).toHaveLength(1);
    expect(capturedProps.options[0]).toBeInstanceOf(MentionTypeaheadOption);
    expect(capturedProps.anchorClassName).toBe("tailwind-scope tw-z-[1020]");

    act(() => {
      capturedProps.onOpen();
    });
    expect(ref.current.isMentionsOpen()).toBe(true);
    act(() => {
      capturedProps.onClose();
    });
    expect(ref.current.isMentionsOpen()).toBe(false);
  });

  it("calls onSelect with mention info", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [{ id: "1", handle: "alice", display: "Alice", pfp: null }],
    });
    const onSelect = jest.fn();
    render(
      <NewMentionsPlugin waveId="w1" onSelect={onSelect} ref={createRef()} />
    );
    const option = capturedProps.options[0];
    const close = jest.fn();
    act(() => {
      capturedProps.onSelectOption(option, null, close);
    });
    expect($createMentionNode).toHaveBeenCalledWith(`@${option.handle}`);
    expect(onSelect).toHaveBeenCalledWith({
      mentioned_profile_id: option.id,
      handle_in_content: option.handle,
    });
    expect(close).toHaveBeenCalled();
  });

  it("passes the draft visibility group to identity search", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({ identities: [] });

    render(
      <MentionSearchScopeProvider visibilityGroupId="visibility-group">
        <NewMentionsPlugin
          waveId={null}
          onSelect={jest.fn()}
          ref={createRef()}
        />
      </MentionSearchScopeProvider>
    );

    expect(useIdentitiesSearch).toHaveBeenCalledWith({
      draftScope: {
        kind: "group",
        visibilityGroupId: "visibility-group",
      },
      handle: "",
      waveId: null,
    });
  });

  it("uses an explicit disabled draft scope without a provider", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({ identities: [] });

    render(
      <NewMentionsPlugin waveId={null} onSelect={jest.fn()} ref={createRef()} />
    );

    expect(useIdentitiesSearch).toHaveBeenCalledWith({
      draftScope: { kind: "disabled" },
      handle: "",
      waveId: null,
    });
  });

  it("renders the menu wrapper on the raised typeahead layer", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [{ id: "1", handle: "alice", display: "Alice", pfp: null }],
    });

    render(
      <NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={createRef()} />
    );

    const portal = capturedProps.menuRenderFn(
      { current: document.createElement("div") },
      {
        selectedIndex: null,
        selectOptionAndCleanUp: jest.fn(),
        setHighlightedIndex: jest.fn(),
      }
    ) as React.ReactPortal | null;
    const wrapper = portal?.children;

    expect(React.isValidElement<{ className: string }>(wrapper)).toBe(true);
    if (!React.isValidElement<{ className: string }>(wrapper)) {
      throw new Error("Expected mention typeahead menu wrapper element");
    }
    expect(wrapper.props.className).toContain("tw-z-[1020]");
  });

  it("adds @all option for admins and emits group mention", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [],
    });
    const onSelectGroupMention = jest.fn();
    render(
      <NewMentionsPlugin
        waveId="w1"
        onSelect={jest.fn()}
        onSelectGroupMention={onSelectGroupMention}
        canMentionAll={true}
        ref={createRef()}
      />
    );
    expect(capturedProps.options).toHaveLength(0);

    act(() => {
      capturedProps.onQueryChange("a");
    });
    expect(capturedProps.options).toHaveLength(0);

    act(() => {
      capturedProps.onQueryChange("al");
    });
    expect(capturedProps.options).toHaveLength(0);

    act(() => {
      capturedProps.onQueryChange("all");
    });
    const option = capturedProps.options[0];
    const close = jest.fn();

    act(() => {
      capturedProps.onSelectOption(option, null, close);
    });

    expect(option.handle).toBe("@all");
    expect($createGroupMentionNode).toHaveBeenCalledWith("@all");
    expect(onSelectGroupMention).toHaveBeenCalledWith("ALL");
    expect(close).toHaveBeenCalled();
  });
});
