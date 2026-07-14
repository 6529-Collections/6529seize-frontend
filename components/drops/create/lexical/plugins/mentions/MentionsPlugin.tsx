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
import type {
  MentionAlias,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import { $isCodeNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import { AuthContext } from "@/components/auth/Auth";

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ["@"].join("");

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = "[^" + TRIGGERS + PUNC + "\\s]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  " |" + // E.g. " " in "Josh Duck"
  "[" +
  PUNC +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    VALID_JOINS +
    "){0," +
    LENGTH_LIMIT +
    "})" +
    ")$"
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    "){0," +
    ALIAS_LENGTH_LIMIT +
    "})" +
    ")$"
);

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

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
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

const ALIAS_TOKEN_PATTERN =
  /(^|[^A-Za-z0-9_@])@([A-Za-z0-9_]{3,15})(?=$|[^A-Za-z0-9_@])/g;

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

const insertAliasMembers = ({
  nodeToReplace,
  members,
  existingHandles,
  onSelect,
}: {
  readonly nodeToReplace: TextNode;
  readonly members: MentionAliasMember[];
  readonly existingHandles: Set<string>;
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): TextNode | null => {
  const insertableMembers = members.filter(
    (member) => !existingHandles.has(member.handle.toLowerCase())
  );
  if (!insertableMembers.length) {
    return null;
  }
  const nodes: TextNode[] = [];
  insertableMembers.forEach((member, index) => {
    if (index > 0) nodes.push($createTextNode(" "));
    nodes.push($createMentionNode(`@${member.handle}`));
    existingHandles.add(member.handle.toLowerCase());
    onSelect(toMentionedUser(member));
  });
  nodeToReplace.replace(nodes[0]!);
  let lastNode = nodes[0]!;
  nodes.slice(1).forEach((node) => {
    lastNode.insertAfter(node);
    lastNode = node;
  });
  return lastNode;
};

export const expandPlainAliasTokens = ({
  editor,
  aliases,
  onSelect,
}: {
  readonly editor: LexicalEditor;
  readonly aliases: MentionAlias[];
  readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void;
}): Promise<EditorState> =>
  new Promise((resolve) => {
    if (!aliases.length) {
      resolve(editor.getEditorState());
      return;
    }
    const aliasesByName = new Map(
      aliases.map((alias) => [alias.alias.toLowerCase(), alias])
    );
    editor.update(
      () => {
        const existingHandles = new Set(
          $getRoot()
            .getAllTextNodes()
            .filter($isMentionNode)
            .map((node) => node.getTextContent().replace(/^@/, "").toLowerCase())
        );
        const textNodes = $getRoot()
          .getAllTextNodes()
          .filter(
            (node) =>
              $isTextNode(node) &&
              !$isMentionNode(node) &&
              !isInsideCodeOrLink(node)
          );
        textNodes.forEach((textNode) => {
          const text = textNode.getTextContent();
          const matches = Array.from(text.matchAll(ALIAS_TOKEN_PATTERN));
          if (!matches.length) return;
          const replacementNodes: TextNode[] = [];
          let cursor = 0;
          matches.forEach((match) => {
            const fullMatch = match[0];
            const prefix = match[1] ?? "";
            const aliasName = (match[2] ?? "").toLowerCase();
            const alias = aliasesByName.get(aliasName);
            const matchStart = match.index;
            const tokenStart = matchStart + prefix.length;
            if (tokenStart > cursor) {
              replacementNodes.push(
                $createTextNode(text.slice(cursor, tokenStart))
              );
            }
            if (!alias) {
              replacementNodes.push($createTextNode(fullMatch.slice(prefix.length)));
            } else {
              const members = alias.members.filter(
                (member) => !existingHandles.has(member.handle.toLowerCase())
              );
              members.forEach((member, index) => {
                if (index > 0) replacementNodes.push($createTextNode(" "));
                replacementNodes.push($createMentionNode(`@${member.handle}`));
                existingHandles.add(member.handle.toLowerCase());
                onSelect(toMentionedUser(member));
              });
              if (!members.length) {
                replacementNodes.push(
                  $createTextNode(fullMatch.slice(prefix.length))
                );
              }
            }
            cursor = matchStart + fullMatch.length;
          });
          if (cursor < text.length) {
            replacementNodes.push($createTextNode(text.slice(cursor)));
          }
          if (!replacementNodes.length) return;
          textNode.replace(replacementNodes[0]!);
          let lastNode = replacementNodes[0]!;
          replacementNodes.slice(1).forEach((node) => {
            lastNode.insertAfter(node);
            lastNode = node;
          });
        });
      },
      { onUpdate: () => resolve(editor.getEditorState()) }
    );
  });

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
  const [queryString, setQueryString] = useState<string | null>(null);
  const { identities } = useIdentitiesSearch({
    handle: queryString ?? "",
    waveId,
  });
  const { setToast } = useContext(AuthContext);
  const { aliases, enabled, isFetched, isError, refetch } =
    useMentionAliases();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(() => {
    const normalizedQuery = (queryString ?? "").toLowerCase();
    const allOption =
      canMentionAll &&
      normalizedQuery.length >= IDENTITY_SEARCH_MIN_HANDLE_LENGTH &&
      "all".startsWith(normalizedQuery)
        ? [
            new MentionTypeaheadOption({
              id: ApiDropGroupMention.All,
              handle: "@all",
              display: "Mention everyone",
              picture: null,
              type: "group",
            }),
          ]
        : [];
    const aliasOptions = aliases
      .filter((alias) => alias.alias.toLowerCase().startsWith(normalizedQuery))
      .map(
        (alias) =>
          new MentionTypeaheadOption({
            id: alias.id,
            handle: `@${alias.alias}`,
            display: `Mention shortcut · ${alias.members.length} profile${
              alias.members.length === 1 ? "" : "s"
            }`,
            picture: null,
            type: "alias",
            members: alias.members,
          })
      );
    const identityLimit = Math.max(
      0,
      SUGGESTION_LIST_LENGTH_LIMIT - allOption.length - aliasOptions.length
    );
    const identityOptions = identities
      .map(
        (identity) =>
          new MentionTypeaheadOption({
            id: identity.id ?? identity.primary_wallet,
            handle: identity.handle ?? identity.primary_wallet,
            display: identity.display,
            picture: identity.pfp,
          })
      )
      .slice(0, identityLimit);

    return [...allOption, ...aliasOptions, ...identityOptions].slice(
      0,
      SUGGESTION_LIST_LENGTH_LIMIT
    );
  }, [aliases, canMentionAll, identities, queryString]);

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
              title: "Mention shortcuts couldn't be loaded.",
              message: "Try again before sending this message.",
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
          const mentionNode = $createGroupMentionNode("@all");
          if (nodeToReplace) {
            nodeToReplace.replace(mentionNode);
          }
          mentionNode.select();
          onSelectGroupMention?.(ApiDropGroupMention.All);
          closeMenu();
          return;
        }

        if (selectedOption.type === "alias") {
          if (nodeToReplace) {
            const existingHandles = new Set(
              $getRoot()
                .getAllTextNodes()
                .filter($isMentionNode)
                .map((node) =>
                  node.getTextContent().replace(/^@/, "").toLowerCase()
                )
            );
            const lastNode = insertAliasMembers({
              nodeToReplace,
              members: selectedOption.members,
              existingHandles,
              onSelect,
            });
            lastNode?.select();
          }
          closeMenu();
          return;
        }

        if (!selectedOption.id) {
          closeMenu();
          return;
        }

        const mentionNode = $createMentionNode(`@${selectedOption.handle}`);
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
