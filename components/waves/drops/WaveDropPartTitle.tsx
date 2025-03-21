import React from 'react';

interface WaveDropPartTitleProps {
  title: string | null;
}

const WaveDropPartTitle: React.FC<WaveDropPartTitleProps> = ({
  title,
}) => {
  if (!title) return null;

  return (
    <p className="tw-font-semibold tw-text-iron-100 tw-text-md tw-mb-0">
      {title}
    </p>
  );
};

export default WaveDropPartTitle;
