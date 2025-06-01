import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropActionsOptions from '../../../../components/waves/drops/WaveDropActionsOptions';

jest.mock('../../../../components/drops/view/item/options/delete/DropsListItemDeleteDropModal', () => (props: any) => <div data-testid="modal" onClick={props.closeModal} />);
jest.mock('../../../../components/utils/animation/CommonAnimationWrapper', () => (props: any) => <div>{props.children}</div>);
jest.mock('../../../../components/utils/animation/CommonAnimationOpacity', () => (props: any) => <div>{props.children}</div>);
jest.mock('tippy.js/dist/tippy.css', () => ({}));

test('opens delete modal on click', async () => {
  const user = userEvent.setup();
  render(<WaveDropActionsOptions drop={{ id: '1' } as any} />);
  expect(screen.queryByTestId('modal')).toBeNull();
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('modal')).toBeInTheDocument();
});
