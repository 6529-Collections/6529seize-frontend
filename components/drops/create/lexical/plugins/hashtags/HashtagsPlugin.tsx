"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
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
  useState,
} from "react";
import * as ReactDOM from "react-dom";

import { $createHashtagNode } from "@/components/drops/create/lexical/nodes/HashtagNode";
import HashtagsTypeaheadMenu from "./HashtagsTypeaheadMenu";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import type { ReferencedNft } from "@/entities/IDrop";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import type { TokenMetadata } from "@/types/nft";
import { isInCodeContext } from "@/components/drops/create/lexical/utils/codeContextDetection";
import { getPossibleQueryMatch } from "./getPossibleQueryMatch";

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

type NftReferenceLookup = {
  readonly contract: string;
  readonly tokenId: string;
};

const parseNftReferenceLookup = (
  query: string | null
): NftReferenceLookup | null => {
  if (!query) {
    return null;
  }
  const parts = query.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const [contract, tokenId] = parts;
  if (
    !contract ||
    !tokenId ||
    !isEthereumAddress(contract) ||
    !/^\d+$/.test(tokenId)
  ) {
    return null;
  }
  return { contract, tokenId };
};

const getNftDisplayName = (
  token: TokenMetadata,
  lookup: NftReferenceLookup
): string => {
  const name = token.name?.trim();
  if (name) {
    return name;
  }
  const collectionName = token.collectionName?.trim() ?? "NFT";
  return `${collectionName} #${lookup.tokenId}`;
};

function useHashtagLookupService(hashtagString: string | null) {
  const lookup = useMemo(
    () => parseNftReferenceLookup(hashtagString),
    [hashtagString]
  );
  const tokens = useMemo(
    () =>
      lookup ? [{ contract: lookup.contract, tokenId: lookup.tokenId }] : [],
    [lookup]
  );
  const { data = [] } = useTokenMetadataQuery({
    tokens,
    enabled: lookup !== null,
  });

  return useMemo(
    () =>
      lookup
        ? data.map((token) => ({
            contract: token.contract ?? lookup.contract,
            tokenId: token.tokenIdRaw || lookup.tokenId,
            name: getNftDisplayName(token, lookup),
            picture: token.imageUrl,
            collectionName: token.collectionName,
          }))
        : [],
    [data, lookup]
  );
}

export class HashtagsTypeaheadOption extends MenuOption {
  contract: string;
  tokenId: string;
  name: string;
  picture: string | null;
  collectionName: string | null;

  constructor({
    contract,
    tokenId,
    name,
    picture,
    collectionName,
  }: {
    contract: string;
    tokenId: string;
    name: string;
    picture: string | null;
    collectionName: string | null;
  }) {
    super(name);
    this.contract = contract;
    this.tokenId = tokenId;
    this.name = name;
    this.picture = picture;
    this.collectionName = collectionName;
  }
}

const createNftReferenceNode = (selectedOption: HashtagsTypeaheadOption) => {
  const referencedNft: ReferencedNft = {
    contract: selectedOption.contract,
    token: selectedOption.tokenId,
    name: selectedOption.name,
  };
  return {
    hashtagNode: $createHashtagNode(`$${selectedOption.name}`, referencedNft),
    referencedNft,
  };
};

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
              contract: result.contract,
              tokenId: result.tokenId,
              name: result.name,
              picture: result.picture,
              collectionName: result.collectionName,
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
        const { hashtagNode, referencedNft } =
          createNftReferenceNode(selectedOption);
        if (nodeToReplace) {
          nodeToReplace.replace(hashtagNode);
        }
        hashtagNode.select();
        onSelect(referencedNft);
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
export default NewHashtagsPlugin;
