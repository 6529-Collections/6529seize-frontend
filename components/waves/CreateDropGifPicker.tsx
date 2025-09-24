import GifPicker, { Theme } from "gif-picker-react";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

export default function CreateDropGifPicker({
  tenorApiKey,
  show,
  setShow,
  onSelect,
}: {
  readonly tenorApiKey: string;
  readonly show: boolean;
  readonly setShow: (show: boolean) => void;
  readonly onSelect: (gif: string) => void;
}) {
  return (
    <MobileWrapperDialog isOpen={show} onClose={() => setShow(false)} noPadding>
      <GifPicker
        width="100%"
        tenorApiKey={tenorApiKey}
        theme={Theme.DARK}
        onGifClick={(gif) => onSelect(gif.url)}
      />
    </MobileWrapperDialog>
  );
}
