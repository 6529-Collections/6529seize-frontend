"use client";

import {
  faArrowCircleRight,
  faPauseCircle,
  faPlayCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useCallback, useEffect, useState, memo, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { A11y, Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import useCapacitor from "../../../../hooks/useCapacitor";
import { useIntersectionObserver } from "../../../../hooks/scroll/useIntersectionObserver";
import { commonApiFetch } from "../../../../services/api/common-api";
import { formatNameForUrl } from "../../nextgen_helpers";
import styles from "../NextGen.module.scss";
import { NextGenTokenImage } from "../nextgenToken/NextGenTokenImage";

interface Props {
  readonly collection: NextGenCollection;
}

const FETCH_SIZE = 50;
const DISPLAY_BUFFER = 20;
const FETCH_TRIGGER = 10;

// Memoized image component to prevent re-downloads on parent re-renders
const MemoizedTokenImage = memo(NextGenTokenImage);

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const getSlidesPerView = useCallback(() => {
    if (window.innerWidth > 1200) {
      return 4;
    } else if (window.innerWidth > 500) {
      return 2;
    }
    return 1;
  }, []);

  const [allTokens, setAllTokens] = useState<NextGenToken[]>([]);
  const [displayTokens, setDisplayTokens] = useState<NextGenToken[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOnServer, setHasMoreOnServer] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());
  const [isInViewport, setIsInViewport] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const slideshowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getSlidesPerView());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getSlidesPerView]);

  useIntersectionObserver(slideshowRef, { threshold: 0.3 }, (entry) =>
    setIsInViewport(entry.isIntersecting)
  );

  // Stop autoplay initially when swiper is created
  useEffect(() => {
    if (swiperInstance?.autoplay) {
      swiperInstance.autoplay.stop();
    }
  }, [swiperInstance]);

  // Control autoplay based on viewport visibility
  useEffect(() => {
    if (swiperInstance?.autoplay) {
      if (isInViewport) {
        swiperInstance.autoplay.start();
      } else {
        swiperInstance.autoplay.stop();
      }
    }
  }, [isInViewport, swiperInstance]);

  const fetchMoreTokens = useCallback(async () => {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${props.collection.id}/tokens?page_size=${FETCH_SIZE}&page=${currentPage}&sort=random`,
    }).then((response) => {
      setAllTokens((prev) => [...prev, ...response.data]);
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
      const newDisplayLength = Math.min(
        displayTokens.length + 10,
        allTokens.length
      );
      setDisplayTokens(allTokens.slice(0, newDisplayLength));
    }

    // Need to fetch more from server?
    if (remainingInAll <= FETCH_TRIGGER && hasMoreOnServer) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentSlide, displayTokens.length, allTokens, hasMoreOnServer]);

  return (
    <Container fluid className={styles.slideshowContainer} ref={slideshowRef}>
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
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  initialSlide={2}
                  spaceBetween={20}
                  slidesPerView={Math.min(slidesPerView, displayTokens.length)}
                  navigation
                  centeredSlides
                  pagination={{ clickable: true }}
                  onSwiper={setSwiperInstance}
                  onSlideChange={(swiper) => {
                    setCurrentSlide(swiper.realIndex);
                  }}
                >
                  {displayTokens.length > 1 && (
                    <SwiperAutoplayButton isInViewport={isInViewport} />
                  )}
                  {displayTokens.map((token, index) => (
                    <SwiperSlide
                      key={`${token.id}-${index}`}
                      className="pt-4 pb-4 unselectable"
                    >
                      <MemoizedTokenImage
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

function SwiperAutoplayButton({
  isInViewport,
}: {
  readonly isInViewport: boolean;
}) {
  const swiper = useSwiper();

  const { isCapacitor } = useCapacitor();

  const [manuallyPaused, setManuallyPaused] = useState(isCapacitor);

  useEffect(() => {
    if (manuallyPaused || !isInViewport) {
      swiper.autoplay.stop();
    } else if (isInViewport && !manuallyPaused) {
      swiper.autoplay.start();
    }
  }, [manuallyPaused, isInViewport, swiper.autoplay]);

  return (
    <div className="text-center">
      <FontAwesomeIcon
        style={{ height: "24px", cursor: "pointer" }}
        onClick={() => {
          setManuallyPaused(!manuallyPaused);
        }}
        icon={manuallyPaused ? faPlayCircle : faPauseCircle}
      />
    </div>
  );
}
