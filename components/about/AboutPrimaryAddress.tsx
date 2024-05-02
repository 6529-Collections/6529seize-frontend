import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import csvParser from "csv-parser";

interface PrimaryAddressData {
  profile_id: string;
  handle: string;
  current_primary: string;
  new_primary: string;
}

export default function AboutPrimaryAddress() {
  const [data, setData] = useState<PrimaryAddressData[]>([]);

  const tdStyle = {
    border: "1px solid white",
    padding: "15px",
    verticalAlign: "middle",
  };

  useEffect(() => {
    const filePath = "/primary_address.csv";
    fetch(filePath)
      .then((response) => response.blob())
      .then((body) => {
        if (body) {
          populateData(body);
        }
      });
  }, []);

  function populateData(body: Blob) {
    const reader = new FileReader();

    reader.onload = async () => {
      const data = reader.result;
      const results: PrimaryAddressData[] = [];

      const parser = csvParser({ headers: false })
        .on("data", (row: any) => {
          const r = {
            profile_id: row["0"],
            handle: row["1"],
            current_primary: row["2"],
            new_primary: row["3"],
          };
          results.push(r);
        })
        .on("end", () => {
          setResults(results);
        })
        .on("error", (err: any) => {
          console.error(err);
        });

      parser.write(data);
      parser.end();
    };
    reader.readAsText(body);
  }

  function setResults(results: PrimaryAddressData[]) {
    results.sort((a, b) => {
      return a.handle.localeCompare(b.handle);
    });
    setData(results);
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="float-none">
            <span className="font-lightest">On-Chain</span> Primary Address
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
              {data.map((item) => (
                <tr key={item.handle}>
                  <td style={tdStyle}>
                    <a
                      href={`/${item.current_primary}`}
                      className="decoration-hover-underline">
                      {item.handle}
                    </a>
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
