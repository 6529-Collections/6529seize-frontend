import React from 'react';

const WaveDropPartTitle: React.FC<{ title: string | null }> = ({
  title,
}) => {
  if (!title) return null;

  return (
    <p className="tw-font-semibold tw-text-primary-400 tw-text-md tw-mb-1">
      {title}
    </p>
  );
};

export default WaveDropPartTitle;
