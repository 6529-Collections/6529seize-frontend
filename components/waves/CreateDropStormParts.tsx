"use client";

import { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { cicToType } from "@/helpers/Helpers";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { AuthContext } from "../auth/Auth";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../user/utils/UserCICAndLevel";
import CreateDropStormPart from "./CreateDropStormPart";

interface CreateDropStormPartsProps {
  parts: CreateDropPart[];
  mentionedUsers: ApiDropMentionedUser[];
  referencedNfts: ReferencedNft[];
  onRemovePart: (partIndex: number) => void;
}

const CreateDropStormParts: React.FC<CreateDropStormPartsProps> = ({
  parts,
  mentionedUsers,
  referencedNfts,
  onRemovePart,
}) => {
  const { connectedProfile } = React.useContext(AuthContext);
  const cicType = cicToType(connectedProfile?.cic ?? 0);

  const partKeys = React.useMemo(() => {
    return parts.map((part, index) => {
      const stableId = part.quoted_drop
        ? `quoted-${part.quoted_drop.drop_id}-${part.quoted_drop.drop_part_id}`
        : `content-${index}-${part.media.length}`;
      return stableId;
    });
  }, [parts]);

  return (
    <div className="tw-space-y-4 tw-pb-3">
      <div className="tw-bg-transparent tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-py-2 tw-transition-colors tw-duration-300">
        <div className="tw-flex tw-gap-x-3">
          <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
            {connectedProfile?.pfp ? (
              <img
                src={connectedProfile.pfp}
                alt={connectedProfile.handle ?? "user"}
                className="tw-h-full tw-w-full tw-object-cover tw-rounded-lg"
              />
            ) : (
              <div className="tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-900" />
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <UserCICAndLevel
                  level={connectedProfile?.level ?? 0}
                  cicType={cicType}
                  size={UserCICAndLevelSize.SMALL}
                />
                <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  <Link
                    href={`/${connectedProfile?.handle}`}
                    className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
                    {connectedProfile?.handle ?? "user"}
                  </Link>
                </p>
              </div>
            </div>

            <div className="tw-mt-4 tw-space-y-4">
              <AnimatePresence mode="popLayout">
                {parts.map((part, partIndex) => (
                  <motion.div
                    key={partKeys[partIndex]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                    <CreateDropStormPart
                      partIndex={partIndex}
                      part={part}
                      mentionedUsers={mentionedUsers}
                      referencedNfts={referencedNfts}
                      onRemovePart={onRemovePart}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CreateDropStormParts);
