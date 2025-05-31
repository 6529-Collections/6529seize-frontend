import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveItem from '../../../../components/waves/list/WaveItem';

jest.mock('@tippyjs/react', () => ({ children }: any) => <div>{children}</div>);
jest.mock('../../../../components/waves/list/WaveItemDropped', () => () => <div data-testid="dropped" />);
jest.mock('../../../../components/waves/list/WaveItemFollow', () => () => <div data-testid="follow" />);

const wave = {
  id: 'w1',
  name: 'My Wave',
  picture: 'pic.jpg',
  metrics: { subscribers_count: 10 },
  author: {
    handle: 'alice',
    pfp: 'pfp.jpg',
    level: 85,
    banner1_color: '#000',
    banner2_color: '#111',
  },
} as any;

describe('WaveItem', () => {
  it('renders wave data', () => {
    render(<WaveItem wave={wave} />);
    expect(screen.getByText('My Wave')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByTestId('dropped')).toBeInTheDocument();
    expect(screen.getByTestId('follow')).toBeInTheDocument();
  });

  it('renders placeholders when no wave', () => {
    render(<WaveItem userPlaceholder="user" titlePlaceholder="title" />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
  });
});
