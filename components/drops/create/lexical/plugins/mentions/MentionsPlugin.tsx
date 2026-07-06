"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import type { TextNode } from "lexical";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as ReactDOM from "react-dom";

import { $createGroupMentionNode } from "@/components/drops/create/lexical/nodes/GroupMentionNode";
import { $createMentionNode } from "@/components/drops/create/lexical/nodes/MentionNode";
import MentionsTypeaheadMenu from "./MentionsTypeaheadMenu";
import type { MentionedUser } from "@/entities/IDrop";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import {
  IDENTITY_SEARCH_MIN_HANDLE_LENGTH,
  useIdentitiesSearch,
} from "@/hooks/useIdentitiesSearch";
import { isInCodeContext } from "@/components/drops/create/lexical/utils/codeContextDetection";

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
  type: "identity" | "group";
  id: string | null;
  handle: string;
  display: string | null;
  picture: string | null;

  constructor({
    id,
    handle,
    display,
    picture,
    type = "identity",
  }: {
    id: string | null;
    handle: string;
    display: string | null;
    picture: string | null;
    type?: "identity" | "group" | undefined;
  }) {
    super(handle);
    this.type = type;
    this.id = id;
    this.handle = handle;
    this.display = display;
    this.picture = picture;
  }
}

export interface NewMentionsPluginHandles {
  readonly isMentionsOpen: () => boolean;
}

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
    const identityLimit = SUGGESTION_LIST_LENGTH_LIMIT - allOption.length;
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

    return [...allOption, ...identityOptions];
  }, [canMentionAll, identities, queryString]);

  useImperativeHandle(
    ref,
    () => ({
      isMentionsOpen: () => isOpen && options.length > 0,
    }),
    [isOpen, options.length]
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
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
        ) => {
          return anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <div className="tw-absolute -tw-top-12 tw-left-0 tw-z-[1000]">
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
