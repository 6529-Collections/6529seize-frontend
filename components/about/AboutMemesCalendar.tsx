import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";

export default function AboutMemesCalendar() {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">THE MEMES SEASONAL CALENDAR</h1>
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 10 }}
            md={{ span: 8, offset: 2 }}
            lg={{ span: 8, offset: 2 }}>
            <Table className={styles.calendarTable}>
              <thead>
                <tr>
                  <th colSpan={2}>2022: Year 0 GENESIS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>June 9 to December 16</td>
                  <td>Meme Cards SZN1</td>
                </tr>
                <tr>
                  <td>December 17 to December 31</td>
                  <td>The Festivities</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 10 }}
            md={{ span: 8, offset: 2 }}
            lg={{ span: 8, offset: 2 }}>
            <Table className={styles.calendarTable}>
              <thead>
                <tr>
                  <th colSpan={2}>2023: Year 1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>January 1 to March 31</td>
                  <td>Winter SZN2</td>
                </tr>
                <tr>
                  <td>April 1 to April 16</td>
                  <td>Awakening</td>
                </tr>
                <tr>
                  <td>April 17 to June 30</td>
                  <td>Spring SZN3</td>
                </tr>
                <tr>
                  <td>July 1 to July 8</td>
                  <td>Freedom</td>
                </tr>
                <tr>
                  <td>July 9 to September 30</td>
                  <td>Summer SZN4</td>
                </tr>
                <tr>
                  <td>October 1 to October 8</td>
                  <td>Harvest</td>
                </tr>
                <tr>
                  <td>October 9 to December 15</td>
                  <td>Fall SNZ5</td>
                </tr>
                <tr>
                  <td>December 16 to December 31</td>
                  <td>The Festivities</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col className="text-center">
            <p>
              The Calendar has changed in the past and may change in the future
              for any reason.
            </p>
          </Col>
        </Row>
      </Container>
    </>
  );
}
