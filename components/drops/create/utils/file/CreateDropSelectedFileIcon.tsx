import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";

enum FILE_TYPES {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}

export default function CreateDropSelectedFileIcon({
  file,
}: {
  readonly file: File;
}) {
  const getFileType = (file: File | null): FILE_TYPES | null => {
    if (!file) {
      return null;
    }
    if (file.type.includes("image")) {
      return FILE_TYPES.IMAGE;
    }
    if (file.type.includes("video")) {
      return FILE_TYPES.VIDEO;
    }
    if (file.type.includes("audio")) {
      return FILE_TYPES.AUDIO;
    }
    return null;
  };

  const fileType = getFileType(file);

  if (!fileType) {
    return null;
  }

  switch (fileType) {
    case FILE_TYPES.IMAGE:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.27209 20.7279L10.8686 14.1314C11.2646 13.7354 11.4627 13.5373 11.691 13.4632C11.8918 13.3979 12.1082 13.3979 12.309 13.4632C12.5373 13.5373 12.7354 13.7354 13.1314 14.1314L19.6839 20.6839M14 15L16.8686 12.1314C17.2646 11.7354 17.4627 11.5373 17.691 11.4632C17.8918 11.3979 18.1082 11.3979 18.309 11.4632C18.5373 11.5373 18.7354 11.7354 19.1314 12.1314L22 15M10 9C10 10.1046 9.10457 11 8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9ZM6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27976 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3H6.8C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8V16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case FILE_TYPES.VIDEO:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-400"
          width="24"
          height="24"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 12H22M2 7H7M17 7H22M2 17H7M17 17H22M7 22V2M17 22V2M6.8 22H17.2C18.8802 22 19.7202 22 20.362 21.673C20.9265 21.3854 21.3854 20.9265 21.673 20.362C22 19.7202 22 18.8802 22 17.2V6.8C22 5.11984 22 4.27976 21.673 3.63803C21.3854 3.07354 20.9265 2.6146 20.362 2.32698C19.7202 2 18.8802 2 17.2 2H6.8C5.11984 2 4.27976 2 3.63803 2.32698C3.07354 2.6146 2.6146 3.07354 2.32698 3.63803C2 4.27976 2 5.11984 2 6.8V17.2C2 18.8802 2 19.7202 2.32698 20.362C2.6146 20.9265 3.07354 21.3854 3.63803 21.673C4.27976 22 5.11984 22 6.8 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case FILE_TYPES.AUDIO:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18V6.35537C9 5.87383 9 5.63306 9.0876 5.43778C9.16482 5.26565 9.28917 5.11887 9.44627 5.0144C9.62449 4.89588 9.86198 4.8563 10.337 4.77714L19.137 3.31047C19.7779 3.20364 20.0984 3.15023 20.3482 3.243C20.5674 3.32441 20.7511 3.48005 20.8674 3.68286C21 3.91398 21 4.23889 21 4.8887V16M9 18C9 19.6568 7.65685 21 6 21C4.34315 21 3 19.6568 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6568 19.6569 19 18 19C16.3431 19 15 17.6568 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      assertUnreachable(fileType);
      return null;
  }
}
