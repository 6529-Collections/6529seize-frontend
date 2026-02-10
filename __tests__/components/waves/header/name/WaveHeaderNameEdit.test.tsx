import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderNameEdit from '@/components/waves/header/name/WaveHeaderNameEdit';

jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

let closeFn: () => void;
jest.mock('@/components/waves/header/name/WaveHeaderNameEditModal', () => (props: any) => {
  closeFn = props.onClose;
  return <div data-testid="modal"><button onClick={props.onClose}>close</button></div>;
});

test('opens and closes modal', async () => {
  const user = userEvent.setup();
  render(<WaveHeaderNameEdit wave={{ id: 'w1' } as any} />);
  expect(screen.queryByTestId('modal')).toBeNull();
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('modal')).toBeInTheDocument();
  await user.click(screen.getByText('close'));
  expect(screen.queryByTestId('modal')).toBeNull();
});
