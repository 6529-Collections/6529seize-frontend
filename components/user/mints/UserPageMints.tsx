import { useQueries, useQuery } from "@tanstack/react-query";
import {
  IProfileAndConsolidations,
  WalletDelegation,
} from "../../../entities/IProfile";
import { useEffect, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Page } from "../../../helpers/Types";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "../../../constants";
import {
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "../../../entities/INextgen";
import UserPageMintsPhases from "./UserPageMintsPhases";

const VALID_DELEGATION_ADDRESSES = [DELEGATION_ALL_ADDRESS, MEMES_CONTRACT].map(
  (c) => c.toLowerCase()
);

const VALID_USE_CASES = [1, 2];

export interface UserPageMintsPhaseSpotItem {
  readonly spots: number;
  readonly address: string;
}

export interface UserPageMintsPhaseSpot {
  readonly name: string;
  readonly items: UserPageMintsPhaseSpotItem[];
}

export interface UserPageMintsPhase {
  readonly startTime: number;
  readonly endTime: number;
  readonly name: string;
  readonly spots: UserPageMintsPhaseSpot[];
}

export interface UserPageMintsDelegation {
  readonly address: string;
  readonly delegation: string | null;
}

export default function UserPageMints({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { data: collectionPhases } = useQuery({
    queryKey: [QueryKey.COLLECTION_ALLOWLIST_PHASES, "nextgen"],
    queryFn: async () =>
      await commonApiFetch<Page<NextgenAllowlistCollection>>({
        endpoint: `nextgen/allowlist_phases`,
      }),
  });

  const [walletsParams, setWalletsParams] = useState<string>(
    profile.consolidation.wallets
      .map((w) => w.wallet.address.toLowerCase())
      .join(",")
  );
  useEffect(() => {
    const wallets = profile.consolidation.wallets
      .map((w) => w.wallet.address.toLowerCase())
      .join(",");
    setWalletsParams(wallets);
  }, [profile]);

  const { data: walletsProofs } = useQuery({
    queryKey: [
      QueryKey.COLLECTION_ALLOWLIST_PROOFS,
      { collection: "nextgen", address: walletsParams },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<NextgenAllowlist>>({
        endpoint: `nextgen/proofs`,
        params: {
          address: walletsParams,
        },
      }),
    enabled: !!walletsParams.length,
  });

  const [phases, setPhases] = useState<UserPageMintsPhase[]>([]);

  useEffect(() => {
    if (!collectionPhases || !walletsProofs) {
      setPhases([]);
      return;
    }
    const merkleRoots = new Set<string>(
      walletsProofs.data.map((w) => w.merkle_root)
    );
    const validPhases = collectionPhases.data.filter((p) =>
      merkleRoots.has(p.merkle_root)
    );
    const phases = validPhases.map((p) => ({
      startTime: p.start_time,
      endTime: p.end_time,
      name: p.phase,
      spots: walletsProofs.data
        .filter((w) => w.merkle_root === p.merkle_root)
        .reduce<UserPageMintsPhaseSpot[]>((prev, curr) => {
          const name = JSON.parse(curr.info).palettes;
          const address = curr.address.toLowerCase();
          const spots = curr.spots;
          const item = prev.find((i) => i.name === name);
          if (item) {
            item.items.push({ spots, address });
          } else {
            prev.push({
              name,
              items: [{ spots, address }],
            });
          }
          return prev;
        }, []),
    }));
    setPhases(phases);
  }, [collectionPhases, walletsProofs]);

  const [phaseNames, setPhaseNames] = useState<string | null>();

  useEffect(() => {
    const names = phases.map((p) => p.name);
    setPhaseNames(names.join(", "));
  }, [phases]);

  const [affectedWallets, setAffectedWallets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const wallets = new Set<string>();
    phases.forEach((p) =>
      p.spots.forEach((s) => s.items.forEach((i) => wallets.add(i.address)))
    );
    setAffectedWallets(wallets);
  }, [phases]);

  const delegations = useQueries({
    queries: Array.from(affectedWallets).map((wallet) => ({
      queryKey: [QueryKey.WALLET_MINTING_DELEGATIONS, wallet],
      queryFn: async (): Promise<UserPageMintsDelegation> => {
        const res = await commonApiFetch<Page<WalletDelegation>>({
          endpoint: `delegations/minting/${wallet}`,
        });
        if (res.data.length === 0) {
          return {
            address: wallet.toLowerCase(),
            delegation: null,
          };
        }
        const delegation = res.data[0];
        return {
          address: wallet.toLowerCase(),
          delegation: delegation.to_address.toLowerCase(),
        };
      },
    })),
  });

  return (
    <div className="tailwind-scope">
      <div className="tw-divide-y tw-divide-iron-800">
        <div className="tw-flex">
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
            NextGen - Pebbles
          </h2>
        </div>
        <p className="tw-font-normal tw-text-iron-400 tw-text-sm sm:tw-text-base tw-mb-0">
          Congratulations! You are eligible to mint Pebbles in{" "}
          <span className="tw-pl-1 tw-font-semibold tw-text-iron-200">
            {phaseNames}.
          </span>
        </p>
        <div className="tw-mt-8 tw-flex tw-flex-col">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Minting Page
          </span>
          <div className="tw-mt-1">
            <a
              href="www.seize.io/nextgen/pebbles/mint"
              className="tw-group tw-inline-flex tw-items-center tw-text-primary-300 hover:tw-text-primary-400 tw-font-medium tw-text-base tw-duration-300 tw-transition tw-ease-out"
              target="_blank"
            >
              <span>seize.io/nextgen/pebbles/mint</span>
              <svg
                className="tw-h-6 tw-w-6 tw-ml-2 tw-text-primary-300 group-hover:tw-text-primary-400 tw-duration-400 tw-transition tw-ease-out group-hover:-tw-translate-y-0.5 group-hover:tw-translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
        <UserPageMintsPhases phases={phases} />

        <div className="tw-mt-8 tw-flex tw-flex-col">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Your Minting Addresses
          </span>
          <p className="tw-mb-0 tw-mt-1 tw-text-iron-400 tw-text-sm tw-font-medium">
            You can mint from any of the following addresses
          </p>
          <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-1.5 ">
            {delegations
              .filter((wallet) => wallet.data?.address)
              .flatMap((wallet) => {
                const res: string[] = [];
                const address = wallet.data?.address;
                if (address) {
                  res.push(address);
                }
                const delegation = wallet.data?.delegation;
                if (
                  delegation &&
                  !VALID_DELEGATION_ADDRESSES.includes(delegation)
                ) {
                  res.push(delegation);
                }
                return res;
              })
              .map((wallet) => (
                <div key={wallet} className="tw-inline-flex tw-items-center">
                  <svg
                    className="tw-h-5 tw-w-5 tw-mr-2 tw-text-iron-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="tw-text-iron-300 tw-font-medium tw-text-base">
                    {wallet}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div className="tw-mt-6">
          <p className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
            To change your minting address, change your minting delegate for All
            NFTs or The Memes in the{" "}
            <a
              href="https://seize.io/delegation/delegation-center"
              className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
              target="_blank"
            >
              Delegation Center
            </a>{" "}
            at any time before the mint.
          </p>
        </div>
        <div className="tw-mt-10 tw-pt-10 tw-border-t tw-border-solid tw-border-x-0 tw-border-b tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
          <div className="tw-max-w-5xl">
            <span className="tw-text-iron-300">Note:</span> The Your Mint tab
            will later be made available for Memes frops too, but is is not
            active yet. For now, please continue to use the Distribution Plan
            page for each card (example:{" "}
            <a
              href="https://seize.io/the-memes/192/distribution"
              className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
            >
              www.seize.io/the-memes/192/distribution
            </a>
            )
          </div>
        </div>
      </div>
    </div>
  );
}
