import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { Resolution } from "./NextGenTokenDownload";
import { useEffect, useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export enum ZoomAction {
  IN = "in",
  OUT = "out",
  RESET = "reset",
}

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    show_animation?: boolean;
    is_fullscreen?: boolean;
    resolution?: Resolution;
    show_rarity_score?: boolean;
    show_statistical_score?: boolean;
    isLoading?(loading: boolean): void;
    zoom?: ZoomAction;
    onZoomActionEnd?(): void;
  }>
) {
  const [loading, setLoading] = useState(true);

  const src = useMemo(() => {
    let srcValue = props.token.image_url;
    if (props.resolution) {
      srcValue = props.token.image_url.replace(
        "/png/",
        `/png${props.resolution.toLowerCase()}/`
      );
    }
    return srcValue;
  }, [props.token.image_url, props.resolution]);

  useEffect(() => {
    setLoading(true);
  }, [src]);

  useEffect(() => {
    if (props.isLoading) {
      props.isLoading(loading);
    }
  }, [loading]);

  const actionRef: any = useRef(null);

  useEffect(() => {
    if (props.zoom) {
      if (actionRef.current) {
        switch (props.zoom) {
          case ZoomAction.IN:
            actionRef.current.zoomIn();
            break;
          case ZoomAction.OUT:
            actionRef.current.zoomOut();
            break;
          case ZoomAction.RESET:
            actionRef.current.resetTransform();
            break;
        }
      }
      if (props.onZoomActionEnd) {
        props.onZoomActionEnd();
      }
    }
  }, [props.zoom]);

  function getImage() {
    return (
      <>
        <span className="d-flex flex-column align-items-center">
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            maxScale={20}>
            {({ zoomIn, zoomOut, resetTransform }) => {
              actionRef.current = { zoomIn, zoomOut, resetTransform };
              return (
                <TransformComponent>
                  <img
                    style={{
                      height: props.is_fullscreen ? "100vh" : "auto",
                      width: "auto",
                      maxHeight: "90vh",
                      maxWidth: "100%",
                    }}
                    src={src}
                    alt={props.token.name}
                    onLoad={() => {
                      setLoading(false);
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "/pebbles-loading.jpeg";
                    }}
                  />
                </TransformComponent>
              );
            }}
          </TransformWrapper>
        </span>
        {!props.hide_info && (
          <span className="pt-1 d-flex justify-content-around align-items-center">
            <span>#{props.token.normalised_id}</span>
            {props.show_rarity_score && (
              <TraitScore
                trait="Rarity"
                score={props.token.rarity_score}
                rank={props.token.rarity_score_rank}
              />
            )}
            {props.show_statistical_score && (
              <TraitScore
                trait="Statistical Rarity"
                score={props.token.statistical_score}
                rank={props.token.statistical_score_rank}
              />
            )}
          </span>
        )}
      </>
    );
  }

  function getContent() {
    if (props.show_animation && props.token.animation_url) {
      return (
        <iframe
          style={{
            width: "100%",
            height: props.is_fullscreen ? "100vh" : "90vh",
            marginBottom: "-8px",
          }}
          src={props.token.animation_url ?? props.token.generator?.html}
          title={props.token.name}
        />
      );
    } else {
      return getImage();
    }
  }

  if (props.hide_link) {
    return <>{getContent()}</>;
  }
  return (
    <a
      href={`/nextgen/token/${props.token.id}`}
      className="decoration-none scale-hover unselectable">
      {getContent()}
    </a>
  );
}
