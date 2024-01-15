import Image from "next/image";
import { NextGenToken } from "../../../../entities/INextgen";

export function NextGenTokenImage(
  props: Readonly<{
    token: NextGenToken;
    hide_link?: boolean;
    hide_info?: boolean;
    show_animation?: boolean;
    live?: boolean;
  }>
) {
  function getImage() {
    return (
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
        {!props.hide_info && (
          <>
            <span>#{props.token.normalised_id}</span>
          </>
        )}
      </span>
    );
  }

  function getContent() {
    if (props.show_animation && props.token.animation_url) {
      return (
        <iframe
          style={{
            width: "100%",
            height: "80vh",
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
