import React, { useState } from "react";

const BrainContentPinnedWavesAdd: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [waves, setWaves] = useState([
    { id: "wave-1", name: "Memes-Chat" },
    { id: "wave-2", name: "Wave B" },
    { id: "wave-3", name: "Wave C" },
  ]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const filteredWaves = waves.filter((wave) =>
    wave.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tw-relative">
      <div
        className="tw-size-14 tw-rounded-full tw-bg-transparent tw-border tw-border-dashed tw-border-iron-600 tw-text-iron-600 tw-flex tw-items-center tw-justify-center tw-cursor-pointer hover:tw-border-iron-300 hover:tw-text-iron-300 hover:tw-bg-iron-900 tw-transition-all tw-duration-300"
        onClick={toggleDropdown}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
          className="tw-size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
      {isDropdownOpen && (
        <div className="tw-absolute tw-top-full tw-left-0 tw-w-72 tw-bg-iron-950 tw-backdrop-blur-lg tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl tw-shadow-2xl tw-z-50 tw-transition-all tw-duration-300 tw-ease-in-out">
          <div className="tw-p-4">
            <div className="tw-relative">
              <input
                type="text"
                placeholder="Search waves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-11 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="tw-h-5 tw-w-5 tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-iron-500 tw-transition-colors tw-duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <ul className="tw-max-h-72 tw-list-none tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-primary-400 tw-scrollbar-track-iron-900 tw-space-y-1 tw-px-4 tw-pb-1">
            {filteredWaves.map((wave) => (
              <li
                key={wave.id}
                className="tw-px-2 tw-py-2.5 tw-rounded-xl hover:tw-bg-iron-800/70 tw-cursor-pointer tw-text-iron-200 tw-transition-all tw-duration-300 tw-ease-in-out hover:tw-scale-105 tw-transform"
              >
                <div className="tw-flex tw-items-center">
                  <div className="tw-mr-3 tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-relative tw-ring-1 tw-ring-white/10"></div>
                  <span className="tw-text-iron-200 tw-font-medium tw-text-sm">
                    {wave.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BrainContentPinnedWavesAdd;
