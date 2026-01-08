"use client";

import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import type { Gas } from "@/entities/IGas";
import { fetchUrl } from "@/services/6529api";
import { capitalizeEveryWord, displayDecimal } from "@/helpers/Helpers";
import {
  GasRoyaltiesHeader,
  GasRoyaltiesTokenImage,
  useSharedState,
} from "./GasRoyalties";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTitle } from "@/contexts/TitleContext";
import { GasRoyaltiesCollectionFocus } from "@/enums";

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
      <Container className={`no-padding pt-4`}>
        <Row className={`pt-3 ${styles["scrollContainer"]}`}>
          <Col>
            {gas.length > 0 && (
              <Table bordered={false} className={styles["gasTable"]}>
                <thead>
                  <tr>
                    <th>Meme Card (x{gas.length})</th>
                    <th>Artist</th>
                    <th className="text-center">Gas (ETH)</th>
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
                      <td className="text-center">
                        {displayDecimal(g.gas)}
                      </td>
                    </tr>
                  ))}
                  <tr key={`gas-total`}>
                    <td colSpan={2} className="text-right">
                      <b>TOTAL</b>
                    </td>
                    <td className="text-center">{displayDecimal(sumGas)}</td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
        {!fetching && gas.length === 0 && (
          <Row>
            <Col>
              <h5>{fetchError || "No gas info found for selected dates"}</h5>
            </Col>
          </Row>
        )}
        {!fetching && gas.length > 0 && (
          <Row className="font-color-h pt-3 pb-3">
            <Col>All values are in ETH</Col>
          </Row>
        )}
      </Container>
    </>
  );
}
