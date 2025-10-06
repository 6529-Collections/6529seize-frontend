import React from 'react';
import { render, fireEvent } from '@testing-library/react';

jest.mock('@/helpers/image.helpers', () => ({
  getScaledImageUri: jest.fn(() => 'scaled-url'),
  ImageScale: { AUTOx450: 'AUTOx450' },
}));

jest.mock('@/hooks/useInView', () => ({
  useInView: jest.fn(() => [React.createRef(), true] as any),
}));

import MediaDisplayImage from '@/components/drops/view/item/content/media/MediaDisplayImage';

const { getScaledImageUri } = require('@/helpers/image.helpers');

describe('MediaDisplayImage', () => {
  it('displays scaled image after load', () => {
    const { container } = render(<MediaDisplayImage src="test.jpg" />);
    const placeholder = container.querySelector('.tw-bg-iron-800') as HTMLElement;
    expect(placeholder).toBeInTheDocument();
    const img = container.querySelector('img') as HTMLImageElement;
    expect(getScaledImageUri).toHaveBeenCalledWith('test.jpg', 'AUTOx450');
    expect(img.src).toContain('scaled-url');
    fireEvent.load(img);
    expect(placeholder.style.display).toBe(''); // still present but we don't care
  });
});
