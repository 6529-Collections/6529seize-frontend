import { useRef } from "react";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

export default function CreateDropSelectFileGLB({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const randomId = getRandomObjectId();
  return (
    <div
      className="tw-cursor-pointer tw-group tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-800 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      role="button"
      aria-label="Select GLB file"
    >
      <label htmlFor={randomId}>
        <svg
          className="tw-cursor-pointer tw-h-6 tw-w-6 lg:tw-h-5 lg:tw-w-5 tw-text-iron-400 group-hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.5 7.27783L12 12.0001M12 12.0001L3.49997 7.27783M12 12.0001L12 21.5001M21 16.0586V7.94153C21 7.59889 21 7.42757 20.9495 7.27477C20.9049 7.13959 20.8318 7.01551 20.7354 6.91082C20.6263 6.79248 20.4766 6.70928 20.177 6.54288L12.777 2.43177C12.4934 2.27421 12.3516 2.19543 12.2015 2.16454C12.0685 2.13721 11.9315 2.13721 11.7986 2.16454C11.6484 2.19543 11.5066 2.27421 11.223 2.43177L3.82297 6.54288C3.52345 6.70928 3.37369 6.79248 3.26463 6.91082C3.16816 7.01551 3.09515 7.13959 3.05048 7.27477C3 7.42757 3 7.59889 3 7.94153V16.0586C3 16.4013 3 16.5726 3.05048 16.7254C3.09515 16.8606 3.16816 16.9847 3.26463 17.0893C3.37369 17.2077 3.52345 17.2909 3.82297 17.4573L11.223 21.5684C11.5066 21.726 11.6484 21.8047 11.7986 21.8356C11.9315 21.863 12.0685 21.863 12.2015 21.8356C12.3516 21.8047 12.4934 21.726 12.777 21.5684L20.177 17.4573C20.4766 17.2909 20.6263 17.2077 20.7354 17.0893C20.8318 16.9847 20.9049 16.8606 20.9495 16.7254C21 16.5726 21 16.4013 21 16.0586Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <svg
          className="tw-hidden tw-cursor-pointer tw-mt-1 tw-h-7 tw-w-7 lg:tw-h-[1.6rem] lg:tw-w-[1.6rem] tw-text-iron-400 group-hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_8493)">
            <path
              d="M400.904 222.798V128.394C400.904 121.17 395.771 115.04 388.785 113.674L262.689 40.873C258.048 38.193 252.33 38.193 247.689 40.873L118.596 115.405C113.955 118.084 111.096 123.036 111.096 128.395V222.799C61.357 238.448 0 270.747 0 322.863C0 367.586 47.412 406.437 127.305 427.621L121.345 454.913C118.789 466.615 130.386 476.514 141.571 472.04L216.571 442.04C226.493 438.073 229.211 425.246 221.7 417.601L165.7 360.601C157.368 352.123 142.888 356.267 140.345 367.914L133.714 398.277C70.41 381.221 30 352.049 30 322.863C30 297.518 60.686 271.916 111.096 254.399V277.459C111.096 282.818 113.955 287.77 118.596 290.449L248.5 365.449C253.141 368.129 258.859 368.129 263.5 365.449L393.404 290.449C398.045 287.769 400.904 282.818 400.904 277.459V254.399C451.314 271.916 482 297.518 482 322.863C482 378.409 360.002 406.606 300.09 411.547C291.834 412.229 285.694 419.475 286.375 427.731C287.05 435.905 294.21 442.126 302.559 441.446C380.66 434.989 512 401.241 512 322.863C512 270.742 450.626 238.443 400.904 222.798ZM163.737 401.41L184.51 422.554L156.689 433.683L163.737 401.41ZM255.189 71.183L355.093 128.863C342.896 135.905 264.139 181.375 256 186.074C247.12 180.947 169.421 136.088 156.096 128.394L255.189 71.183ZM141.096 154.376L241 212.055V326.478L141.096 268.798V154.376ZM370.904 268.798L271 326.478V212.055L370.904 154.376V268.798Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath id="clip0_8493">
              <rect width="512" height="512" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <input
          id={randomId}
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept=".glb"
          onChange={(e: any) => {
            if (e.target.files) {
              const f = e.target.files[0];
              onFileChange(f);
            }
          }}
        />
      </label>
    </div>
  );
}
