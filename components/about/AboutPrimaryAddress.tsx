"use client";

import { useQuery } from "@tanstack/react-query";
import csvParser from "csv-parser";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

interface PrimaryAddressData {
  profile_id: string;
  handle: string;
  current_primary: string;
  new_primary: string;
}

export default function AboutPrimaryAddress() {
  const tdStyle = {
    border: "1px solid white",
    padding: "15px",
    verticalAlign: "middle",
  };

  const {
    data: primaryAddressData = [],
    isLoading,
    error,
  } = useQuery<PrimaryAddressData[], Error>({
    queryKey: ["primaryAddressData"],
    queryFn: fetchPrimaryAddressData,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>
            On-Chain Primary Address
          </h1>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col className="font-larger font-bolder">Overview</Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <span className="font-bolder">Single Address</span>
          <ul>
            <li className="pt-2">
              Primary address is the wallet address (no other addresses
              involved)
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <span className="font-bolder">Consolidations</span>
          <ul>
            <li className="pt-2">
              By default, the primary address in a consolidation is the one with
              the highest individual TDH
            </li>
            <li className="pt-2">
              If any of the addresses in the consolidation has registered a
              delegation for &quot;Primary Address&quot; use case (997) to an
              address in the same consolidation, then this delegated address
              becomes the Primary address of the consolidation
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col xs={12}>
          The following table shows the profiles which have selected a Primary
          Address other than the default Primary Address in their consolidation,
          and will be updated back to the default Primary Address on{" "}
          <u>Monday 29th April 2024</u>.
        </Col>
        <Col
          xs={12}
          className="pt-3"
          style={{
            overflowX: "auto",
          }}>
          <table className="table">
            <thead>
              <tr>
                <th style={tdStyle}>Profile Handle</th>
                <th style={tdStyle}>Current Selected Primary Address</th>
                <th style={tdStyle}>Primary Address Changed to</th>
              </tr>
            </thead>
            <tbody>
              {primaryAddressData.map((item) => (
                <tr key={item.handle}>
                  <td style={tdStyle}>
                    <Link
                      href={`/${item.current_primary}`}
                      className="decoration-hover-underline">
                      {item.handle}
                    </Link>
                  </td>
                  <td style={tdStyle} className="font-smaller">
                    {item.current_primary}
                  </td>
                  <td style={tdStyle} className="font-smaller">
                    {item.new_primary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Col>
      </Row>
    </Container>
  );
}

async function fetchPrimaryAddressData(): Promise<PrimaryAddressData[]> {
  const response = await fetch("/primary_address.csv");
  if (!response.ok) {
    throw new Error(`Failed to fetch primary address data (${response.status})`);
  }

  const csvContent = await response.text();
  return parsePrimaryAddressCsv(csvContent);
}

function parsePrimaryAddressCsv(csvContent: string): Promise<PrimaryAddressData[]> {
  return new Promise((resolve, reject) => {
    const results: PrimaryAddressData[] = [];

    const parser = csvParser({ headers: false })
      .on("data", (row: Record<string, string>) => {
        results.push({
          profile_id: row["0"]!,
          handle: row["1"]!,
          current_primary: row["2"]!,
          new_primary: row["3"]!,
        });
      })
      .on("end", () => {
        results.sort((a, b) => a.handle.localeCompare(b.handle));
        resolve(results);
      })
      .on("error", (err: Error) => {
        console.error(err);
        reject(new Error("Failed to parse primary address data"));
      });

    try {
      parser.write(csvContent);
      parser.end();
    } catch (err) {
      console.error(err);
      reject(new Error("Failed to parse primary address data"));
    }
  });
}
