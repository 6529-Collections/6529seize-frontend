import CreateDropUploadIcons from "../utils/CreateDropUploadIcons";

export default function CreateDropDesktopFooter() {
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <CreateDropUploadIcons />
      <button>Drop</button>
    </div>
  );
}
