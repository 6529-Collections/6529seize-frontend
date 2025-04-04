import GifPicker, { Theme } from "gif-picker-react";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

export default function CreateDropGifPicker({
  show,
  setShow,
  onSelect,
}: {
  readonly show: boolean;
  readonly setShow: (show: boolean) => void;
  readonly onSelect: (gif: string) => void;
}) {
  return (
    <MobileWrapperDialog isOpen={show} onClose={() => setShow(false)} noPadding>
      <GifPicker
        width="100%"
        tenorApiKey={process.env.TENOR_API_KEY!}
        theme={Theme.DARK}
        onGifClick={(gif) => onSelect(gif.url)}
      />
    </MobileWrapperDialog>
  );
}
