import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutMemesCalendar() {
  return (
    <>
      <Head>
        <title>About - Memes Calendar | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="About - Memes Calendar | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.MEMES_CALENDAR}`}
        />
        <meta property="og:title" content={`About - Memes Calendar`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
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
                  <td>April 1 to April 8</td>
                  <td>Awakening</td>
                </tr>
                <tr>
                  <td>April 9 to June 30</td>
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
      </Container>
    </>
  );
}
