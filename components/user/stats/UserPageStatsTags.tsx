import { Container, Row, Col } from "react-bootstrap";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import Tag, { TagType } from "../../address/Tag";

export default function UserPageStatsTags({
  tdh,
}: {
  readonly tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
}) {
  return (
    <Container className="no-padding">
      {tdh && (
        <>
          <Row>
            <Col className="d-flex align-items-center flex-wrap gap-3">
              <Tag type={TagType.BOOST} text={"Boost x"} value={tdh.boost} />
              {tdh.gradients_balance > 0 && (
                <Tag
                  type={TagType.GRADIENT}
                  text={"Gradients x"}
                  value={tdh.gradients_balance}
                />
              )}
              {tdh.memes_balance > 0 && (
                <Tag
                  type={TagType.MEMES}
                  text={"Memes x"}
                  value={tdh.memes_balance}
                  text_after={
                    tdh.unique_memes !== tdh.memes_balance
                      ? ` (unique x${tdh.unique_memes}) `
                      : ""
                  }
                />
              )}
            </Col>
          </Row>
          <Row className="pt-3">
            <Col className="d-flex align-items-center flex-wrap gap-3">
              {tdh.memes_cards_sets > 0 && (
                <Tag
                  type={TagType.MEME_SETS}
                  text={"Meme Sets x"}
                  value={tdh?.memes_cards_sets}
                />
              )}
              {tdh.memes_cards_sets_szn1 > 0 && (
                <Tag
                  type={TagType.SZN1}
                  text={"Meme Sets SZN1 x"}
                  value={tdh?.memes_cards_sets_szn1}
                />
              )}
              {tdh.memes_cards_sets_szn2 > 0 && (
                <Tag
                  type={TagType.SZN2}
                  text={"Meme Sets SZN2 x"}
                  value={tdh?.memes_cards_sets_szn2}
                />
              )}
              {tdh.memes_cards_sets_szn3 > 0 && (
                <Tag
                  type={TagType.SZN3}
                  text={"Meme Sets SZN3 x"}
                  value={tdh?.memes_cards_sets_szn3}
                />
              )}
              {tdh.memes_cards_sets_szn4 > 0 && (
                <Tag
                  type={TagType.SZN4}
                  text={"Meme Sets SZN4 x"}
                  value={tdh?.memes_cards_sets_szn4}
                />
              )}
              {tdh.memes_cards_sets_szn5 > 0 && (
                <Tag
                  type={TagType.SZN5}
                  text={"Meme Sets SZN5 x"}
                  value={tdh?.memes_cards_sets_szn2}
                />
              )}
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
