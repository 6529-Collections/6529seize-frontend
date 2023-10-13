import { numberWithCommas } from "../../helpers/Helpers";
import styles from "./Address.module.scss";

export enum TagType {
  RANK,
  MEME_SETS,
  MEMES,
  SZN1,
  SZN2,
  SZN3,
  SZN4,
  SZN5,
  GRADIENT,
}

interface TagProps {
  type: TagType;
  text: string;
  value: number;
  text_after?: string;
}

export default function Tag(props: TagProps) {
  function getStyle() {
    switch (props.type) {
      case TagType.RANK:
        return styles.rankTag;
      case TagType.MEME_SETS:
        return styles.memesSetTag;
      case TagType.MEMES:
        return styles.memesTag;
      case TagType.SZN1:
        return styles.memeSzn1Tag;
      case TagType.SZN2:
        return styles.memeSzn2Tag;
      case TagType.SZN3:
        return styles.memeSzn3Tag;
      case TagType.SZN4:
        return styles.memeSzn4Tag;
      case TagType.SZN5:
        return styles.memeSzn5Tag;
      case TagType.GRADIENT:
        return styles.gradientTag;
    }
  }

  return (
    <span className={`mt-2 mb-2 ${styles.tag} ${getStyle()}`}>
      {props.text}
      {numberWithCommas(props.value)}
      {props.text_after}
    </span>
  );
}
