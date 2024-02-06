import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Image from "next/image";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Col, Container, Row, Table } from "react-bootstrap";
import fs from "fs";
import csvParser from "csv-parser";
import React from "react";

interface DataRow {
  address: string;
  mint_count: number;
  token_data: {
    palettes: string;
  };
}

export const PDF_LINK = "/pebbles/distribution-plan.pdf";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function NextGen(props: any) {
  const pageProps = props.pageProps;

  const dataArtist: DataRow[] = pageProps.dataArtist;
  const data0: DataRow[] = pageProps.data0;
  const data1: DataRow[] = pageProps.data1;

  return (
    <>
      <PebblesHead title="Pebbles Distribution" />
      <main className={styles.main}>
        <Header />
        <Container className="pt-5 pb-5">
          <NextgenLogo />
          <Row className="pt-5">
            <Col>
              <a
                href="/nextgen/pebbles-distribution/pdf"
                className="font-larger font-bolder">
                View Distribution Plan PDF
              </a>
            </Col>
          </Row>
          <Row className="pt-5">
            <Col>
              <h2>Artist Proof</h2>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>{printTable(dataArtist)}</Col>
          </Row>
          <Row className="pt-5">
            <Col>
              <h2>Phase 0</h2>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>{printTable(data0, "Phase 0")}</Col>
          </Row>
          <Row className="pt-5">
            <Col>
              <h2>Phase 1</h2>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>{printTable(data1, "Phase 1")}</Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

async function readCsvFile(path: string) {
  const data: DataRow[] = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(
        csvParser({
          headers: false,
          mapValues: ({ value }) => value.split(","),
        })
      )
      .on("data", (row: any) => {
        const address = row[0][0];
        const mintCount = row[1][0];
        const tokenData = row[2][0];

        data.push({
          address,
          mint_count: parseInt(mintCount, 10),
          token_data: JSON.parse(tokenData),
        });
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        reject(error);
      });
  });

  return data;
}

function printTable(data: DataRow[], phase?: string) {
  return (
    <Table className={styles.distributionTable}>
      <thead>
        <tr>
          <th>Address</th>
          <th className="text-center">Mint Count</th>
          <th className="text-center">Palettes</th>
          {phase && <th className="text-center">Phase</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={`${row.address}-${row.mint_count}-${row.token_data}`}>
            <td>{row.address}</td>
            <td className="text-center">{row.mint_count}</td>
            <td className="text-center">{row.token_data.palettes}</td>
            {phase && <td className="text-center">{phase}</td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export async function getStaticProps() {
  const phaseArtistPath = "./public/pebbles/phase-artist.csv";
  const phase0path = "./public/pebbles/phase-0.csv";
  const phase1path = "./public/pebbles/phase-1.csv";

  const dataArtist: DataRow[] = await readCsvFile(phaseArtistPath);
  const data0: DataRow[] = await readCsvFile(phase0path);
  const data1: DataRow[] = await readCsvFile(phase1path);

  return {
    props: {
      dataArtist,
      data0,
      data1,
    },
  };
}

export function NextgenLogo() {
  return (
    <Row>
      <Col>
        <a href="/nextgen">
          <Image
            width="0"
            height="0"
            style={{ height: "auto", width: "400px" }}
            src="/nextgen-logo.png"
            alt="nextgen"
          />
        </a>
      </Col>
    </Row>
  );
}

export function PebblesHead(
  props: Readonly<{
    title: string;
  }>
) {
  return (
    <Head>
      <title>{props.title}</title>
      <link rel="icon" href="/favicon.ico" />
      <meta name="description" content="NextGen | 6529 SEIZE" />
      <meta
        property="og:url"
        content={`${process.env.BASE_ENDPOINT}/nextgen`}
      />
      <meta property="og:title" content={`${props.title}`} />
      <meta property="og:description" content="NextGen | 6529 Seize" />
      <meta
        property="og:image"
        content={`${process.env.BASE_ENDPOINT}/pebbles-loading.jpeg`}
      />
      <meta name="twitter:card" content="summary_large_image" />
      <link
        rel="preload"
        href={PDF_LINK}
        as="document"
        type="application/pdf"
      />
    </Head>
  );
}
