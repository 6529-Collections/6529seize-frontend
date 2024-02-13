import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { Resolution } from "./NextGenTokenDownload";
import { useMemo } from "react";

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
  }>
) {
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

  function getImage() {
    return (
      <>
        <span className="d-flex flex-column align-items-center">
          <img
            style={{
              height: props.is_fullscreen ? "100vh" : "auto",
              width: "auto",
              maxHeight: "90vh",
              maxWidth: "100%",
            }}
            src={src}
            alt={props.token.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
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
