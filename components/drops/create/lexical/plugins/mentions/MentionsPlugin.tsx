import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { TextNode } from "lexical";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { $createMentionNode } from "../../nodes/MentionNode";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import MentionsTypeaheadMenu from "./MentionsTypeaheadMenu";
import { MentionedUser } from "../../../../../../entities/IDrop";

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

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<Array<CommunityMemberMinimal>>([]);

  const getResults = async (query: string): Promise<void> => {
    const response = await commonApiFetch<CommunityMemberMinimal[]>({
      endpoint: "community-members",
      params: {
        param: query.trim(),
        only_profile_owners: "true",
      },
    });
    setResults(response);
  };

  useEffect(() => {
    if (mentionString == null) {
      setResults([]);
      return;
    }

    getResults(mentionString);
  }, [mentionString]);

  return results;
}

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
    const maybeLeadingWhitespace = match[1];

    const matchingString = match[3];
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2],
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

export class MentionTypeaheadOption extends MenuOption {
  id: string;
  handle: string;
  display: string | null;
  picture: string | null;

  constructor({
    id,
    handle,
    display,
    picture,
  }: {
    id: string;
    handle: string;
    display: string | null;
    picture: string | null;
  }) {
    super(handle);
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
  { readonly onSelect: (user: Omit<MentionedUser, "current_handle">) => void }
>(({ onSelect }, ref) => {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const results = useMentionLookupService(queryString);
  const [isOpen, setIsOpen] = useState(false);
  const isMentionsOpen = () => isOpen;
  const modalRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    isMentionsOpen,
  }));

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      results
        .map(
          (result) =>
            new MentionTypeaheadOption({
              id: result.profile_id ?? "",
              handle: result.handle ?? result.wallet,
              display: result.display,
              picture: result.pfp,
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
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
    [editor]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
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
          return anchorElementRef.current && results.length
            ? ReactDOM.createPortal(
                <MentionsTypeaheadMenu
                  selectedIndex={selectedIndex}
                  options={options}
                  setHighlightedIndex={setHighlightedIndex}
                  selectOptionAndCleanUp={selectOptionAndCleanUp}
                />,
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
