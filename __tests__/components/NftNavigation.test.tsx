import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import NftNavigation from '@/components/nft-navigation/NftNavigation';
import { enterArtFullScreen, fullScreenSupported } from '@/helpers/Helpers';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, className, ...props }: any) => <a href={href} className={className} {...props}>{children}</a> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg data-testid="icon" onClick={props.onClick} /> }));

jest.mock('@/helpers/Helpers', () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: jest.fn(),
}));

const enterArtFullScreenMock = enterArtFullScreen as jest.Mock;
const fullScreenSupportedMock = fullScreenSupported as jest.Mock;

describe('NftNavigation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('disables previous link when at first item', () => {
    fullScreenSupportedMock.mockReturnValue(false);
    render(<NftNavigation nftId={1} path="/art" startIndex={1} endIndex={3} />);
    const links = screen.getAllByRole('link');
    expect(links[0].className).toMatch(/tw-pointer-events-none/);
    expect(links[1].className).not.toMatch(/tw-pointer-events-none/);
  });

  it('shows fullscreen icon and triggers fullscreen', async () => {
    fullScreenSupportedMock.mockReturnValue(true);
    render(
      <NftNavigation
        nftId={2}
        path="/art"
        startIndex={1}
        endIndex={3}
        fullscreenElementId="art-1"
      />
    );
    const icons = screen.getAllByTestId('icon');
    expect(icons).toHaveLength(3);
    await userEvent.click(icons[2]);
    expect(enterArtFullScreenMock).toHaveBeenCalledWith('art-1');
  });
});
