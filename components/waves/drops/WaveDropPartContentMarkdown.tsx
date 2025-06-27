import React, { useState, useRef, useEffect } from "react";
import DropPartMarkdownWithPropLogger from "../../drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../generated/models/ApiDropReferencedNFT";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import { ApiWaveMin } from "../../../generated/models/ApiWaveMin";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface WaveDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly part: ApiDropPart;
  readonly wave: ApiWaveMin;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isEditing?: boolean;
  readonly isSaving?: boolean;
  readonly onSave?: (newContent: string) => void;
  readonly onCancel?: () => void;
  readonly drop?: ApiDrop; // Add drop to check for edited status
}

const WaveDropPartContentMarkdown: React.FC<
  WaveDropPartContentMarkdownProps
> = ({
  mentionedUsers,
  referencedNfts,
  part,
  wave,
  onQuoteClick,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  drop,
}) => {
  const [editContent, setEditContent] = useState(part.content || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditContent(part.content || "");
    }
  }, [isEditing, part.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);

      // Auto-resize textarea
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleSave = () => {
    // If no changes, silently exit edit mode without API call
    if (editContent === part.content) {
      if (onCancel) {
        onCancel();
      }
      return;
    }
    
    if (onSave) {
      onSave(editContent);
    }
  };

  const handleCancel = () => {
    setEditContent(part.content || "");
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Escape key
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
      return;
    }

    // Check for Enter key
    if (e.key === "Enter") {
      // Shift+Enter creates a new line
      if (e.shiftKey) {
        // Allow default behavior - creates new line
        return;
      }

      // Plain Enter saves the edit (handleSave will check for changes)
      e.preventDefault();
      handleSave();
      return;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  if (isEditing) {
    return (
      <div className="tw-w-full">
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="tw-w-full tw-p-2 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-text-sm tw-resize-none tw-outline-none focus:tw-border-primary-500 tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
          placeholder="Edit message..."
          style={{
            fontFamily: "inherit",
            lineHeight: "1.4",
          }}
        />
        <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
          <div className="tw-text-xs tw-text-iron-500">
            Escape to{" "}
            <span 
              onClick={handleCancel}
              className="tw-cursor-pointer tw-text-primary-500 hover:tw-text-primary-400 tw-transition"
            >
              cancel
            </span>
            {" • Enter to "}
            <span 
              onClick={handleSave}
              className="tw-cursor-pointer tw-text-primary-500 hover:tw-text-primary-400 tw-transition"
            >
              save
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <DropPartMarkdownWithPropLogger
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          partContent={part.content}
          onQuoteClick={onQuoteClick}
        />
        {drop && drop.updated_at && drop.updated_at !== drop.created_at && (
          <span className="tw-text-[10px] tw-leading-none tw-text-iron-500 tw-font-normal">
            (edited)
          </span>
        )}
      </div>
      {part.quoted_drop?.drop_id && (
        <div className="tw-mt-1.5">
          <WaveDropQuoteWithDropId
            dropId={part.quoted_drop.drop_id}
            partId={part.quoted_drop.drop_part_id}
            maybeDrop={
              part.quoted_drop.drop
                ? { ...part.quoted_drop.drop, wave: wave }
                : null
            }
            onQuoteClick={onQuoteClick}
          />
        </div>
      )}
    </>
  );
};

export default WaveDropPartContentMarkdown;
