import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LFGButton } from '@/components/lfg-slideshow/LFGSlideshow';
import { commonApiFetch } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');
jest.mock('@/helpers/Helpers', () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: () => true,
}));
jest.mock('react-bootstrap', () => ({ Button: (p: any) => <button onClick={p.onClick}>{p.children}</button> }));
jest.mock('@/components/lfg-slideshow/LFGSlideshow.module.scss', () => ({}));

const mockFetch = commonApiFetch as jest.Mock;

describe('LFGSlideshow', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue([{ image: 'img.png', animation: '' }]);
  });

  it('opens slideshow on button click', async () => {
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'LFG: Start the Show!' }));
    expect(screen.getByAltText('LFG Slide 1')).toBeInTheDocument();
  });
});
