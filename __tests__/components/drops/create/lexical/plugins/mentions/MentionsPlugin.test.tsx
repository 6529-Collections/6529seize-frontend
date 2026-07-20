import React, { createRef } from "react";
import { render, act } from "@testing-library/react";
import NewMentionsPlugin, {
  MentionTypeaheadOption,
} from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";

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
jest.mock("@/hooks/useMentionAliases", () => ({
  useMentionAliases: jest.fn(),
}));

jest.mock("@/components/drops/create/lexical/nodes/MentionNode", () => ({
  $createMentionNode: jest.fn(() => ({
    replace: jest.fn(),
    select: jest.fn(),
  })),
  $isMentionNode: jest.fn(() => false),
}));
jest.mock("@/components/drops/create/lexical/nodes/GroupMentionNode", () => ({
  $createGroupMentionNode: jest.fn(() => ({
    replace: jest.fn(),
    select: jest.fn(),
  })),
}));

const { useIdentitiesSearch } = require("@/hooks/useIdentitiesSearch");
const { useMentionAliases } = require("@/hooks/useMentionAliases");
const {
  $createMentionNode,
} = require("@/components/drops/create/lexical/nodes/MentionNode");
const {
  $createGroupMentionNode,
} = require("@/components/drops/create/lexical/nodes/GroupMentionNode");

describe("MentionsPlugin", () => {
  beforeEach(() => {
    (useMentionAliases as jest.Mock).mockReturnValue({ aliases: [] });
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
    expect($createMentionNode).toHaveBeenCalledWith(
      `@${option.handle}`,
      option.id
    );
    expect(onSelect).toHaveBeenCalledWith({
      mentioned_profile_id: option.id,
      handle_in_content: option.handle,
    });
    expect(close).toHaveBeenCalled();
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

  it.each([
    ["CON", "@contributors", "CONTRIBUTORS"],
    ["ADM", "@admins", "ADMINS"],
    ["DEV", "@devs6529", "DEVS_6529"],
  ])(
    "offers %s global mentions to chat participants",
    (query, token, group) => {
      (useIdentitiesSearch as jest.Mock).mockReturnValue({ identities: [] });
      const onSelectGroupMention = jest.fn();
      render(
        <NewMentionsPlugin
          waveId="w1"
          onSelect={jest.fn()}
          onSelectGroupMention={onSelectGroupMention}
          ref={createRef()}
        />
      );

      act(() => capturedProps.onQueryChange(query));
      const option = capturedProps.options[0];
      act(() => capturedProps.onSelectOption(option, null, jest.fn()));

      expect(option.handle).toBe(token);
      expect($createGroupMentionNode).toHaveBeenCalledWith(token);
      expect(onSelectGroupMention).toHaveBeenCalledWith(group);
    }
  );

  it("adds case-insensitive personal shortcut options", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({ identities: [] });
    (useMentionAliases as jest.Mock).mockReturnValue({
      aliases: [
        {
          id: "alias-1",
          alias: "frens",
          members: [
            { profile_id: "1", handle: "alice", pfp: null },
            { profile_id: "2", handle: "bob", pfp: null },
          ],
        },
      ],
    });

    render(
      <NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={createRef()} />
    );
    expect(capturedProps.options).toHaveLength(0);

    act(() => capturedProps.onQueryChange("FRE"));

    expect(capturedProps.options).toHaveLength(1);
    expect(capturedProps.options[0]).toEqual(
      expect.objectContaining({
        type: "alias",
        handle: "@frens",
        display: "Mention shortcut · 2 profiles",
      })
    );
  });

  it("keeps an exact profile match visible when its handle collides with an alias", () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [
        { id: "1", handle: "frens-one", display: null, pfp: null },
        { id: "2", handle: "frens-two", display: null, pfp: null },
        { id: "3", handle: "frens-three", display: null, pfp: null },
        { id: "4", handle: "frens-four", display: null, pfp: null },
        { id: "5", handle: "frens", display: "Exact profile", pfp: null },
      ],
    });
    (useMentionAliases as jest.Mock).mockReturnValue({
      aliases: [
        {
          id: "alias-1",
          alias: "frens",
          members: [{ profile_id: "6", handle: "alice", pfp: null }],
        },
      ],
    });

    render(
      <NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={createRef()} />
    );
    act(() => capturedProps.onQueryChange("FRENS"));

    expect(capturedProps.options).toHaveLength(5);
    expect(capturedProps.options[0]).toEqual(
      expect.objectContaining({ type: "alias", handle: "@frens" })
    );
    expect(capturedProps.options[1]).toEqual(
      expect.objectContaining({ type: "identity", handle: "frens" })
    );
  });
});
