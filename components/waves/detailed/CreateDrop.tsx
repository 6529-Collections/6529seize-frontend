import PrimaryButton from "../../utils/button/PrimaryButton";
import { ActiveDropAction, ActiveDropState } from "./WaveDetailedContent";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import CreateDropInput, { CreateDropInputHandles } from "./CreateDropInput";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  DropMedia,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { MENTION_TRANSFORMER } from "../../drops/create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../../drops/create/lexical/transformers/ImageTransformer";
import { AuthContext } from "../../auth/Auth";
import { commonApiPost } from "../../../services/api/common-api";
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";
import { Drop } from "../../../generated/models/Drop";
import { getOptimisticDropId } from "../../../helpers/waves/drop.helpers";
import { useMutation } from "@tanstack/react-query";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import FilePreview from "./FilePreview";
import CreateDropStormParts from "./CreateDropStormParts";
import { WaveMin } from "../../../generated/models/WaveMin";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: WaveMin;
  readonly onDropCreated: () => void;
}

export default function CreateDrop({
  activeDrop,
  rootDropId,
  onCancelReplyQuote,
  wave,
  onDropCreated,
}: CreateDropProps) {
  const [isStormMode, setIsStormMode] = useState(false);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);

  const onRemovePart = (partIndex: number) => {
    setDrop((prevDrop) => {
      if (!prevDrop) return null;
      const newParts = prevDrop.parts.filter((_, i) => i !== partIndex);
      return {
        ...prevDrop,
        parts: newParts,
        referenced_nfts: prevDrop.referenced_nfts || [],
        mentioned_users: prevDrop.mentioned_users || [],
        metadata: prevDrop.metadata || [],
      };
    });
  };
  return (
    <div className="tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-z-10 tw-w-full tw-rounded-t-xl tw-backdrop-blur tw-flex-none tw-transition-colors tw-duration-500 tw-lg:z-50 tw-lg:border-b tw-lg:border-slate-900/10 tw-border-slate-50/[0.06] tw-supports-backdrop-blur:tw-bg-white/95 tw-bg-iron-950/80">
      <AnimatePresence>
        {isStormMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CreateDropStormParts
              parts={drop?.parts ?? []}
              mentionedUsers={drop?.mentioned_users ?? []}
              referencedNfts={drop?.referenced_nfts ?? []}
              onRemovePart={onRemovePart}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <CreateDropContent
        activeDrop={activeDrop}
        rootDropId={rootDropId}
        onCancelReplyQuote={onCancelReplyQuote}
        wave={wave}
        drop={drop}
        setDrop={setDrop}
        setIsStormMode={setIsStormMode}
        onDropCreated={onDropCreated}
      />
    </div>
  );
}
