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

import { $createWaveMentionNode } from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import WaveMentionsTypeaheadMenu from "./WaveMentionsTypeaheadMenu";
import type { MentionedWave } from "@/entities/IDrop";
import { useWavesSearch } from "@/hooks/useWavesSearch";
import { isInCodeContext } from "@/components/drops/create/lexical/utils/codeContextDetection";

const PUNCTUATION = String.raw`\.,\+\*\?\$\@\|#{}\(\)\^\-\[\]\\\/!%'"~=<>_:;`;

const DocumentWaveMentionsRegex = {
  PUNCTUATION,
};

const PUNC = DocumentWaveMentionsRegex.PUNCTUATION;
const TRIGGERS = ["#"].join("");
const VALID_CHARS = String.raw`[^${TRIGGERS}${PUNC}\s]`;
const VALID_JOINS = String.raw`(?:\.[ |$]| |[${PUNC}]|)`;
const LENGTH_LIMIT = 75;

const HashMentionsRegex = new RegExp(
  String.raw`(^|\s|\()([${TRIGGERS}]((?:${VALID_CHARS}${VALID_JOINS}){0,${LENGTH_LIMIT}}))$`
);

const ALIAS_LENGTH_LIMIT = 50;
const HashMentionsRegexAliasRegex = new RegExp(
  String.raw`(^|\s|\()([${TRIGGERS}]((?:${VALID_CHARS}){0,${ALIAS_LENGTH_LIMIT}}))$`
);

const SUGGESTION_LIST_LENGTH_LIMIT = 5;

function checkForHashMentions(
  text: string,
  minMatchLength: number
): MenuTextMatch | null {
  let match = HashMentionsRegex.exec(text);

  match ??= HashMentionsRegexAliasRegex.exec(text);
  if (match !== null) {
    const maybeLeadingWhitespace = match[1] ?? "";
    const matchingString = match[3];
    const replaceableString = match[2] ?? "";
    if (matchingString && matchingString.length >= minMatchLength) {
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
  return checkForHashMentions(text, 1);
}

export class WaveMentionTypeaheadOption extends MenuOption {
  id: string;
  name: string;
  picture: string | null;

  constructor({
    id,
    name,
    picture,
  }: {
    id: string;
    name: string;
    picture: string | null;
  }) {
    super(name);
    this.id = id;
    this.name = name;
    this.picture = picture;
  }
}

export interface NewWaveMentionsPluginHandles {
  readonly isWaveMentionsOpen: () => boolean;
}

const NewWaveMentionsPlugin = forwardRef<
  NewWaveMentionsPluginHandles,
  {
    readonly onSelect: (wave: MentionedWave) => void;
  }
>(({ onSelect }, ref) => {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const { waves } = useWavesSearch({
    name: queryString ?? "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const isWaveMentionsOpen = () => isOpen;
  const modalRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    isWaveMentionsOpen,
  }));

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      waves
        .map(
          (wave) =>
            new WaveMentionTypeaheadOption({
              id: wave.id,
              name: wave.name,
              picture: wave.picture ?? null,
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [waves]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: WaveMentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const safeWaveName = selectedOption.name.replaceAll("]", "");
        const mentionNode = $createWaveMentionNode(`#${safeWaveName}`);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
        onSelect({
          wave_id: selectedOption.id,
          wave_name_in_content: safeWaveName,
        });
        closeMenu();
      });
    },
    [editor, onSelect]
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
      <LexicalTypeaheadMenuPlugin<WaveMentionTypeaheadOption>
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
          return anchorElementRef.current && waves.length
            ? ReactDOM.createPortal(
                <div className="tw-absolute -tw-top-12 tw-left-0 tw-z-[1000]">
                  <WaveMentionsTypeaheadMenu
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

NewWaveMentionsPlugin.displayName = "NewWaveMentionsPlugin";
export default NewWaveMentionsPlugin;
