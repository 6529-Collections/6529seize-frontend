import React from 'react';

interface WaveDropPartTitleProps {
  title: string | null;
  dropTypeId?: string;
}

const WaveDropPartTitle: React.FC<WaveDropPartTitleProps> = ({
  title,
  dropTypeId,
}) => {
  if (!title) return null;

  // Check if this is a memes drop
  const isMemesWave = dropTypeId === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  if (isMemesWave) {
    return (
      <h2 className="tw-font-bold tw-text-lg tw-mb-3 tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-amber-300 tw-via-primary-400 tw-to-indigo-400">
        {title}
      </h2>
    );
  }

  return (
    <p className="tw-font-semibold tw-text-primary-400 tw-text-md tw-mb-1">
      {title}
    </p>
  );
};

export default WaveDropPartTitle;
