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
import { NextGenCollection } from "../../../../entities/INextgen";
import useCapacitor from "../../../../hooks/useCapacitor";
import { useIntersectionObserver } from "../../../../hooks/scroll/useIntersectionObserver";
import { formatNameForUrl } from "../../nextgen_helpers";
import styles from "../NextGen.module.scss";
import { NextGenTokenImage } from "../nextgenToken/NextGenTokenImage";
import { useTokenSlideshow } from "./hooks/useTokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
}

// Memoized image component to prevent re-downloads on parent re-renders
const MemoizedTokenImage = memo(NextGenTokenImage);

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  const { displayTokens, onSlideChange } = useTokenSlideshow(props.collection.id);
  
  const getSlidesPerView = useCallback(() => {
    if (window.innerWidth > 1200) {
      return 4;
    } else if (window.innerWidth > 500) {
      return 2;
    }
    return 1;
  }, []);

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
                    onSlideChange(swiper.realIndex);
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
