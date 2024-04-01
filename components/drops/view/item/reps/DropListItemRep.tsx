import { DropFull } from "../../../../../entities/IDrop";
import DropListItemRepGive from "./DropListItemRepGive";

export default function DropListItemRep({ drop }: { readonly drop: DropFull }) {
  return (
    <div className="tw-mt-4 tw-flex tw-w-full tw-justify-between tw-items-end">
      <div className="tw-flex tw-flex-col">
        <div className="isolate flex -space-x-1 overflow-hidden">
          <img
            className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
          <img
            className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
          <img
            className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
        </div>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
          <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-gap-x-1 tw-justify-center tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
            <span>Rep</span>
            <span className="tw-text-green tw-font-medium">+1434</span>
          </div>
          <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
            <span>Cool art</span>
            <span className="tw-text-green tw-font-medium">+67</span>
          </div>
          <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
            <span>Grail</span>
            <span className="tw-text-red tw-font-medium">-67</span>
          </div>
        </div>
      </div>
      <DropListItemRepGive />
    </div>
  );
}
