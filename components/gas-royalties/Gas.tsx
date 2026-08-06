"use client";

import { useTitle } from "@/contexts/TitleContext";
import type { Gas } from "@/entities/IGas";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME,
  GAS_ROYALTIES_TABLE_CELL_CLASS_NAME,
  GAS_ROYALTIES_TABLE_CLASS_NAME,
  GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME,
  GAS_ROYALTIES_TABLE_ROW_CLASS_NAME,
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";

export default function GasComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setTitle } = useTitle();

  useEffect(() => {
    const routerFocus = searchParams?.get("focus") as string;
    const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
      (sd) => sd === routerFocus
    );
    if (resolvedFocus) {
      setCollectionFocus(resolvedFocus);
      const title = `Meme Gas - ${capitalizeEveryWord(
        resolvedFocus.replace("-", " ")
      )}`;
      setTitle(title);
    } else {
      router.push(`${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`);
    }
  }, [searchParams]);

  const [gas, setGas] = useState<Gas[]>([]);
  const [sumGas, setSumGas] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    dateSelection,
    setDateSelection,
    fromDate,
    toDate,
    isPrimary,
    setIsPrimary,
    isCustomBlocks,
    setIsCustomBlocks,
    selectedArtist,
    collectionFocus,
    setCollectionFocus,
    fetching,
    setFetching,
    getUrl,
    getSharedProps,
    fromBlock,
    toBlock,
  } = useSharedState();

  function getUrlWithParams() {
    return getUrl("gas");
  }

  async function fetchGas() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetchUrl<Gas[]>(getUrlWithParams());
      res.forEach((r) => {
        r.gas = Math.round(r.gas * 100000) / 100000;
      });
      setGas(res);
      setSumGas(res.map((g) => g.gas).reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error("Failed to fetch gas data", error);
      setGas([]);
      setSumGas(0);
      setFetchError("Failed to load gas data. Please try again.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (collectionFocus) {
      fetchGas();
    }
  }, [
    dateSelection,
    fromDate,
    toDate,
    fromBlock,
    toBlock,
    selectedArtist,
    isPrimary,
    isCustomBlocks,
  ]);

  useEffect(() => {
    if (collectionFocus) {
      setGas([]);
      fetchGas();
    }
  }, [collectionFocus]);

  if (!collectionFocus) {
    return <></>;
  }

  return (
    <>
      <GasRoyaltiesHeader
        title="Gas"
        results_count={gas.length}
        focus={collectionFocus}
        setDateSelection={(date_selection) => {
          setIsPrimary(false);
          setIsCustomBlocks(false);
          setDateSelection(date_selection);
        }}
        getUrl={getUrlWithParams}
        {...getSharedProps()}
      />
      <section
        className={`${GAS_ROYALTIES_PAGE_CONTAINER_CLASS_NAME} tw-mt-2 tw-flow-root lg:tw-mt-3`}
      >
        <div className="tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-600">
          {gas.length > 0 && (
            <table className={GAS_ROYALTIES_TABLE_CLASS_NAME}>
              <thead>
                <tr>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-left`}
                    scope="col"
                  >
                    Meme Card (x{gas.length})
                  </th>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-left`}
                    scope="col"
                  >
                    Artist
                  </th>
                  <th
                    className={`${GAS_ROYALTIES_TABLE_HEADER_CELL_CLASS_NAME} tw-text-right`}
                    scope="col"
                  >
                    Gas (ETH)
                  </th>
                </tr>
              </thead>
              <tbody>
                {gas.map((g) => (
                  <tr
                    className={GAS_ROYALTIES_TABLE_ROW_CLASS_NAME}
                    key={`token-${g.token_id}`}
                  >
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-left`}
                    >
                      <GasRoyaltiesTokenImage
                        path={
                          collectionFocus ===
                          GasRoyaltiesCollectionFocus.MEMELAB
                            ? "meme-lab"
                            : "the-memes"
                        }
                        token_id={g.token_id}
                        name={g.name}
                        thumbnail={g.thumbnail}
                      />
                    </td>
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-left tw-text-iron-50`}
                    >
                      {g.artist}
                    </td>
                    <td
                      className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums`}
                    >
                      {displayDecimal(g.gas)}
                    </td>
                  </tr>
                ))}
                <tr
                  className={GAS_ROYALTIES_TABLE_ROW_CLASS_NAME}
                  key="gas-total"
                >
                  <td
                    colSpan={2}
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-text-iron-300`}
                  >
                    <b>TOTAL</b>
                  </td>
                  <td
                    className={`${GAS_ROYALTIES_TABLE_CELL_CLASS_NAME} tw-text-right tw-font-semibold tw-tabular-nums`}
                  >
                    {displayDecimal(sumGas)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {!fetching && gas.length === 0 && (
          <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-px-4 tw-py-8 tw-text-center">
            <p
              className={`tw-mb-0 tw-text-sm tw-leading-6 ${
                fetchError ? "tw-text-error" : "tw-text-iron-400"
              }`}
            >
              {fetchError ?? "No gas info found for selected dates"}
            </p>
          </div>
        )}
        {!fetching && gas.length > 0 && (
          <div className="tw-pb-3 tw-pt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
            All values are in ETH
          </div>
        )}
      </section>
    </>
  );
}
