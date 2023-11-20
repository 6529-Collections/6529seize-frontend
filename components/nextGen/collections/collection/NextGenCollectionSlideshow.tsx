import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import NextGenTokenPreview from "../NextGenTokenPreview";
import Slider from "react-slick";
import { useState } from "react";

interface Props {
  collection: number;
  start_index: number;
  end_index: number;
}

export default function NextGenCollectionSlideshow(props: Props) {
  const tokens = Array.from(
    { length: props.end_index - props.start_index + 1 },
    (_, i) => props.start_index + i
  );

  const [currentSlide, setCurrentSlide] = useState(props.start_index);

  const sliderSettings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "50px",
    slidesToShow: 3,
    slidesToScroll: 1,
    speed: 500,
    afterChange: (current: number) =>
      setCurrentSlide(current + props.start_index),
  };

  return (
    <Container className="pt-4">
      <Row>
        <Col>
          <Slider {...sliderSettings}>
            {tokens.map((token) => (
              <div key={`nextgen-carousel-${token}`}>
                <NextGenTokenPreview
                  collection={props.collection}
                  token_id={token}
                  hide_info={true}
                  hide_link={true}
                />
              </div>
            ))}
          </Slider>
        </Col>
      </Row>
      <Row>
        <Col>
          <a
            className="font-color-h font-smaller"
            href={`/nextgen/token/${currentSlide}`}>
            #{currentSlide}
          </a>
        </Col>
      </Row>
    </Container>
  );
}
