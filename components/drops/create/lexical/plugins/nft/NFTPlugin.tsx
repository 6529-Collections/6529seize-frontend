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
  ReservoirTokensResponseTokenElement,
} from "../../../../../../entities/IReservoir";
import { TextNode } from "lexical";

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
  const [nfts, setNfts] = useState<ReservoirTokensResponseTokenElement[]>([]);

  const [selectedCollection, setSelectedCollection] =
    useState<ReservoirCollectionResponseCollection | null>(null);

  const collectionOptions = useMemo(() => {
    if (nfts.length) {
      return nfts
        .map(
          (nft) =>
            new NftTypeaheadOption({
              name: nft.token.name,
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT);
    }
    return collections
      .map(
        (collection) =>
          new NftTypeaheadOption({
            name: collection.name,
          })
      )
      .slice(0, SUGGESTION_LIST_LENGTH_LIMIT);
  }, [collections, nfts]);

  const getCollections = async (
    query: string
  ): Promise<ReservoirCollectionResponseCollection[]> => {
    const url = `https://api.reservoir.tools/search/collections/v2?name=${query}&limit=${SUGGESTION_LIST_LENGTH_LIMIT}`;
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data: ReservoirCollectionResponse = await response.json();
    return data.collections;
  };

  const getNfts = async ({
    contract,
    tokenId,
  }: {
    contract: string;
    tokenId: string;
  }): Promise<ReservoirTokensResponseTokenElement[]> => {
    const url = `https://api.reservoir.tools/tokens/v7?tokens=${contract}%3A${tokenId}`;
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.tokens;
  };

  const onQueryChange = async (query: string | null) => {
    if (!query?.length) return;

    if (!selectedCollection) {
      const collections = await getCollections(query);
      setCollections(collections);
      return;
    }

    const contract = selectedCollection.contract;
    const tokenId = query.split(":").at(-1);
    if (!tokenId) return;
    const nfts = await getNfts({ contract, tokenId });
    setNfts(nfts);
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
      nodeToReplace?.setTextContent(`!${selectedOption.name}`);
      nodeToReplace?.selectEnd();
      nodeToReplace?.canInsertTextAfter();
      setSelectedCollection(
        collections.find((c) => c.name === selectedOption.name) ?? null
      );
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
