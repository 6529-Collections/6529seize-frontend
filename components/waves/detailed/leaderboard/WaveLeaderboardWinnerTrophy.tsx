import React from "react";
import { motion } from "framer-motion";

interface WaveLeaderboardWinnerTrophyProps {
  rank: 1 | 2 | 3;
}

const trophyGradients = {
  1: "tw-from-[#E8D48A] tw-via-[#D9A962] tw-to-[#E8D48A]",
  2: "tw-from-[#DDDDDD] tw-via-[#C0C0C0] tw-to-[#DDDDDD]",
  3: "tw-from-[#CD7F32] tw-via-[#B87333] tw-to-[#CD7F32]",
};

export const WaveLeaderboardWinnerTrophy: React.FC<WaveLeaderboardWinnerTrophyProps> = ({
  rank
}) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2 
      }}
      className="tw-relative"
    >
      <div className={`tw-absolute tw-inset-0 tw-bg-gradient-to-r ${trophyGradients[rank]} tw-blur-xl tw-opacity-20`} />
      <svg 
        viewBox="0 0 24 24" 
        className={`tw-w-24 tw-h-24 tw-relative tw-z-10 tw-drop-shadow-lg`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 4v2H4v2h1.3C6 10.5 7.4 12.6 9.6 13.4C10.4 14.4 11.1 15.7 11.5 17c-1.3.4-2.3 1.6-2.4 3H6v2h12v-2h-3.1c-.1-1.4-1.1-2.6-2.4-3 .4-1.3 1.1-2.6 1.9-3.6 2.2-.8 3.6-2.9 4.3-5.4H20V6h-3V4H7Zm2 2h6v.4c-.9 3.1-2 4.6-5 4.6s-4.1-1.5-5-4.6V6h4Z"
          className={`tw-fill-current tw-text-gradient-to-r ${trophyGradients[rank]}`}
        />
      </svg>
    </motion.div>
  );
}; 