"use client";

import { useTitle } from "@/contexts/TitleContext";
import type { Gas } from "@/entities/IGas";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";
import styles from "./GasRoyalties.module.scss";

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
      <div className="tw-pt-4">
        <div className={`tw-pt-3 ${styles["scrollContainer"]}`}>
          {gas.length > 0 && (
            <table className={styles["gasTable"]}>
              <thead>
                <tr>
                  <th>Meme Card (x{gas.length})</th>
                  <th>Artist</th>
                  <th className="tw-text-center">Gas (ETH)</th>
                </tr>
              </thead>
              <tbody>
                {gas.map((g) => (
                  <tr key={`token-${g.token_id}`}>
                    <td>
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
                    <td>{g.artist}</td>
                    <td className="tw-text-center">{displayDecimal(g.gas)}</td>
                  </tr>
                ))}
                <tr key={`gas-total`}>
                  <td colSpan={2} className="tw-text-right">
                    <b>TOTAL</b>
                  </td>
                  <td className="tw-text-center">{displayDecimal(sumGas)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {!fetching && gas.length === 0 && (
          <h5>{fetchError || "No gas info found for selected dates"}</h5>
        )}
        {!fetching && gas.length > 0 && (
          <div className="font-color-h tw-pb-3 tw-pt-3">
            All values are in ETH
          </div>
        )}
      </div>
    </>
  );
}
