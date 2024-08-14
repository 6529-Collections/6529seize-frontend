export default function DropPartReplyButton({
  onReplyButtonClick,
}: {
  readonly onReplyButtonClick: () => void;
}) {
  return (
    <button onClick={onReplyButtonClick}       className="tw-text-iron-500 icon tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 
    tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300">
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.1321 11.423C10.5227 11.0324 10.5227 10.3992 10.1321 10.0087C9.74161 9.61819 9.10845 9.61819 8.71792 10.0087L6.5966 12.1301C6.20608 12.5206 6.20608 13.1538 6.5966 13.5443L8.71792 15.6656C9.10845 16.0561 9.74161 16.0561 10.1321 15.6656C10.5227 15.2751 10.5227 14.6419 10.1321 14.2514L9.71794 13.8372H17.3038C17.8561 13.8372 18.3038 14.2849 18.3038 14.8372V18.8372C18.3038 19.3895 18.7515 19.8372 19.3038 19.8372C19.8561 19.8372 20.3038 19.3895 20.3038 18.8372V14.8372C20.3038 13.1803 18.9606 11.8372 17.3038 11.8372H9.71791L10.1321 11.423Z"
          fill="#93939F"
        />
      </svg>
    </button>
  );
}
