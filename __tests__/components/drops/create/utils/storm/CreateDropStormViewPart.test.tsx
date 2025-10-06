import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CreateDropStormViewPart from '@/components/drops/create/utils/storm/CreateDropStormViewPart';

jest.mock('@/components/drops/view/part/DropPart', () => jest.fn(() => <div data-testid="drop-part" />));
jest.mock('@/components/drops/create/utils/storm/CreateDropStormViewPartQuote', () => jest.fn(() => <div data-testid="quote" />));

const DropPartMock = require('@/components/drops/view/part/DropPart');
const QuoteMock = require('@/components/drops/create/utils/storm/CreateDropStormViewPartQuote');

describe('CreateDropStormViewPart', () => {
  beforeEach(() => {
    (global as any).URL.createObjectURL = jest.fn(() => 'blob:url');
    jest.clearAllMocks();
  });

  const baseProps = {
    profile: {} as any,
    part: {
      content: 'c',
      quoted_drop: null,
      media: [new File(['1'], 'f.png', { type: 'image/png' })],
    },
    mentionedUsers: [],
    referencedNfts: [],
    createdAt: 1,
    wave: null,
    dropTitle: null,
    partIndex: 0,
    removePart: jest.fn(),
  };

  it('passes transformed media to DropPart', () => {
    render(<CreateDropStormViewPart {...baseProps} />);
    const call = (DropPartMock as jest.Mock).mock.calls[0][0];
    expect(call.partMedias).toEqual([{ mimeType: 'image/png', mediaSrc: 'blob:url' }]);
  });

  it('renders quoted drop when provided', () => {
    render(<CreateDropStormViewPart {...baseProps} part={{ ...baseProps.part, quoted_drop: { id: 'q' } }} />);
    expect(QuoteMock).toHaveBeenCalled();
  });

  it('calls removePart on click', () => {
    const removePart = jest.fn();
    render(<CreateDropStormViewPart {...baseProps} removePart={removePart} partIndex={3} />);
    fireEvent.click(screen.getByRole('button', { name: /remove part/i }));
    expect(removePart).toHaveBeenCalledWith(3);
  });
});
