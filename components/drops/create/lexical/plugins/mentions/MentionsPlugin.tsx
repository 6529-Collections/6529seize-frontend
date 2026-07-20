"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  $createTextNode,
  $getRoot,
  $isTextNode,
  type LexicalEditor,
  type EditorState,
  type LexicalNode,
  type TextNode,
} from "lexical";
import {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as ReactDOM from "react-dom";

import { $createGroupMentionNode } from "@/components/drops/create/lexical/nodes/GroupMentionNode";
import {
  $createMentionNode,
  $isMentionNode,
} from "@/components/drops/create/lexical/nodes/MentionNode";
import MentionsTypeaheadMenu from "./MentionsTypeaheadMenu";
import type { MentionedUser } from "@/entities/IDrop";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import {
  IDENTITY_SEARCH_MIN_HANDLE_LENGTH,
  useIdentitiesSearch,
} from "@/hooks/useIdentitiesSearch";
import { isInCodeContext } from "@/components/drops/create/lexical/utils/codeContextDetection";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type {
  MentionAlias,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import { $isCodeNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { AuthContext } from "@/components/auth/Auth";
import { GROUP_MENTION_TEXT } from "@/helpers/waves/drop-group-mentions";

const AtSignMentionsRegex =
  /(^|\s|\()([@]((?:[^@\.,\+\*\?\$\|#{}\(\)\^\-\[\]\\/!%'"~=<>_:;\s](?:\.[ |$]| |[\.,\+\*\?\$\@\|#{}\(\)\^\-\[\]\\/!%'"~=<>_:;]|)){0,75}))$/;

const AtSignMentionsRegexAliasRegex =
  /(^|\s|\()([@]((?:[^@\.,\+\*\?\$\|#{}\(\)\^\-\[\]\\/!%'"~=<>_:;\s]){0,50}))$/;

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;
// Keep mentions above single-drop mobile chat menus/dialogs while below global modal layers.
const TYPEAHEAD_ANCHOR_CLASS_NAME = "tailwind-scope tw-z-[1020]";
const TYPEAHEAD_MENU_WRAPPER_CLASS_NAME =
  "tw-absolute -tw-top-12 tw-left-0 tw-z-[1020]";

function checkForAtSignMentions(
  text: string,
  minMatchLength: number
): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);

  match ??= AtSignMentionsRegexAliasRegex.exec(text);
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1] ?? "";

    const matchingString = match[3] ?? "";
    const replaceableString = match[2] ?? "";
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString,
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 0);
}

export class MentionTypeaheadOption extends MenuOption {
  type: "identity" | "group" | "alias";
  id: string | null;
  handle: string;
  display: string | null;
  picture: string | null;
  members: MentionAliasMember[];

  constructor({
    id,
    handle,
    display,
    picture,
    type = "identity",
    members = [],
  }: {
    id: string | null;
    handle: string;
    display: string | null;
    picture: string | null;
    type?: "identity" | "group" | "alias" | undefined;
    members?: MentionAliasMember[] | undefined;
  }) {
    super(handle);
    this.type = type;
    this.id = id;
    this.handle = handle;
    this.display = display;
    this.picture = picture;
    this.members = members;
  }
}

export interface NewMentionsPluginHandles {
  readonly isMentionsOpen: () => boolean;
  readonly expandMentionAliases: () => Promise<MentionAliasExpansionResult>;
}

export interface MentionAliasExpansionResult {
  readonly completed: boolean;
  readonly editorState: EditorState;
}

const ALIAS_TOKEN_PATTERN = /(^|[^\w@])@(\w{3,15})(?=$|[^\w@])/g;

const isInsideCodeOrLink = (node: LexicalNode): boolean => {
  let parent = node.getParent();
  while (parent) {
    if ($isCodeNode(parent) || $isLinkNode(parent)) {
      return true;
    }
    parent = parent.getParent();
  }
  return false;
};

const toMentionedUser = (member: MentionAliasMember) => ({
  mentioned_profile_id: member.profile_id,
  handle_in_content: member.handle,
});

const getExistingMentionHandles = (): Set<string> =>
  new Set(
    $getRoot()
      .getAllTextNodes()
      .filter($isMentionNode)
      .map((node) => node.getTextContent().replace(/^@/, "").toLowerCase())
  );

const createAliasMemberNodes = ({
  members,
  existingHandles,
  onSelect,
}: {
  readonly members: MentionAliasMember[];
  readonly existingHandles: Set<string>;
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): TextNode[] => {
  const nodes: TextNode[] = [];
  for (const member of members) {
    const normalizedHandle = member.handle.toLowerCase();
    if (existingHandles.has(normalizedHandle)) continue;
    if (nodes.length > 0) nodes.push($createTextNode(" "));
    nodes.push($createMentionNode(`@${member.handle}`, member.profile_id));
    existingHandles.add(normalizedHandle);
    onSelect(toMentionedUser(member));
  }
  return nodes;
};

const replaceTextNode = (
  nodeToReplace: TextNode,
  replacementNodes: TextNode[]
): TextNode => {
  const nodes = replacementNodes.length
    ? replacementNodes
    : [$createTextNode(nodeToReplace.getTextContent())];
  nodeToReplace.replace(nodes[0]!);
  let lastNode = nodes[0]!;
  for (const node of nodes.slice(1)) {
    lastNode.insertAfter(node);
    lastNode = node;
  }
  return lastNode;
};

export const insertAliasMembers = ({
  nodeToReplace,
  members,
  existingHandles,
  onSelect,
}: {
  readonly nodeToReplace: TextNode;
  readonly members: MentionAliasMember[];
  readonly existingHandles: Set<string>;
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): TextNode =>
  replaceTextNode(
    nodeToReplace,
    createAliasMemberNodes({ members, existingHandles, onSelect })
  );

const buildAliasReplacementNodes = ({
  text,
  aliasesByName,
  existingHandles,
  onSelect,
}: {
  readonly text: string;
  readonly aliasesByName: ReadonlyMap<string, MentionAlias>;
  readonly existingHandles: Set<string>;
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): { readonly expanded: boolean; readonly nodes: TextNode[] } => {
  const replacementNodes: TextNode[] = [];
  let expanded = false;
  let cursor = 0;
  for (const match of text.matchAll(ALIAS_TOKEN_PATTERN)) {
    const fullMatch = match[0];
    const prefix = match[1] ?? "";
    const aliasName = (match[2] ?? "").toLowerCase();
    const alias = aliasesByName.get(aliasName);
    if (!alias) continue;
    expanded = true;
    const matchStart = match.index;
    const tokenStart = matchStart + prefix.length;
    if (tokenStart > cursor) {
      replacementNodes.push($createTextNode(text.slice(cursor, tokenStart)));
    }
    const memberNodes = createAliasMemberNodes({
      members: alias.members,
      existingHandles,
      onSelect,
    });
    replacementNodes.push(
      ...(memberNodes.length
        ? memberNodes
        : [$createTextNode(fullMatch.slice(prefix.length))])
    );
    cursor = matchStart + fullMatch.length;
  }
  if (expanded && cursor < text.length) {
    replacementNodes.push($createTextNode(text.slice(cursor)));
  }
  return { expanded, nodes: replacementNodes };
};

const expandAliasTextNodes = ({
  aliasesByName,
  existingHandles,
  onSelect,
}: {
  readonly aliasesByName: ReadonlyMap<string, MentionAlias>;
  readonly existingHandles: Set<string>;
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): boolean => {
  let expanded = false;
  const textNodes = $getRoot()
    .getAllTextNodes()
    .filter(
      (node) =>
        $isTextNode(node) && !$isMentionNode(node) && !isInsideCodeOrLink(node)
    );
  for (const textNode of textNodes) {
    const replacement = buildAliasReplacementNodes({
      text: textNode.getTextContent(),
      aliasesByName,
      existingHandles,
      onSelect,
    });
    if (!replacement.expanded) continue;
    expanded = true;
    replaceTextNode(textNode, replacement.nodes);
  }
  return expanded;
};

export const expandPlainAliasTokens = ({
  editor,
  aliases,
  onSelect,
}: {
  readonly editor: LexicalEditor;
  readonly aliases: MentionAlias[];
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): Promise<EditorState> => {
  if (aliases.length) {
    const aliasesByName = new Map(
      aliases.map((alias) => [alias.alias.toLowerCase(), alias])
    );
    editor.update(
      () => {
        expandAliasTextNodes({
          aliasesByName,
          existingHandles: getExistingMentionHandles(),
          onSelect,
        });
      },
      { discrete: true }
    );
  }
  return Promise.resolve(editor.getEditorState());
};

const NewMentionsPlugin = forwardRef<
  NewMentionsPluginHandles,
  {
    readonly waveId: string | null;
    readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
    readonly canMentionAll?: boolean | undefined;
    readonly onSelectGroupMention?:
      | ((group: ApiDropGroupMention) => void)
      | undefined;
  }
>(({ waveId, onSelect, canMentionAll = false, onSelectGroupMention }, ref) => {
  const [editor] = useLexicalComposerContext();
  const locale = useBrowserLocale();
  const [queryString, setQueryString] = useState<string | null>(null);
  const { identities } = useIdentitiesSearch({
    handle: queryString ?? "",
    waveId,
  });
  const { setToast } = useContext(AuthContext);
  const { aliases, enabled, isFetched, isError, refetch } = useMentionAliases();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(() => {
    const normalizedQuery = (queryString ?? "").toLowerCase();
    const groupOptions = [
      {
        group: ApiDropGroupMention.All,
        display: t(locale, "waves.composer.groupMentions.all"),
        allowed: canMentionAll,
      },
      {
        group: ApiDropGroupMention.Contributors,
        display: t(locale, "waves.composer.groupMentions.contributors"),
        allowed: true,
      },
      {
        group: ApiDropGroupMention.Admins,
        display: t(locale, "waves.composer.groupMentions.admins"),
        allowed: true,
      },
      {
        group: ApiDropGroupMention.Devs6529,
        display: t(locale, "waves.composer.groupMentions.devs6529"),
        allowed: true,
      },
    ]
      .filter(({ group, allowed }) => {
        const token = GROUP_MENTION_TEXT[group].slice(1);
        return (
          allowed &&
          normalizedQuery.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
          token.startsWith(normalizedQuery)
        );
      })
      .map(
        ({ group, display }) =>
          new MentionTypeaheadOption({
            id: group,
            handle: GROUP_MENTION_TEXT[group],
            display,
            picture: null,
            type: "group",
          })
      );
    const aliasOptions = aliases
      .filter(
        (alias) =>
          normalizedQuery.length > 0 &&
          alias.alias.toLowerCase().startsWith(normalizedQuery)
      )
      .map(
        (alias) =>
          new MentionTypeaheadOption({
            id: alias.id,
            handle: `@${alias.alias}`,
            display:
              alias.members.length === 1
                ? t(locale, "waves.composer.mentionShortcuts.optionOne")
                : t(locale, "waves.composer.mentionShortcuts.optionMany", {
                    count: alias.members.length,
                  }),
            picture: null,
            type: "alias",
            members: alias.members,
          })
      );
    const identityLimit = Math.max(
      0,
      SUGGESTION_LIST_LENGTH_LIMIT - groupOptions.length - aliasOptions.length
    );
    const identityOptions = identities
      .map(
        (identity) =>
          new MentionTypeaheadOption({
            id: identity.id,
            handle: identity.handle,
            display: identity.display,
            picture: identity.pfp,
          })
      )
      .sort((first, second) => {
        const firstIsExactMatch =
          first.handle.toLowerCase() === normalizedQuery;
        const secondIsExactMatch =
          second.handle.toLowerCase() === normalizedQuery;
        if (firstIsExactMatch === secondIsExactMatch) return 0;
        return firstIsExactMatch ? -1 : 1;
      })
      .slice(0, identityLimit);

    return [...groupOptions, ...aliasOptions, ...identityOptions].slice(
      0,
      SUGGESTION_LIST_LENGTH_LIMIT
    );
  }, [aliases, canMentionAll, identities, locale, queryString]);

  useImperativeHandle(
    ref,
    () => ({
      isMentionsOpen: () => isOpen && options.length > 0,
      expandMentionAliases: async () => {
        let aliasesForExpansion = aliases;
        if (enabled && (!isFetched || isError)) {
          const result = await refetch();
          if (result.error) {
            setToast({
              type: "error",
              title: t(
                locale,
                "waves.composer.mentionShortcuts.loadErrorTitle"
              ),
              message: t(
                locale,
                "waves.composer.mentionShortcuts.loadErrorMessage"
              ),
            });
            return {
              completed: false,
              editorState: editor.getEditorState(),
            };
          }
          aliasesForExpansion = result.data ?? [];
        }
        return {
          completed: true,
          editorState: await expandPlainAliasTokens({
            editor,
            aliases: aliasesForExpansion,
            onSelect,
          }),
        };
      },
    }),
    [
      aliases,
      editor,
      enabled,
      isError,
      isFetched,
      isOpen,
      locale,
      onSelect,
      options.length,
      refetch,
      setToast,
    ]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        if (selectedOption.type === "group") {
          const group = selectedOption.id as ApiDropGroupMention;
          const mentionNode = $createGroupMentionNode(
            GROUP_MENTION_TEXT[group]
          );
          if (nodeToReplace) {
            nodeToReplace.replace(mentionNode);
          }
          mentionNode.select();
          onSelectGroupMention?.(group);
          closeMenu();
          return;
        }

        if (selectedOption.type === "alias") {
          if (nodeToReplace) {
            const existingHandles = getExistingMentionHandles();
            const lastNode = insertAliasMembers({
              nodeToReplace,
              members: selectedOption.members,
              existingHandles,
              onSelect,
            });
            lastNode.select();
          }
          closeMenu();
          return;
        }

        if (!selectedOption.id) {
          closeMenu();
          return;
        }

        const mentionNode = $createMentionNode(
          `@${selectedOption.handle}`,
          selectedOption.id
        );
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
        onSelect({
          mentioned_profile_id: selectedOption.id,
          handle_in_content: selectedOption.handle,
        });
        closeMenu();
      });
    },
    [editor, onSelect, onSelectGroupMention]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      if (isInCodeContext(editor)) {
        return null;
      }

      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );

  return (
    <div ref={modalRef}>
      <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForMentionMatch}
        options={options}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        anchorClassName={TYPEAHEAD_ANCHOR_CLASS_NAME}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
        ) => {
          return anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <div className={TYPEAHEAD_MENU_WRAPPER_CLASS_NAME}>
                  <MentionsTypeaheadMenu
                    selectedIndex={selectedIndex}
                    options={options}
                    setHighlightedIndex={setHighlightedIndex}
                    selectOptionAndCleanUp={selectOptionAndCleanUp}
                    anchorElement={anchorElementRef.current}
                  />
                </div>,
                anchorElementRef.current
              )
            : null;
        }}
      />
    </div>
  );
});

NewMentionsPlugin.displayName = "NewMentionsPlugin";

export default NewMentionsPlugin;
