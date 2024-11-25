import React, { ReactNode, useState } from "react";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import BrainMobileWaves from "./mobile/BrainMobileWaves";
import { useRouter } from "next/router";
import { keepPreviousData } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ObjectSerializer";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import BrainDesktopDrop from "./BrainDesktopDrop";

interface Props {
  children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isWavesButtonActive, setIsWavesButtonActive] = useState(false);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: router.query.drop as string }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${router.query.drop}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!router.query.drop,
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
      <BrainMobileTabs
        onWavesButtonClick={setIsWavesButtonActive}
        isWavesButtonActive={isWavesButtonActive}
      />
      {isWavesButtonActive ? (
        <BrainMobileWaves activeWaveId={router.query.wave as string} />
      ) : (
        children
      )}
    </div>
  );
};

export default BrainMobile;
