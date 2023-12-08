import styles from "../NextGen.module.scss";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { NextGenTokenImage } from "../NextGenTokenImage";

interface Props {
  collection: number;
  collection_name: string;
  start_index: number;
  length: number;
}

const SLIDESHOW_LIMIT = -1;

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const tokens = Array.from(
    { length: props.length },
    (_, i) => props.start_index + i
  );

  const [currentSlide, setCurrentSlide] = useState(props.start_index);

  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <Row>
              <Col>
                <Swiper
                  modules={[Navigation, Pagination, A11y]}
                  spaceBetween={20}
                  slidesPerView={Math.min(4, props.length)}
                  navigation
                  centeredSlides
                  loop={props.length > 4}
                  pagination={{ clickable: true }}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(props.start_index + swiper.realIndex);
                  }}>
                  {tokens.map((token) => (
                    <SwiperSlide
                      key={`nextgen-carousel-${token}`}
                      className="pt-2 pb-2">
                      <NextGenTokenImage
                        collection={props.collection}
                        token_id={token}
                        hide_info={currentSlide !== token}
                      />
                    </SwiperSlide>
                  ))}
                  {SLIDESHOW_LIMIT > 0 && props.length > SLIDESHOW_LIMIT && (
                    <SwiperSlide>
                      <Container className="no-padding pt-3 pb-3">
                        <Row>
                          <Col className="d-flex align-items-center justify-content-center">
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
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
