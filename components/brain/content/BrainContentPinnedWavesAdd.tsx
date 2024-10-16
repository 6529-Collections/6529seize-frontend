import React, { useState } from "react";

const BrainContentPinnedWavesAdd: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [waves, setWaves] = useState([
    { id: "wave-1", name: "Memes-Chat" },
    { id: "wave-2", name: "Wave B" },
    { id: "wave-3", name: "Wave C" },
    // Add more waves as needed
  ]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const filteredWaves = waves.filter((wave) =>
    wave.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="tw-relative tw-mt-2">
      <div
        className="tw-size-10 tw-rounded-full tw-bg-transparent tw-border tw-border-dashed tw-border-iron-600 tw-text-iron-600 tw-flex tw-items-center tw-justify-center tw-cursor-pointer hover:tw-border-iron-300 hover:tw-text-iron-300 hover:tw-bg-iron-900 tw-transition-all tw-duration-300"
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
        <div className="tw-absolute tw-top-full tw-left-0 tw-mt-2 tw-w-72 tw-bg-gradient-to-b tw-from-iron-900 tw-to-iron-950 tw-backdrop-blur-lg tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl tw-shadow-2xl tw-z-50 tw-transition-all tw-duration-300 tw-ease-in-out">
          <div className="tw-p-4">
            <div className="tw-relative">
              <input
                type="text"
                placeholder="Search waves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tw-w-full tw-px-4 tw-py-3 tw-bg-iron-800/70 tw-text-iron-200 tw-rounded-xl tw-border tw-border-iron-700/30 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 tw-transition-all tw-duration-300 tw-placeholder-iron-500"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="tw-h-5 tw-w-5 tw-absolute tw-right-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-iron-500 tw-transition-colors tw-duration-300"
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
                <div className="tw-flex tw-items-center tw-space-x-3">
                  <div className="tw-size-8 tw-rounded-full tw-bg-gradient-to-br tw-from-primary-400 tw-to-primary-600 tw-flex tw-items-center tw-justify-center tw-text-white tw-font-bold tw-shadow-md">
                    <span className="tw-text-sm">
                      {wave.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
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
