import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { MEMES_CALENDARS } from "../../helpers/meme_calendar.helpers";
import { Time } from "../../helpers/time";

export default function AboutMemesCalendar() {
  function isActiveSection(start: Time, end: Time) {
    const now = Time.now();
    return start.lte(now) && end.gte(now);
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Memes</span> Seasonal Calendar
          </h1>
        </Col>
      </Row>
      {MEMES_CALENDARS.map((calendar) => (
        <>
          <Row key={calendar.year} className="pt-3">
            <Col className="font-bolder font-larger">
              {calendar.year}: {calendar.title}
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
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
                      <td className="no-wrap">
                        <b>{block.title}</b>
                      </td>
                      <td>
                        <span className="no-wrap">
                          {block.start.toMonthAndDayString()}
                        </span>
                        <span
                          style={{
                            paddingLeft: "10px",
                            paddingRight: "10px",
                          }}>
                          -
                        </span>
                        <span className="no-wrap">
                          {block.end.toMonthAndDayString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </>
      ))}
    </Container>
  );
}
