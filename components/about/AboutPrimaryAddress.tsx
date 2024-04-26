import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Readable } from "stream";
import csv from "csv-parser";

interface PrimaryAddressData {
  profile_id: string;
  handle: string;
  current_primary: string;
  new_primary: string;
}

export default function AboutPrimaryAddress() {
  const [data, setData] = useState<PrimaryAddressData[]>([]);

  useEffect(() => {
    const filePath = "/primary_address.csv";
    fetch(filePath)
      .then((response) => response.body)
      .then((body) => {
        const reader = body?.getReader();
        const stream = new Readable({
          read() {
            reader?.read().then(({ done, value }) => {
              if (done) {
                this.push(null);
              } else {
                this.push(value);
              }
            });
          },
        });

        const results: any[] = [];
        stream
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", () => {
            results.sort((a, b) => {
              return a.handle.localeCompare(b.handle);
            });
            setData(results);
          });
      });
  }, []);

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
                <th
                  style={{
                    border: "1px solid white",
                    padding: "15px",
                  }}>
                  Profile Handle
                </th>
                <th
                  style={{
                    border: "1px solid white",
                    padding: "15px",
                  }}>
                  Current Selected Primary Address
                </th>
                <th
                  style={{
                    border: "1px solid white",
                    padding: "15px",
                  }}>
                  Primary Address Changed to
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid white",
                      padding: "15px",
                    }}>
                    <a
                      href={`/${item.current_primary}`}
                      className="decoration-hover-underline">
                      {item.handle}
                    </a>
                  </td>
                  <td
                    style={{
                      border: "1px solid white",
                      padding: "15px",
                    }}
                    className="font-smaller">
                    {item.current_primary}
                  </td>
                  <td
                    style={{
                      border: "1px solid white",
                      padding: "15px",
                    }}
                    className="font-smaller">
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
