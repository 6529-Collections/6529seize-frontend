import { render, screen } from '@testing-library/react';
import React from 'react';
import DropItemChat from '../../../../components/waves/drops/DropItemChat';
import { ApiDropType } from '../../../../generated/models/ApiDropType';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('../../../../hooks/useDrop', () => ({ useDrop: jest.fn() }));
jest.mock('../../../../helpers/Helpers', () => ({ removeBaseEndpoint: jest.fn((l: string) => l.replace('https://base.com', '')) }));
jest.mock('../../../../components/drops/view/item/content/media/DropListItemContentMedia', () => (props: any) => <div data-testid="media" {...props} />);
jest.mock('../../../../components/waves/drop/SingleWaveDropPosition', () => ({ SingleWaveDropPosition: (p: any) => <div data-testid="position">{p.rank}</div> }));
jest.mock('../../../../components/waves/drop/SingleWaveDropVotes', () => ({ SingleWaveDropVotes: () => <div data-testid="votes" /> }));
jest.mock('../../../../components/waves/ChatItemHrefButtons', () => (p: any) => <div data-testid="href-buttons">{p.relativeHref}</div>);

const { useDrop } = require('../../../../hooks/useDrop');
const { removeBaseEndpoint } = require('../../../../helpers/Helpers');

describe('DropItemChat', () => {
  it('renders fallback link when drop not loaded', () => {
    (useDrop as jest.Mock).mockReturnValue({ drop: null });
    const { container } = render(<DropItemChat href="https://base.com/path" dropId="d1" />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/path');
    expect(link).toHaveTextContent('https://base.com/path');
    expect(removeBaseEndpoint).toHaveBeenCalledWith('https://base.com/path');
  });

  it('shows drop details when loaded', () => {
    (useDrop as jest.Mock).mockReturnValue({
      drop: {
        drop_type: ApiDropType.Participatory,
        parts: [{ media: [{ mime_type: 'image/png', url: 'img' }] }],
        metadata: [{ data_key: 'title', data_value: 'Title' }],
        title: 'T',
        wave: { id: 'w', name: 'Wave' },
        rank: 2,
      },
    });
    render(<DropItemChat href="https://base.com/p" dropId="d1" />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/p');
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByTestId('position')).toHaveTextContent('2');
    expect(screen.getByTestId('media')).toHaveAttribute('media_url', 'img');
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('/p');
  });
});
