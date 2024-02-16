import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";
import { TraitScore } from "./NextGenTokenAbout";
import { NextGenTokenRarityType } from "../../nextgen_helpers";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    info_class?: string;
    show_animation?: boolean;
    is_fullscreen?: boolean;
    rarity_type?: NextGenTokenRarityType;
  }>
) {
  function getTraitScore() {
    if (props.rarity_type) {
      const rarityType = props.rarity_type.toLowerCase();
      const score = rarityType as keyof NextGenToken;
      const rank = `${rarityType}_rank` as keyof NextGenToken;

      return (
        <TraitScore
          score={props.token[score] as number}
          rank={props.token[rank] as number}
        />
      );
    }
    return <></>;
  }
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
          <span
            className={`pt-1 d-flex align-items-center ${
              props.rarity_type
                ? "justify-content-between"
                : "justify-content-center"
            }`}>
            <span className={props.info_class ?? ""}>
              #{props.token.normalised_id}
            </span>
            {getTraitScore()}
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
