import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DropListItemContentMediaImage from '@/components/drops/view/item/content/media/DropListItemContentMediaImage';

jest.mock('@/helpers/image.helpers', () => ({
  getScaledImageUri: (_src: string) => _src,
  ImageScale: { AUTOx450: 'AUTOx450', AUTOx1080: 'AUTOx1080' },
}));

jest.mock('@/helpers/Helpers', () => ({
  fullScreenSupported: () => true,
}));

jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));

jest.mock('@/hooks/useInView', () => ({
  useInView: () => [jest.fn(), true],
}));

beforeEach(() => {
  (global as any).ResizeObserver = class { observe(){} disconnect(){} };
});

describe('DropListItemContentMediaImage', () => {
  it('calls onContainerClick from modal button', () => {
    const onContainerClick = jest.fn();
    render(<DropListItemContentMediaImage src="img" maxRetries={1} onContainerClick={onContainerClick} />);
    const img = screen.getByAltText('Drop media');
    fireEvent.load(img);
    fireEvent.click(img);
    fireEvent.click(screen.getByLabelText('View drop details'));
    expect(onContainerClick).toHaveBeenCalled();
  });
});

describe('DropListItemContentMediaImage retry', () => {
  it('shows error and retries manually', () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={-1} />);
    expect(screen.getByText("Couldn’t load image.")).toBeInTheDocument();
  });
});
