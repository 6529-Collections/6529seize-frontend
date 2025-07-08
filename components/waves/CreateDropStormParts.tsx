"use client";

import React from "react";
import { CreateDropPart, ReferencedNft } from "../../entities/IDrop";
import { ApiDropMentionedUser } from "../../generated/models/ApiDropMentionedUser";
import { AuthContext } from "../auth/Auth";
import { cicToType } from "../../helpers/Helpers";
import Link from "next/link";
import CreateDropStormPart from "./CreateDropStormPart";
import { AnimatePresence, motion } from "framer-motion";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../user/utils/UserCICAndLevel";

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

            <AnimatePresence mode="popLayout">
              <motion.div className="tw-mt-4 tw-space-y-4">
                {parts.map((part, partIndex) => (
                  <motion.div
                    key={`storm-part-${part.content}-${partIndex}`}
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CreateDropStormParts);
