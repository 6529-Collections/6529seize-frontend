import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Navigation, A11y, Autoplay } from "swiper/modules";
import { NextGenTokenImage } from "../nextgenToken/NextGenTokenImage";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { commonApiFetch } from "../../../../services/api/common-api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  collection: NextGenCollection;
}

const SLIDESHOW_LIMIT = 25;

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getSlidesPerView());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function getSlidesPerView() {
    let slides;
    if (window.innerWidth > 1200) {
      slides = 4;
    } else if (window.innerWidth > 500) {
      slides = 2;
    } else {
      slides = 1;
    }

    return slides;
  }

  async function loadNextPage() {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/tokens?page_size=${SLIDESHOW_LIMIT}&page=${page}&sort=random`,
    }).then((response) => {
      setTokens([...tokens, ...response.data]);
      setHasMore(response.next);
    });
  }

  useEffect(() => {
    loadNextPage();
  }, [props.collection.id, page]);

  useEffect(() => {
    if (currentSlide >= tokens.length - 5 && hasMore) {
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
                  modules={[Navigation, A11y, Autoplay]}
                  autoplay={tokens.length > 1 ? { delay: 1000 } : false}
                  spaceBetween={20}
                  slidesPerView={Math.min(slidesPerView, tokens.length)}
                  navigation
                  centeredSlides
                  pagination={{ clickable: true }}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(swiper.realIndex);
                  }}>
                  {tokens.length > 1 && <SwiperAutoplayButton />}
                  {tokens.map((token, index) => (
                    <SwiperSlide
                      key={`nextgen-carousel-${token.id}`}
                      className="pt-2 pb-5 unselectable">
                      <NextGenTokenImage
                        hide_link={currentSlide !== index}
                        token={token}
                        hide_info={currentSlide !== index}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}

function SwiperAutoplayButton() {
  const swiper = useSwiper();

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      swiper.autoplay.stop();
    } else {
      swiper.autoplay.start();
    }
  }, [paused]);

  return (
    <div className="text-center">
      <FontAwesomeIcon
        style={{ height: "22px", cursor: "pointer" }}
        onClick={() => {
          setPaused(!paused);
        }}
        icon={paused ? "play-circle" : "pause-circle"}
      />
    </div>
  );
}
