"use client";

import {
  faArrowCircleRight,
  faPauseCircle,
  faPlayCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { A11y, Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import useCapacitor from "../../../../hooks/useCapacitor";
import { commonApiFetch } from "../../../../services/api/common-api";
import { formatNameForUrl } from "../../nextgen_helpers";
import styles from "../NextGen.module.scss";
import { NextGenTokenImage } from "../nextgenToken/NextGenTokenImage";

interface Props {
  collection: NextGenCollection;
}

const FETCH_SIZE = 50;
const DISPLAY_BUFFER = 20;
const FETCH_TRIGGER = 10;

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  console.log("re-rendering page");
  const getSlidesPerView = useCallback(() => {
    let slides;
    if (window.innerWidth > 1200) {
      slides = 4;
    } else if (window.innerWidth > 500) {
      slides = 2;
    } else {
      slides = 1;
    }

    return slides;
  }, []);

  const [allTokens, setAllTokens] = useState<NextGenToken[]>([]);
  const [displayTokens, setDisplayTokens] = useState<NextGenToken[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOnServer, setHasMoreOnServer] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getSlidesPerView());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getSlidesPerView]);



  const fetchMoreTokens = useCallback(async () => {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/tokens?page_size=${FETCH_SIZE}&page=${currentPage}&sort=random`,
    }).then((response) => {
      setAllTokens(prev => [...prev, ...response.data]);
      setHasMoreOnServer(response.next);
    });
  }, [props.collection.id, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchMoreTokens();
  }, [fetchMoreTokens]);

  // Update displayTokens when allTokens changes
  useEffect(() => {
    if (allTokens.length > 0 && displayTokens.length === 0) {
      setDisplayTokens(allTokens.slice(0, DISPLAY_BUFFER));
    }
  }, [allTokens, displayTokens.length]);

  // Handle scrolling - expand display or fetch more
  useEffect(() => {
    const remainingInDisplay = displayTokens.length - currentSlide;
    const remainingInAll = allTokens.length - displayTokens.length;

    // Need to expand displayTokens?
    if (remainingInDisplay <= 5 && remainingInAll > 0) {
      const newDisplayLength = Math.min(displayTokens.length + 10, allTokens.length);
      setDisplayTokens(allTokens.slice(0, newDisplayLength));
    }

    // Need to fetch more from server?
    if (remainingInAll <= FETCH_TRIGGER && hasMoreOnServer) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentSlide, displayTokens.length, allTokens.length, hasMoreOnServer]);

  return (
    <Container fluid className={styles.slideshowContainer}>
      <Row>
        <Col>
          <Container className="pt-3 pb-3">
            <Row>
              <Col className="d-flex align-items-center justify-content-end">
                <Link
                  href={`/nextgen/collection/${formatNameForUrl(
                    props.collection.name
                  )}/art`}
                  className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}
                >
                  <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                    View All
                    <FontAwesomeIcon
                      icon={faArrowCircleRight}
                      className={styles.viewAllIcon}
                    />
                  </h5>
                </Link>
              </Col>
            </Row>
            <Row>
              <Col>
                <Swiper
                  modules={[Navigation, A11y, Autoplay]}
                  autoplay
                  spaceBetween={20}
                  slidesPerView={Math.min(slidesPerView, displayTokens.length)}
                  navigation
                  pagination={{ clickable: true }}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(swiper.realIndex);
                  }}
                >
                  {displayTokens.length > 1 && <SwiperAutoplayButton />}
                  {displayTokens.map((token, index) => (
                    <SwiperSlide
                      key={`${token.id}-${index}`}
                      className="pt-4 pb-4 unselectable"
                    >
                      <NextGenTokenImage
                        token={token}
                        info_class="font-smaller"
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

  const { isCapacitor } = useCapacitor();

  const [paused, setPaused] = useState(isCapacitor);

  useEffect(() => {
    if (paused) {
      swiper.autoplay.stop();
    } else {
      swiper.autoplay.start();
    }
  }, [paused, swiper.autoplay]);

  return (
    <div className="text-center">
      <FontAwesomeIcon
        style={{ height: "24px", cursor: "pointer" }}
        onClick={() => {
          setPaused(!paused);
        }}
        icon={paused ? faPlayCircle : faPauseCircle}
      />
    </div>
  );
}
