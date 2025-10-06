"use client";

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
  useState,
} from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { $createHashtagNode } from "@/components/drops/create/lexical/nodes/HashtagNode";
import HashtagsTypeaheadMenu from "./HashtagsTypeaheadMenu";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import { ReferencedNft } from "@/entities/IDrop";
import { ReservoirTokensResponseTokenElement } from "@/entities/IReservoir";
import { isInCodeContext } from "@/components/drops/create/lexical/utils/codeContextDetection";

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentHashtagRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentHashtagRegex.PUNCTUATION;

const TRIGGERS = ["#"].join("");

// Chars we expect to see in a hashtag (non-space, non-punctuation).
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

const HashtagSignHashtagRegex = new RegExp(
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
const HashtagSignHashtagsRegexAliasRegex = new RegExp(
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

function useHashtagLookupService(hashtagString: string | null) {
  const [results, setResults] = useState<
    Array<ReservoirTokensResponseTokenElement>
  >([]);

  const getResults = async (query: string): Promise<void> => {
    const [contract, tokenId] = query.split(":");
    const isContract = isEthereumAddress(contract);
    const isTokenId = !isNaN(Number(tokenId));
    if (!isContract || !isTokenId) {
      setResults([]);
      return;
    }
    const url = `https://api.reservoir.tools/tokens/v7?tokens=${contract}%3A${tokenId}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setResults(data.tokens);
    }
  };

  useEffect(() => {
    if (hashtagString == null) {
      setResults([]);
      return;
    }

    getResults(hashtagString);
  }, [hashtagString]);

  return results;
}

function checkForAtSignHashtags(
  text: string,
  minMatchLength: number
): MenuTextMatch | null {
  let match = HashtagSignHashtagRegex.exec(text);

  if (match === null) {
    match = HashtagSignHashtagsRegexAliasRegex.exec(text);
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
  return checkForAtSignHashtags(text, 1);
}

export class HashtagsTypeaheadOption extends MenuOption {
  contract: string;
  tokenId: string;
  name: string;
  picture: string | null;

  constructor({
    contract,
    tokenId,
    name,
    picture,
  }: {
    contract: string;
    tokenId: string;
    name: string;
    picture: string | null;
  }) {
    super(name);
    this.contract = contract;
    this.tokenId = tokenId;
    this.name = name;
    this.picture = picture;
  }
}

export interface NewHastagsPluginHandles {
  readonly isHashtagsOpen: () => boolean;
}

const NewHashtagsPlugin = forwardRef<
  NewHastagsPluginHandles,
  { readonly onSelect: (nft: ReferencedNft) => void }
>(({ onSelect }, ref) => {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const results = useHashtagLookupService(queryString);
  const [isOpen, setIsOpen] = useState(false);
  const isHashtagsOpen = () => isOpen;

  useImperativeHandle(ref, () => ({
    isHashtagsOpen,
  }));
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      results
        .map(
          (result) =>
            new HashtagsTypeaheadOption({
              contract: result.token.contract,
              tokenId: result.token.tokenId,
              name: result.token.name,
              picture: result.token.imageSmall,
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: HashtagsTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const hashtagNode = $createHashtagNode(`#${selectedOption.name}`);
        if (nodeToReplace) {
          nodeToReplace.replace(hashtagNode);
        }
        hashtagNode.select();
        onSelect({
          contract: selectedOption.contract,
          token: selectedOption.tokenId,
          name: selectedOption.name,
        });
        closeMenu();
      });
    },
    [editor]
  );

  const checkForHashtagMatch = useCallback(
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
    <LexicalTypeaheadMenuPlugin<HashtagsTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForHashtagMatch}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        return anchorElementRef.current && results.length
          ? ReactDOM.createPortal(
              <div className="tw-absolute -tw-top-12 tw-left-0 tw-z-[1000]">
                <HashtagsTypeaheadMenu
                  selectedIndex={selectedIndex}
                  options={options}
                  setHighlightedIndex={setHighlightedIndex}
                  selectOptionAndCleanUp={selectOptionAndCleanUp}
                />
              </div>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
});

NewHashtagsPlugin.displayName = "NewHashtagsPlugin";
export {
  useHashtagLookupService,
  checkForAtSignHashtags,
  getPossibleQueryMatch,
};
export default NewHashtagsPlugin;
