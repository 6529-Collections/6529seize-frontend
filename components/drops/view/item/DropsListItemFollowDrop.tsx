import { useContext, useRef, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../../services/api/common-api";
import { DropSubscriptionActions } from "../../../../generated/models/DropSubscriptionActions";
import { DropSubscriptionTargetAction } from "../../../../generated/models/DropSubscriptionTargetAction";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function DropsListItemFollowDrop({
  drop,
}: {
  readonly drop: Drop;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));

  const following = !!drop.subscribed_actions.length;
  const title = following ? "Following" : "Follow";
  const [mutating, setMutating] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<DropSubscriptionActions, DropSubscriptionActions>({
        endpoint: `drops/${drop.id}/subscriptions`,
        body: {
          actions: Object.values(DropSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      setIsOptionsOpen(false);
      invalidateDrops();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const unFollowMutation = useMutation({
    mutationFn: async () => {
      await commonApiDeleWithBody<
        DropSubscriptionActions,
        DropSubscriptionActions
      >({
        endpoint: `drops/${drop.id}/subscriptions`,
        body: {
          actions: Object.values(DropSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      setIsOptionsOpen(false);
      invalidateDrops();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onFollow = async (): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    if (following) {
      await unFollowMutation.mutateAsync();
      return;
    }
    await followMutation.mutateAsync();
  };
  return (
    <div className="tw-relative tw-z-20" ref={listRef}>
      <button
        type="button"
        className="tw-bg-transparent tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-800 tw-rounded-full tw-h-8 tw-w-8 tw-border-0 tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
        id="options-menu-0-button"
        aria-expanded="false"
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen(!isOptionsOpen);
        }}
      >
        <span className="tw-sr-only">Open options</span>
        <svg
          className="tw-h-5 tw-w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>
      <AnimatePresence mode="wait" initial={false}>
        {isOptionsOpen && (
          <motion.div
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-40 tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu-0-button"
            tabIndex={-1}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <button
                type="button"
                disabled={mutating}
                onClick={(e) => {
                  onFollow();
                  e.stopPropagation();
                }}
                className="tw-flex tw-items-center tw-bg-transparent tw-w-full tw-border-none tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-iron-50 hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
                role="menuitem"
                tabIndex={-1}
                id="options-menu-0-item-0"
              >
                {mutating ? (
                  <>
                    <span className="tw-mr-2">{title}</span>
                    <CircleLoader size={CircleLoaderSize.SMALL} />
                  </>
                ) : (
                  title
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
