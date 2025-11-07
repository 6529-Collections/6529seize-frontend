"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./GasRoyalties.module.scss";
import { Gas } from "@/entities/IGas";
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

  useEffect(() => {
    const routerFocus = searchParams?.get("focus") as string;
    const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
      (sd) => sd === routerFocus
    );
    if (resolvedFocus) {
      if (resolvedFocus !== collectionFocus) {
        setCollectionFocus(resolvedFocus);
      }
      const title = `Meme Gas - ${capitalizeEveryWord(
        resolvedFocus.replace("-", " ")
      )}`;
      setTitle(title);
    } else {
      router.push(`${pathname}?focus=${GasRoyaltiesCollectionFocus.MEMES}`);
    }
  }, [
    collectionFocus,
    pathname,
    router,
    searchParams,
    setCollectionFocus,
    setTitle,
  ]);

  const [gas, setGas] = useState<Gas[]>([]);
  const [sumGas, setSumGas] = useState(0);

  const getUrlWithParams = useCallback(() => getUrl("gas"), [getUrl]);

  const fetchGas = useCallback(async () => {
    setFetching(true);
    try {
      const res = (await fetchUrl(getUrlWithParams())) as Gas[];
      const normalized = res.map((item) => ({
        ...item,
        gas: Math.round(item.gas * 100000) / 100000,
      }));
      setGas(normalized);
      setSumGas(normalized.reduce((total, item) => total + item.gas, 0));
    } catch (error) {
      console.error("Failed to fetch gas", error);
      setGas([]);
      setSumGas(0);
    } finally {
      setFetching(false);
    }
  }, [getUrlWithParams, setFetching, setGas, setSumGas]);

  const previousCollectionFocusRef = useRef(collectionFocus);

  useEffect(() => {
    if (!collectionFocus) {
      previousCollectionFocusRef.current = collectionFocus;
      return;
    }

    const isNewCollectionFocus =
      previousCollectionFocusRef.current !== collectionFocus;
    previousCollectionFocusRef.current = collectionFocus;

    if (isNewCollectionFocus) {
      setGas([]);
    }

    fetchGas();
  }, [collectionFocus, fetchGas]);

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
        <Row className={`pt-3 ${styles.scrollContainer}`}>
          <Col>
            {gas.length > 0 && (
              <Table bordered={false} className={styles.gasTable}>
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
                        {displayDecimal(g.gas, 2)}
                      </td>
                    </tr>
                  ))}
                  <tr key={`gas-total`}>
                    <td colSpan={2} className="text-right">
                      <b>TOTAL</b>
                    </td>
                    <td className="text-center">{displayDecimal(sumGas, 2)}</td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
        {!fetching && gas.length === 0 && (
          <Row>
            <Col>
              <h5>No gas info found for selected dates</h5>
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
