import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveDropDeleteButton from '../../../../components/utils/button/WaveDropDeleteButton';

jest.mock('../../../../components/utils/animation/CommonAnimationWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock('../../../../components/utils/animation/CommonAnimationOpacity', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="opacity">{children}</div>,
}));

jest.mock('../../../../components/drops/view/item/options/delete/DropsListItemDeleteDropModal', () => ({
  __esModule: true,
  default: ({ onDropDeleted }: any) => (
    <div data-testid="modal"><button data-testid="confirm" onClick={() => onDropDeleted()} /></div>
  ),
}));

describe('WaveDropDeleteButton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('opens modal and navigates back after deletion', () => {
    const back = jest.spyOn(window.history, 'back').mockImplementation();
    render(<WaveDropDeleteButton drop={{ id: '1' } as any} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm'));
    jest.advanceTimersByTime(300);
    expect(back).toHaveBeenCalled();
    back.mockRestore();
  });
});
