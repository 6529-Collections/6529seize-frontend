import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    info_class?: string;
    show_animation?: boolean;
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
              height: props.is_fullscreen ? "100vh" : "auto",
              width: "auto",
              maxHeight: "90vh",
              maxWidth: "100%",
            }}
            src={props.token.image_url}
            alt={props.token.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
        </span>
        {!props.hide_info && (
          <span className="pt-1 d-flex justify-content-around align-items-center">
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
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
