import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropReply from '@/components/waves/drops/WaveDropReply';

jest.mock('@/components/waves/drops/DropLoading', () => () => <div data-testid="loading" />);
jest.mock('@/components/waves/drops/DropNotFound', () => () => <div data-testid="not-found" />);
jest.mock('@/components/waves/drops/ContentDisplay', () => () => <div data-testid="content" />);

const hookData: any = { drop: null, content: { segments: [] }, isLoading: false };

jest.mock('@/components/waves/drops/useDropContent', () => ({
  useDropContent: () => hookData,
}));

describe('WaveDropReply', () => {
  const baseProps = { dropId: 'd', dropPartId: 1, maybeDrop: null, onReplyClick: jest.fn() };

  it('shows loader when loading', () => {
    hookData.isLoading = true;
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId('loading')).toBeInTheDocument();
  });

  it('shows not found when author missing', () => {
    hookData.isLoading = false;
    hookData.drop = { author: { handle: null } } as any;
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders content when drop valid', () => {
    hookData.drop = { author: { handle: 'alice', pfp: null }, serial_no: 1 } as any;
    const { getByTestId } = render(<WaveDropReply {...baseProps} />);
    expect(getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });
});
