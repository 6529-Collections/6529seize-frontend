"use client";

import { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  FC,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const CreateDropStormParts: FC<CreateDropStormPartsProps> = ({
  parts,
  mentionedUsers,
  referencedNfts,
  onRemovePart,
}) => {
  const { connectedProfile } = useContext(AuthContext);

  const partIdCounterRef = useRef(0);
  const [partIdsMap, setPartIdsMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    setPartIdsMap((prevMap) => {
      const newMap = new Map(prevMap);
      let changed = false;

      parts.forEach((part, index) => {
        if (!part.quoted_drop) {
          if (!newMap.has(index)) {
            newMap.set(index, `part-${partIdCounterRef.current++}`);
            changed = true;
          }
        }
      });

      const maxIndex = parts.length - 1;
      Array.from(newMap.keys()).forEach((key) => {
        if (key > maxIndex) {
          newMap.delete(key);
          changed = true;
        }
      });

      return changed ? newMap : prevMap;
    });
  }, [parts]);

  const partKeys = useMemo(() => {
    return parts.map((part, index) => {
      if (part.quoted_drop) {
        return `quoted-${part.quoted_drop.drop_id}-${part.quoted_drop.drop_part_id}`;
      }
      return partIdsMap.get(index) ?? `part-fallback-${index}`;
    });
  }, [parts, partIdsMap]);

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

export default memo(CreateDropStormParts);
