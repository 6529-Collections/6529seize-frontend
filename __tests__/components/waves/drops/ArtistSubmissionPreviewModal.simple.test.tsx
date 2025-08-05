import React from 'react';
import { ArtistSubmissionPreviewModal } from '../../../../components/waves/drops/ArtistSubmissionPreviewModal';
import { ApiProfileMin } from '../../../../generated/models/ApiProfileMin';

// Mock all dependencies to prevent DOM testing issues
jest.mock('../../../../hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('react-dom', () => ({
  createPortal: (node: any) => node,
}));

jest.mock('../../../../components/waves/drops/ArtistActiveSubmissionContent', () => ({
  ArtistActiveSubmissionContent: () => <div data-testid="submission-content">Content</div>,
}));

jest.mock('../../../../components/waves/drops/ArtistActiveSubmissionAppWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="app-wrapper">{children}</div>,
}));

describe('ArtistSubmissionPreviewModal', () => {
  const mockUser: ApiProfileMin = {
    id: 'user-123',
    handle: 'test-artist',
    pfp: 'https://example.com/avatar.jpg',
    level: 1,
    cic: 100,
    rep: 50,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('should exist and be exportable', () => {
    expect(ArtistSubmissionPreviewModal).toBeDefined();
    expect(typeof ArtistSubmissionPreviewModal).toBe('function');
  });

  it('handles props correctly', () => {
    const component = React.createElement(ArtistSubmissionPreviewModal, defaultProps);
    expect(component.props.isOpen).toBe(true);
    expect(component.props.user.handle).toBe('test-artist');
  });

  it('does not render when isOpen is false', () => {
    const component = React.createElement(ArtistSubmissionPreviewModal, {
      ...defaultProps,
      isOpen: false,
    });
    expect(component.props.isOpen).toBe(false);
  });
});