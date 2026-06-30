import { faArrowRight, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";

export default function AboutApply() {
  const borderBottom = "1px solid rgb(40, 40, 40)";
  return (
    <Container>
      <Row>
        <Col>
          <h1>Apply</h1>
        </Col>
      </Row>
      <Row className="tw-pt-3 tw-pb-3">
        <Col>
          <section className="tw-mb-5">
            <h4
              className="tw-pb-2 tw-mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}
            >
              How Does Submission Work?
            </h4>

            <div
              className="tw-p-4 tw-rounded tw-mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}
            >
              <p className="tw-font-bold tw-mb-3">
                There are two ways you can be eligible to submit:
              </p>
              <ul className="tw-list-none tw-mb-0">
                <li className="tw-flex tw-mb-3">
                  <span className="tw-text-[#198754] tw-mr-2">✓</span>
                  <span>
                    <strong>Previous Meme Artist:</strong> You've previously
                    dropped a Meme Card.
                  </span>
                </li>
                <li className="tw-flex">
                  <span className="tw-text-[#198754] tw-mr-2">✓</span>
                  <span>
                    <strong>Community Nomination:</strong> You've been nominated
                    by one or more people giving you at least 50,000
                    "MemesNominee" rep.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="tw-mb-5">
            <h4
              className="tw-pb-2 tw-mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}
            >
              Seeking a Nomination (New Artists)
            </h4>

            <div
              className="tw-p-4 tw-rounded tw-mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}
            >
              <p className="tw-mb-4">
                Visit the{" "}
                <a
                  href="https://6529.io/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-[#0dcaf0]"
                >
                  The Memes - Seeking Nomination
                </a>{" "}
                wave and share your existing work and story. Community members
                may then nominate you.
              </p>

              <div className="tw-mb-4 tw-pb-3" style={{ borderBottom: borderBottom }}>
                <div className="tw-mb-1 tw-font-bold">Gather Support</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Community members nominate you by allocating their
                  MemesNominee rep. You'll need 50,000 rep total to qualify.
                </div>
              </div>
              <div>
                <div className="tw-mb-1 tw-font-bold">Qualify</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Once you reach 50,000 rep, you become eligible to submit Meme
                  Cards.
                </div>
              </div>
            </div>
          </section>

          <section className="tw-mb-5">
            <h4
              className="tw-pb-2 tw-mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}
            >
              Submitting Your Meme Cards (Eligible Artists)
            </h4>

            <div
              className="tw-p-4 tw-rounded tw-mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}
            >
              <div className="tw-mb-4 tw-pb-3" style={{ borderBottom: borderBottom }}>
                <div className="tw-mb-1 tw-font-bold">Three Active Submissions</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  You can have up to 3 Meme Card designs submitted
                  simultaneously.
                </div>
              </div>

              <div className="tw-mb-4 tw-pb-3" style={{ borderBottom: borderBottom }}>
                <div className="tw-mb-1 tw-font-bold">Replace Submissions</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  If you remove a submission or one of your submissions is
                  selected to be minted, you can submit another card to fill
                  that spot.
                </div>
              </div>

              <div>
                <div className="tw-mb-1 tw-font-bold">Selection & Scheduling</div>
                <div style={{ color: "rgb(154, 154, 154)" }}>
                  Submitted cards appear on a public leaderboard. Cards are
                  ranked based on community support over the past 24 hours
                  (24HV), encouraging sustained engagement over last-minute
                  spikes.
                </div>
                <div
                  className="tw-mt-3 tw-p-3 tw-rounded"
                  style={{
                    backgroundColor: "rgb(20, 20, 20)",
                    border: borderBottom,
                  }}
                >
                  <div
                    className="tw-mb-2 tw-font-bold"
                    style={{ color: "rgb(215, 215, 215)" }}
                  >
                    <FontAwesomeIcon
                      icon={faCalendar}
                      width={16}
                      className="tw-mr-2"
                    />{" "}
                    Checkpoint Schedule
                  </div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    <div className="tw-flex tw-items-center tw-mb-1">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}
                      >
                        Monday
                      </span>
                      <span className="tw-ml-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="tw-mx-1"
                        />{" "}
                        minted Wednesday
                      </span>
                    </div>
                    <div className="tw-flex tw-items-center tw-mb-1">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}
                      >
                        Wednesday
                      </span>
                      <span className="tw-ml-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="tw-mx-1"
                        />{" "}
                        minted Friday
                      </span>
                    </div>
                    <div className="tw-flex tw-items-center">
                      <span
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "bold",
                          width: "100px",
                        }}
                      >
                        Friday
                      </span>
                      <span className="tw-ml-2">
                        17:00 GMT{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          width={12}
                          className="tw-mx-1"
                        />{" "}
                        minted Monday
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="tw-mb-5">
            <h4
              className="tw-pb-2 tw-mb-4"
              style={{
                color: "rgb(215, 215, 215)",
                borderBottom: "1px solid rgb(68, 68, 68)",
              }}
            >
              Creative Guidelines (Important!)
            </h4>

            <div
              className="tw-p-4 tw-rounded tw-mb-4"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}
            >
              <p style={{ color: "rgb(154, 154, 154)" }} className="tw-mb-3">
                Carefully read the{" "}
                <a
                  href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-[#0dcaf0]"
                >
                  Artist Brief
                </a>{" "}
                before submitting. It outlines the collection's mission, vision,
                themes, and guidelines. <br /> High-quality, mission-aligned
                submissions perform best. Low-effort or off-theme submissions
                are unlikely to be chosen.
              </p>

              <p style={{ color: "rgb(154, 154, 154)" }} className="tw-mb-3">
                Your Meme Card can be made in any medium — art, photo, video,
                interactive code, or something more experimental.
              </p>

              <p style={{ color: "rgb(154, 154, 154)" }} className="tw-mb-4">
                You're the expert on your art — we're here to help with The
                Memes style and mission. Sharing drafts or brainstorming early
                often leads to better outcomes for everyone.
              </p>

              <div className="tw-mt-4 tw-pt-4" style={{ borderTop: borderBottom }}>
                <div
                  className="tw-mb-4 tw-pb-3"
                  style={{ borderBottom: borderBottom }}
                >
                  <div className="tw-mb-1 tw-font-bold">Need Artistic Feedback?</div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    <span className="tw-text-[#198754] tw-mr-2">✓</span> DM{" "}
                    <span className="tw-text-[#f8f9fa]">@6529er</span>
                    {", "}
                    <span className="tw-text-[#f8f9fa]">@teexels</span>
                    {", and "}
                    <span className="tw-text-[#f8f9fa]">@darrensrs</span> into a group
                    chat for feedback and creative guidance.
                  </div>
                </div>

                <div>
                  <div className="tw-mb-1 tw-font-bold">General Questions?</div>
                  <div style={{ color: "rgb(154, 154, 154)" }}>
                    Visit{" "}
                    <a
                      href="https://6529.io/waves/e2dae377-d27d-4a69-8b77-38d88fad4d01"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-text-[#0dcaf0]"
                    >
                      The Memes - FAQ wave
                    </a>{" "}
                    after reading the{" "}
                    <a
                      href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-text-[#0dcaf0]"
                    >
                      Artist Brief
                    </a>
                    {"."}
                  </div>
                  <div style={{ color: "rgb(154, 154, 154)" }} className="tw-mt-2">
                    <span className="tw-text-[#198754] tw-mr-2">✓</span>
                    For other inquiries, email us at{" "}
                    <a
                      href="mailto:collections@6529.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-text-[#0dcaf0]"
                    >
                      collections@6529.io
                    </a>
                    {"."}
                  </div>
                </div>
              </div>

              <div
                className="tw-p-3 tw-rounded tw-text-center tw-mt-4"
                style={{
                  backgroundColor: "rgb(20, 20, 20)",
                  border: borderBottom,
                }}
              >
                <p
                  className="tw-mb-0 tw-italic tw-text-sm"
                  style={{ color: "rgb(154, 154, 154)" }}
                >
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
