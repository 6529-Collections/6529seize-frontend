import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveDropActionsOptions from '../../../../components/waves/drops/WaveDropActionsOptions';

jest.mock('../../../../components/utils/animation/CommonAnimationWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>
}));

jest.mock('../../../../components/utils/animation/CommonAnimationOpacity', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="opacity">{children}</div>
}));

jest.mock('../../../../components/drops/view/item/options/delete/DropsListItemDeleteDropModal', () => ({
  __esModule: true,
  default: ({ closeModal }: any) => (
    <div data-testid="modal"><button data-testid="close" onClick={closeModal} /></div>
  )
}));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

describe('WaveDropActionsOptions', () => {
  it('opens and closes delete modal', () => {
    render(<WaveDropActionsOptions drop={{ id: '1' } as any} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('modal')).toBeNull();
  });
});
