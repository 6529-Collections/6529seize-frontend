import styles from "../NextGen.module.scss";
import { Button, Col, Container, Row } from "react-bootstrap";
import NextGenTokenPreview from "../NextGenTokenPreview";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";

interface Props {
  collection: number;
  collection_name: string;
  start_index: number;
  length: number;
}

const SLIDESHOW_LIMIT = 10;

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const tokens = Array.from(
    { length: Math.min(SLIDESHOW_LIMIT, props.length) },
    (_, i) => props.start_index + i
  );

  const [currentSlide, setCurrentSlide] = useState(props.start_index);

  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="no-padding pb-2">
            <Row>
              <Col>
                <Swiper
                  modules={[Navigation, Pagination, A11y]}
                  spaceBetween={20}
                  slidesPerView={Math.min(4, props.length)}
                  navigation
                  centeredSlides
                  // loop
                  pagination={{ clickable: true }}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(props.start_index + swiper.realIndex);
                  }}>
                  {tokens.map((token) => (
                    <SwiperSlide key={`nextgen-carousel-${token}`}>
                      <NextGenTokenPreview
                        collection={props.collection}
                        token_id={token}
                        hide_info={true}
                        hide_link={false}
                        hide_background={true}
                      />
                    </SwiperSlide>
                  ))}
                  {props.length > SLIDESHOW_LIMIT && (
                    <SwiperSlide>
                      <Container className="no-padding pt-3 pb-3">
                        <Row>
                          <Col
                            style={{ position: "relative" }}
                            className={styles.tokenFrameContainer}>
                            <a
                              href={`/nextgen/collection/${props.collection}/art`}>
                              <Button className="seize-btn btn-white">
                                View All
                              </Button>
                            </a>
                          </Col>
                        </Row>
                      </Container>
                    </SwiperSlide>
                  )}
                </Swiper>
              </Col>
            </Row>
            <Row className="pt-1">
              <Col>
                <a
                  className="font-color-h font-smaller decoration-nonem decoration-hover-underline"
                  href={`/nextgen/token/${currentSlide}`}>
                  {props.collection_name} #{currentSlide}
                </a>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
