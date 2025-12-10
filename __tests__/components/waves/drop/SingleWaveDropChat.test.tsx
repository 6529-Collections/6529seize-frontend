import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropChat } from '@/components/waves/drop/SingleWaveDropChat';

jest.mock('@/hooks/useCapacitor', () => () => false);
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: () => ({ spaces: { measurementsComplete: true, headerSpace: 10 } }) }));

// Mock useAndroidKeyboard with configurable values
let mockKeyboardVisible = false;
let mockGetContainerStyle = jest.fn((baseStyle: any) => baseStyle);

jest.mock('@/hooks/useAndroidKeyboard', () => ({
  useAndroidKeyboard: () => ({
    isVisible: mockKeyboardVisible,
    keyboardHeight: mockKeyboardVisible ? 350 : 0,
    isAndroid: true,
    getContainerStyle: mockGetContainerStyle,
  }),
}));

let capturedProps: any;
let capturedCreatorProps: any;
jest.mock('@/components/waves/drops/wave-drops-all', () => ({ __esModule: true, default: (props: any) => { capturedProps = props; return <div data-testid="drops-all" />; } }));

jest.mock('@/components/waves/CreateDropWaveWrapper', () => ({ CreateDropWaveWrapper: ({ children }: any) => <div data-testid="wrapper">{children}</div>, CreateDropWaveWrapperContext: { SINGLE_DROP: 'SINGLE_DROP' } }));

jest.mock('@/components/waves/PrivilegedDropCreator', () => ({ __esModule: true, default: (props: any) => { capturedCreatorProps = props; return <button data-testid="creator" type="button" onClick={props.onCancelReplyQuote} data-part={props.activeDrop?.partId} data-action={props.activeDrop?.action} />; }, DropMode: { BOTH: 'BOTH' } }));

// Mock window.matchMedia for useDeviceInfo hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('SingleWaveDropChat', () => {
  beforeEach(() => {
    mockKeyboardVisible = false;
    mockGetContainerStyle.mockClear();
    mockGetContainerStyle.mockImplementation((baseStyle: any) => baseStyle);
  });

  it('handles reply and reset actions', () => {
    const wave: any = { id: 'w1' };
    const drop: any = { id: 'd1' };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    expect(capturedProps.waveId).toBe('w1');
    expect(capturedProps.dropId).toBe('d1');

    act(() => capturedProps.onReply({ drop, partId: 2 }));
    expect(document.querySelector('[data-part="2"]')).toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-testid="creator"]')!);
    expect(document.querySelector('[data-part="1"]')).toBeInTheDocument();
  });

  it('applies 0px padding when keyboard is visible', () => {
    mockKeyboardVisible = true;

    const wave: any = { id: 'w1' };
    const drop: any = { id: 'd1' };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    // getContainerStyle should have been called with paddingBottom: "0px"
    expect(mockGetContainerStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        paddingBottom: '0px',
      }),
      0
    );
  });

  it('applies safe-area-inset-bottom padding when keyboard is hidden', () => {
    mockKeyboardVisible = false;

    const wave: any = { id: 'w1' };
    const drop: any = { id: 'd1' };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    // getContainerStyle should have been called with paddingBottom: safe-area-inset-bottom
    expect(mockGetContainerStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        paddingBottom: 'calc(env(safe-area-inset-bottom))',
      }),
      0
    );
  });
});
