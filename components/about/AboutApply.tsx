import { faArrowRight, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Container, Row } from "react-bootstrap";

export default function AboutApply() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Apply</span>
          </h1>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <section className="mb-5">
            <h4
              className="pb-2 mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}>
              How Does Submission Work?
            </h4>

            <div
              className="p-4 rounded mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}>
              <p className="fw-bold mb-3">
                There are two ways you can be eligible to submit:
              </p>
              <ul className="list-unstyled mb-0">
                <li className="d-flex mb-3">
                  <span className="text-success me-2">✓</span>
                  <span>
                    <strong>Previous Meme Artist:</strong> You've previously
                    dropped a Meme Card.
                  </span>
                </li>
                <li className="d-flex">
                  <span className="text-success me-2">✓</span>
                  <span>
                    <strong>Community Nomination:</strong> You've been nominated
                    by one or more people giving you at least 50,000
                    "MemesNominee" rep.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-5">
            <h4
              className="pb-2 mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}>
              Seeking a Nomination (New Artists)
            </h4>

            <div
              className="p-4 rounded mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}>
              <p className="mb-4">
                Visit the{" "}
                <a
                  href="https://6529.io/waves?wave=0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-info">
                  The Memes - Seeking Nomination
                </a>{" "}
                wave and share your existing work and story. Community members
                may then nominate you.
              </p>

              <div
                className="mb-4 pb-3"
                style={{ borderBottom: "1px solid rgb(40, 40, 40)" }}>
                <div className="mb-1 fw-bold">Gather Support</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Community members nominate you by allocating their
                  MemesNominee rep. You'll need 50,000 rep total to qualify.
                </div>
              </div>
              <div>
                <div className="mb-1 fw-bold">Qualify</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Once you reach 50,000 rep, you become eligible to submit Meme
                  Cards.
                </div>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <h4
              className="pb-2 mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}>
              Submitting Your Meme Cards (Eligible Artists)
            </h4>

            <div
              className="p-4 rounded mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}>
              <div
                className="mb-4 pb-3"
                style={{ borderBottom: "1px solid rgb(40, 40, 40)" }}>
                <div className="mb-1 fw-bold">Three Active Submissions</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  You can have up to 3 Meme Card designs submitted
                  simultaneously.
                </div>
              </div>

              <div
                className="mb-4 pb-3"
                style={{ borderBottom: "1px solid rgb(40, 40, 40)" }}>
                <div className="mb-1 fw-bold">Replace Submissions</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  If you remove a submission or one of your submissions is
                  selected to be minted, you can submit another card to fill
                  that spot.
                </div>
              </div>

              <div>
                <div className="mb-1 fw-bold">Selection & Scheduling</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Submitted cards appear on a public leaderboard. Cards are
                  ranked based on community support over the past 24 hours
                  (24HV), encouraging sustained engagement over last-minute
                  spikes.
                </div>
                <div
                  className="mt-3 p-3 rounded"
                  style={{
                    backgroundColor: "rgb(20, 20, 20)",
                    border: "1px solid rgb(40, 40, 40)",
                  }}>
                  <div
                    className="mb-2 fw-bold"
                    style={{ color: "rgb(215, 215, 215)" }}>
                    <FontAwesomeIcon
                      icon={faCalendar}
                      width={16}
                      className="me-2"
                    />{" "}
                    Checkpoint Schedule
                  </div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    <div className="d-flex align-items-center mb-1">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}>
                        Monday
                      </span>
                      <span className="ms-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="mx-1"
                        />{" "}
                        minted Wednesday
                      </span>
                    </div>
                    <div className="d-flex align-items-center mb-1">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}>
                        Wednesday
                      </span>
                      <span className="ms-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="mx-1"
                        />{" "}
                        minted Friday
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}>
                        Friday
                      </span>
                      <span className="ms-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="mx-1"
                        />{" "}
                        minted Monday
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <h4
              className="pb-2 mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}>
              Creative Guidelines (Important!)
            </h4>

            <div
              className="p-4 rounded mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}>
              <p style={{ color: "rgb(154, 154, 154)" }} className="mb-3">
                Carefully read the{" "}
                <a
                  href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-info">
                  Artist Brief
                </a>{" "}
                before submitting. It outlines the collection's mission, vision,
                themes, and guidelines. <br /> High-quality, mission-aligned
                submissions perform best. Low-effort or off-theme submissions
                are unlikely to be chosen.
              </p>

              <p style={{ color: "rgb(154, 154, 154)" }} className="mb-3">
                Your Meme Card can be made in any medium — art, photo, video,
                interactive code, or something more experimental.
              </p>

              <p style={{ color: "rgb(154, 154, 154)" }} className="mb-4">
                You're the expert on your art — we're here to help with The
                Memes style and mission. Sharing drafts or brainstorming early
                often leads to better outcomes for everyone.
              </p>

              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgb(40, 40, 40)" }}>
                <div
                  className="mb-4 pb-3"
                  style={{ borderBottom: "1px solid rgb(40, 40, 40)" }}>
                  <div className="mb-1 fw-bold">Need Artistic Feedback?</div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    <span className="text-success me-2">✓</span> DM{" "}
                    <span className="text-light">@6529er</span>
                    {", "}
                    <span className="text-light">@teexels</span>
                    {", and "}
                    <span className="text-light">@darrensrs</span> into a group
                    chat for feedback and creative guidance.
                  </div>
                </div>

                <div>
                  <div className="mb-1 fw-bold">General Questions?</div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    Visit{" "}
                    <a
                      href="https://6529.io/waves?wave=e2dae377-d27d-4a69-8b77-38d88fad4d01"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-info">
                      The Memes - FAQ wave
                    </a>{" "}
                    after reading the{" "}
                    <a
                      href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-info">
                      Artist Brief
                    </a>
                    {"."}
                  </div>
                  <div style={{ color: "rgb(154, 154, 154)" }} className="mt-2">
                    <span className="text-success me-2">✓</span>
                    For other inquiries, email us at{" "}
                    <a
                      href="mailto:collections@6529.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-info">
                      collections@6529.io
                    </a>
                    {"."}
                  </div>
                </div>
              </div>

              <div
                className="p-3 rounded text-center mt-4"
                style={{
                  backgroundColor: "rgb(20, 20, 20)",
                  border: "1px solid rgb(40, 40, 40)",
                }}>
                <p
                  className="mb-0 fst-italic small"
                  style={{ color: "rgb(154, 154, 154)" }}>
                  We receive many messages; thank you for your patience if
                  responses are delayed.
                </p>
              </div>
            </div>
          </section>
        </Col>
      </Row>
    </Container>
  );
}
