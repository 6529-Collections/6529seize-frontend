import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    show_animation?: boolean;
    live?: boolean;
    is_fullscreen?: boolean;
    show_rarity_score?: boolean;
    show_statistical_score?: boolean;
  }>
) {
  function getImage() {
    return (
      <>
        <span className="d-flex flex-column align-items-center">
          <Image
            priority
            loading={"eager"}
            width="0"
            height="0"
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "100%",
              maxWidth: "100%",
              padding: "10px",
            }}
            src={props.token.image_url}
            alt={props.token.name}
          />
        </span>
        {!props.hide_info && (
          <span className="d-flex justify-content-around align-items-center">
            <span>#{props.token.normalised_id}</span>
            {props.show_rarity_score && (
              <TraitScore
                trait="Rarity Score"
                score={props.token.rarity_score}
                rank={props.token.rarity_score_rank}
              />
            )}
            {props.show_statistical_score && (
              <TraitScore
                trait="Statistical Score"
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
            height: props.is_fullscreen ? "100vh" : "80vh",
            marginBottom: "-8px",
          }}
          src={
            props.live
              ? props.token.generator_url.replace("metadata", "html")
              : props.token.animation_url
          }
          title={props.token.name}
        />
      );
    } else {
      return getImage();
    }
  }

  if (props.hide_link) {
    return getContent();
  } else {
    return (
      <a
        href={`/nextgen/token/${props.token.id}`}
        className="decoration-none scale-hover unselectable">
        {getContent()}
      </a>
    );
  }
}
