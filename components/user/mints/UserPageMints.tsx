import { useQueries, useQuery } from "@tanstack/react-query";
import {
  IProfileAndConsolidations,
  WalletDelegation,
} from "../../../entities/IProfile";
import { useEffect, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Page } from "../../../helpers/Types";
import {
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "../../../entities/INextgen";
import { formatNameForUrl } from "../../nextGen/nextgen_helpers";
import UserPageMintsPhasesPhase from "./UserPageMintsPhasesPhase";
import UserPageMintsMintingAddresses from "./UserPageMintsMintingAddresses";
import Image from "next/image";
import UserPageMintsSubscriptions from "./subscriptions/UserPageMintsSubscriptions";

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
  readonly collectionName: string;
  readonly endTime: number;
  readonly name: string;
  readonly mintPrice: number;
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
      startTime: p.start_time * 1000,
      endTime: p.end_time * 1000,
      name: p.phase,
      mintPrice: p.mint_price,
      collectionName: p.collection_name,
      spots: walletsProofs.data
        .filter((w) => w.merkle_root === p.merkle_root)
        .toSorted((a, b) => a.spots - b.spots)
        .reduce<UserPageMintsPhaseSpot[]>((prev, curr) => {
          const name = JSON.parse(curr.info).palettes;
          const address = curr.address.toLowerCase();
          const previousSpots = prev
            .flatMap((s) => s.items.filter((i) => i.address === address))
            .reduce((prev, curr) => prev + curr.spots, 0);
          const spots = curr.spots - previousSpots;
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
    const names = phases
      .filter((p) => p.endTime > new Date().getTime())
      .map((p) => p.name);
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

  const [mintUrl, setMintUrl] = useState<string>("");
  useEffect(() => {
    if (!phases.length) {
      setMintUrl("");
      return;
    }
    const phase = phases[0];
    const collectionName = phase.collectionName;
    const collectionNameFormatted = formatNameForUrl(collectionName);
    const origin = window?.location.origin ?? "";
    setMintUrl(`${origin}/nextgen/collection/${collectionNameFormatted}/mint`);
  }, [phases]);

  const getNotEligibleText = () => {
    const sub = profile.profile?.handle ? "profile" : "wallet";
    return `This ${sub} is not eligible to mint Pebbles at this time.`;
  };

  const getMintingWallets = (): Set<string> => {
    const wallets = delegations
      .filter((wallet) => wallet.data?.address)
      .flatMap((wallet) => {
        const res: string[] = [];
        const address = wallet.data?.address;
        if (address) {
          res.push(address);
        }
        const delegation = wallet.data?.delegation;
        if (delegation) {
          res.push(delegation);
        }
        return res;
      });
    return new Set(wallets);
  };

  const mintingWallets = getMintingWallets();

  return (
    <>
      <UserPageMintsSubscriptions profile={profile} />
      <div className="tailwind-scope">
        <div className="tw-divide-y tw-divide-iron-800">
          <div className="tw-flex">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
              NextGen - Pebbles
            </h2>
          </div>
          {phases.length ? (
            <>
              {!!phaseNames?.length && (
                <p className="tw-font-normal tw-text-iron-400 tw-text-sm sm:tw-text-base tw-mb-0">
                  Congratulations! You are eligible to mint Pebbles in{" "}
                  <span className="tw-pl-1 tw-font-semibold tw-text-iron-200">
                    {phaseNames}.
                  </span>
                </p>
              )}
              <div className="tw-mt-6 sm:tw-mt-8 tw-flex tw-flex-col">
                <span className="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
                  Minting Page
                </span>
                <div className="tw-mt-1">
                  <a
                    href={mintUrl}
                    className="tw-group tw-inline-flex tw-items-center tw-text-primary-300 hover:tw-text-primary-400 tw-font-medium tw-text-base tw-duration-300 tw-transition tw-ease-out"
                    target="_blank"
                    rel="noopener noreferrer">
                    <span className="tw-break-all">{mintUrl}</span>
                    <svg
                      className="tw-h-6 tw-w-6 tw-ml-2 tw-text-primary-300 group-hover:tw-text-primary-400 tw-duration-400 tw-transition tw-ease-out group-hover:-tw-translate-y-0.5 group-hover:tw-translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg">
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
              {phases.map((phase) => (
                <UserPageMintsPhasesPhase key={phase.name} phase={phase} />
              ))}

              <UserPageMintsMintingAddresses wallets={mintingWallets} />
              <div className="tw-mt-6 tw-max-w-4xl">
                <p className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
                  NextGen mints check{" "}
                  <a
                    href="https://seize.io/delegation/delegation-center"
                    rel="noopener noreferrer"
                    className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
                    target="_blank">
                    Delegation Center
                  </a>{" "}
                  in realtime. You can update your delegated minting addresses
                  at any time before you mint. Configure your delegations at the{" "}
                  <a
                    href="https://seize.io/delegation/delegation-center"
                    rel="noopener noreferrer"
                    className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
                    target="_blank">
                    Delegation Center
                  </a>{" "}
                  by creating a delegation for &quot;Any Collection&quot; or
                  &quot;The Memes&quot; with use-case &quot;#1 All&quot; or
                  &quot;#2 Minting / Allowlist&quot;
                </p>
              </div>
              <div className="tw-mt-6 sm:tw-mt-8">
                <div className="md:tw-max-w-5xl lg:tw-max-w-full">
                  <Image
                    width={1379}
                    height={594}
                    src="/timezones.png"
                    className="tw-w-2/3 tw-h-2/3 tw-object-contain tw-rounded-md"
                    alt="NextGen Pebbles Minting Timezones"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="tw-font-normal tw-text-iron-400 tw-text-sm sm:tw-text-base tw-mb-0">
              {getNotEligibleText()}
            </p>
          )}
          <div className="tw-mt-8 tw-pt-8 md:tw-mt-10 md:tw-pt-10 tw-border-t tw-border-solid tw-border-x-0 tw-border-b tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
            <div className="md:tw-max-w-5xl">
              <span className="tw-text-iron-300">Note:</span> The Your Mints tab
              will later be made available for Memes drops too, but is not
              active yet. For now, please continue to use the Distribution Plan
              page for each card (example:{" "}
              <a
                href="https://seize.io/the-memes/192/distribution"
                rel="noopener noreferrer"
                target="_blank"
                className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out">
                www.seize.io/the-memes/192/distribution
              </a>{" "}
              ).
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
