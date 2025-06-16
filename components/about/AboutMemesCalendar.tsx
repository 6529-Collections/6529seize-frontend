import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { MEMES_CALENDARS } from "../../helpers/meme_calendar.helpers";
import { Time } from "../../helpers/time";
import { Fragment } from "react";

export default function AboutMemesCalendar() {
  function isActiveSection(start: Time, end: Time) {
    const now = Time.now();
    return start.lte(now) && end.plusDays(1).gte(now);
  }

  return (
    <Container>
      <Row>
        <Col sm={12} md={{ span: 10, offset: 1 }}>
          <h1>
            <span className="font-lightest">Memes</span> Seasonal Calendar
          </h1>
        </Col>
      </Row>
      {MEMES_CALENDARS.map((calendar) => (
        <Fragment key={calendar.year}>
          <Row className="pt-3">
            <Col
              sm={12}
              md={{ span: 10, offset: 1 }}
              className="font-bolder font-larger">
              {calendar.year}: {calendar.title}
            </Col>
          </Row>
          <Row className="pt-2">
            <Col sm={12} md={{ span: 10, offset: 1 }}>
              <Table bordered={false} className={styles.calendarTable}>
                <tbody>
                  {calendar.blocks.map((block) => (
                    <tr
                      key={block.title}
                      className={
                        isActiveSection(block.start, block.end)
                          ? styles.activeSection
                          : ""
                      }>
                      <td>
                        <Container className="no-padding">
                          <Row>
                            <Col sm={12} md={4}>
                              <b>{block.title}</b>
                            </Col>
                            <Col sm={12} md={8}>
                              {block.start.toMonthAndDayString()}
                              <span
                                style={{
                                  paddingLeft: "10px",
                                  paddingRight: "10px",
                                }}>
                                -
                              </span>
                              {block.end.toMonthAndDayString()}
                            </Col>
                          </Row>
                        </Container>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Fragment>
      ))}
    </Container>
  );
}
