import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import NextGenTokenPreview from "../NextGenTokenPreview";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";

interface Props {
  collection: number;
  start_index: number;
  length: number;
}

export default function NextGenCollectionSlideshow(props: Props) {
  const tokens = Array.from(
    { length: props.length },
    (_, i) => props.start_index + i
  );

  const [currentSlide, setCurrentSlide] = useState(props.start_index);

  return (
    <Container className="pt-4">
      <Row>
        <Col>
          <Swiper
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            slidesPerView={3}
            navigation
            loop
            pagination={{ clickable: true }}
            scrollbar={{ draggable: true }}
            onSlideChange={(swiper) => {
              setCurrentSlide(props.start_index + swiper.realIndex);
            }}>
            {tokens.map((token) => (
              <SwiperSlide key={`nextgen-carousel-${token}`}>
                <NextGenTokenPreview
                  collection={props.collection}
                  token_id={token}
                  hide_info={true}
                  hide_link={true}
                />
              </SwiperSlide>
            ))}
          </Swiper>
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
