import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import { NextGenTokenImage } from "../nextgenToken/NextGenTokenImage";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { commonApiFetch } from "../../../../services/api/common-api";

interface Props {
  collection: NextGenCollection;
}

const SLIDES_PER_VIEW = 4;
const SLIDESHOW_LIMIT = 25;

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const startIndex = props.collection.id * 10000000000;
  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [currentSlide, setCurrentSlide] = useState(startIndex);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function loadNextPage() {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/tokens?page_size=${SLIDESHOW_LIMIT}&page=${page}`,
    }).then((response) => {
      setTokens([...tokens, ...response.data]);
      setHasMore(response.next);
    });
  }

  useEffect(() => {
    loadNextPage();
  }, [props.collection.id, page]);

  useEffect(() => {
    if (currentSlide >= startIndex + tokens.length - 5 && hasMore) {
      setPage(page + 1);
    }
  }, [currentSlide]);

  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <Row>
              <Col>
                <Swiper
                  modules={[Navigation, A11y]}
                  spaceBetween={20}
                  slidesPerView={Math.min(
                    SLIDES_PER_VIEW,
                    props.collection.mint_count
                  )}
                  navigation
                  centeredSlides
                  // loop={props.collection.mint_count > SLIDES_PER_VIEW}
                  pagination={{ clickable: true }}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(startIndex + swiper.realIndex);
                  }}>
                  {tokens.map((token) => (
                    <SwiperSlide
                      key={`nextgen-carousel-${token.id}`}
                      className="pt-2 pb-5 unselectable">
                      <NextGenTokenImage
                        token={token}
                        hide_info={currentSlide !== token.id}
                      />
                    </SwiperSlide>
                  ))}
                  {/* {hasMore && (
                    <SwiperSlide>
                      <Container className="no-padding pt-3 pb-3">
                        <Row>
                          <Col className="d-flex align-items-center justify-content-center">
                            <a
                              href={`/nextgen/collection/${props.collection.id}/art`}>
                              <Button className="seize-btn btn-white">
                                View All
                              </Button>
                            </a>
                          </Col>
                        </Row>
                      </Container>
                    </SwiperSlide>
                  )} */}
                </Swiper>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
