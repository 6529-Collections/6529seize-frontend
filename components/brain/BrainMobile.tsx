import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import BrainMobileWaves from "./mobile/BrainMobileWaves";
import { useRouter } from "next/router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop, ApiWave } from "../../generated/models/ObjectSerializer";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import BrainDesktopDrop from "./BrainDesktopDrop";
import BrainMobileAbout from "./mobile/BrainMobileAbout";
import { WaveDetailedSmallLeaderboard } from "../waves/detailed/small-leaderboard/WaveDetailedSmallLeaderboard";

export enum BrainView {
  DEFAULT = "DEFAULT",
  WAVES = "WAVES",
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
}

interface Props {
  children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<BrainView>(BrainView.DEFAULT);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: router.query.drop as string }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${router.query.drop}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!router.query.drop,
  });

  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: router.query.wave as string }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${router.query.wave}`,
      }),
    enabled: !!router.query.wave,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const onDropClose = () => {
    const currentQuery = { ...router.query };
    delete currentQuery.drop;
    router.push({ pathname: router.pathname, query: currentQuery }, undefined, {
      shallow: true,
    });
  };

  const isDropOpen =
    drop &&
    drop?.id?.toLowerCase() === (router.query.drop as string)?.toLowerCase();

  const viewComponents: Record<BrainView, ReactNode> = {
    [BrainView.WAVES]: (
      <BrainMobileWaves activeWaveId={router.query.wave as string} />
    ),
    [BrainView.ABOUT]: (
      <BrainMobileAbout activeWaveId={router.query.wave as string} />
    ),
    [BrainView.DEFAULT]: children,
    [BrainView.LEADERBOARD]: wave ? (
      <WaveDetailedSmallLeaderboard wave={wave} onDropClick={() => {}} />
    ) : null,
  };

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-px-2 sm:tw-px-4 md:tw-px-6 tw-h-full">
      {isDropOpen && (
        <div className="tw-absolute tw-inset-0 tw-z-[1000]">
          <BrainDesktopDrop
            drop={{
              ...drop,
              stableKey: drop.id,
              stableHash: drop.id,
            }}
            onClose={onDropClose}
          />
        </div>
      )}
      <BrainMobileTabs activeView={activeView} onViewChange={setActiveView} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="tw-flex-1"
        >
          {viewComponents[activeView]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BrainMobile;
