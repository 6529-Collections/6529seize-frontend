import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  ReservoirCollectionResponse,
  ReservoirCollectionResponseCollection,
} from "../../../../../../entities/IReservoir";
import { TextNode } from "lexical";
import { $createNftNode } from "../../nodes/NftNode";

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentNFTRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentNFTRegex.PUNCTUATION;

const TRIGGERS = ["!"].join("");

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

const NftRegex = new RegExp(
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
const NftRegexAliasRegex = new RegExp(
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

export class NftTypeaheadOption extends MenuOption {
  name: string;
  constructor({ name }: { name: string }) {
    super(name);
    this.name = name;
  }
}

export default function NFTPlugin() {
  const [editor] = useLexicalComposerContext();
  const [collections, setCollections] = useState<
    ReservoirCollectionResponseCollection[]
  >([]);

  const collectionOptions = useMemo(
    () =>
      collections
        .map(
          (collection) =>
            new NftTypeaheadOption({
              name: collection.name,
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [collections]
  );

  const onQueryChange = async (query: string | null) => {
    if (!query?.length) return;
    console.log(query);
    const url = `https://api.reservoir.tools/search/collections/v2?name=${query}&limit=${SUGGESTION_LIST_LENGTH_LIMIT}`;
    const response = await fetch(url);
    if (!response.ok) {
      return;
    }
    const data: ReservoirCollectionResponse = await response.json();
    setCollections(data.collections);
  };

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const checkForNfts = (
    text: string,
    minMatchLength: number
  ): MenuTextMatch | null => {
    let match = NftRegex.exec(text);

    if (match === null) {
      match = NftRegexAliasRegex.exec(text);
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
  };

  const checkForNftMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return checkForNfts(text, 1);
    },
    [checkForSlashTriggerMatch, editor]
  );

  const onSelectOption = (
    selectedOption: NftTypeaheadOption,
    nodeToReplace: TextNode | null,
    closeMenu: () => void
  ) => {
    editor.update(() => {
      // const hashtagNode = $createNftNode(`!${selectedOption.name}`);
      // if (nodeToReplace) {
      //   nodeToReplace.replace(hashtagNode);
      // }
      nodeToReplace?.setTextContent(`!${selectedOption.name}`);
      nodeToReplace?.selectEnd();
      nodeToReplace?.canInsertTextAfter();
    });
  };

  return (
    <LexicalTypeaheadMenuPlugin<NftTypeaheadOption>
      onQueryChange={onQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={checkForNftMatch}
      options={collectionOptions}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        return anchorElementRef.current && [1].length
          ? ReactDOM.createPortal(
              <div className="tailwind-scope tw-absolute tw-z-50 tw-mt-1 tw-min-w-[17.4rem] tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5 tw-p-2">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {collectionOptions.map((collection) => (
                    <li key={collection.name}>{collection.name}</li>
                  ))}
                </ul>
              </div>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
}
