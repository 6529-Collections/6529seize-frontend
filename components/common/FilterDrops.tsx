import React from "react";

const FilterPosts: React.FC = () => {
  return (
    <div className="tw-flex tw-items-center tw-bg-iron-950 tw-rounded-md tw-p-0.5">
      <button className="tw-px-3 tw-py-1 tw-text-xs tw-rounded-lg tw-transition-all tw-border-0 tw-bg-iron-700 tw-text-iron-50 tw-shadow-sm">
        All
      </button>
      <button className="tw-px-3 tw-py-1 tw-text-xs tw-rounded-lg tw-transition-all tw-bg-transparent tw-border-0 tw-text-iron-400 hover:tw-text-iron-200">
        Drops
      </button>
    </div>
  );
};

export default FilterPosts;
