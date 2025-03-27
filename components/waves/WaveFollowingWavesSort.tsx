import React, { useEffect, useRef, useState } from "react";
import { ApiWavesOverviewType } from "../../generated/models/ApiWavesOverviewType";
import DropdownToggleButton from "./sort/DropdownToggleButton";
import DropdownMenu from "./sort/DropdownMenu";
import { WAVE_SORT_LABELS, WAVE_SORT_ORDER } from "./sort/WaveSortConstants";

interface WaveFollowingWavesSortProps {
  readonly selectedOption: ApiWavesOverviewType;
  readonly setSelectedOption: (option: ApiWavesOverviewType) => void;
}

const WaveFollowingWavesSort: React.FC<WaveFollowingWavesSortProps> = ({ 
  selectedOption, 
  setSelectedOption 
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option: ApiWavesOverviewType) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
  };

  const getLabel = (option: ApiWavesOverviewType): string => {
    return WAVE_SORT_LABELS[option] || "Sort by";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="tw-relative" ref={dropdownRef}>
      <div className="tw-group">
        <DropdownToggleButton 
          label={getLabel(selectedOption)} 
          onToggle={toggleDropdown} 
        />
        <DropdownMenu
          isOpen={isDropdownOpen}
          options={WAVE_SORT_ORDER}
          selectedOption={selectedOption}
          getLabel={getLabel}
          onSelect={handleOptionSelect}
        />
      </div>
    </div>
  );
};

export default WaveFollowingWavesSort;