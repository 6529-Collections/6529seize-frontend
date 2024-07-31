import { Col, Container, Row } from "react-bootstrap";
import { MEMES_CALENDARS } from "../../helpers/meme_calendar.helpers";

export default function AboutMemesCalendar() {
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
        <Row key={calendar.year}>
          <Col sm={12} md={{ span: 8, offset: 2 }}>
            <table
              className="table table-bordered"
              style={{
                borderColor: "white",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    style={{ paddingTop: "25px", paddingBottom: "25px" }}
                  >
                    {calendar.year}: {calendar.title}
                  </th>
                </tr>
              </thead>
              <tbody>
                {calendar.blocks.map((block) => (
                  <tr key={block.title}>
                    <td
                      style={{
                        border: "1px solid white",
                        width: "50%",
                        padding: "10px",
                      }}
                    >
                      {block.start.toMonthAndDayString()} to{" "}
                      {block.end.toMonthAndDayString()}
                    </td>
                    <td
                      style={{
                        border: "1px solid white",
                        width: "50%",
                        padding: "10px",
                      }}
                    >
                      {block.title}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Col>
        </Row>
      ))}
    </Container>
  );
}
