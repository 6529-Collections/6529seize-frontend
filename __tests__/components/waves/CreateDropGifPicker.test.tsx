import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CreateDropGifPicker from '../../../components/waves/CreateDropGifPicker';

jest.mock('gif-picker-react', () => ({
  __esModule: true,
  default: ({ onGifClick }: any) => <button onClick={() => onGifClick({ url: 'g' })} data-testid="picker" />,
  Theme: { DARK: 'dark' },
}));

type DialogProps = { isOpen: boolean; onClose: () => void; children: any };
jest.mock('../../../components/mobile-wrapper-dialog/MobileWrapperDialog', () => (props: DialogProps) => (
  <div data-testid="dialog">
    <button aria-label="Close panel" onClick={props.onClose}></button>
    {props.children}
  </div>
));

describe('CreateDropGifPicker', () => {
  it('passes events to picker and dialog', () => {
    const onSelect = jest.fn();
    const setShow = jest.fn();
    process.env.TENOR_API_KEY = 'key';
    render(<CreateDropGifPicker show={true} setShow={setShow} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('picker'));
    expect(onSelect).toHaveBeenCalledWith('g');

    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(setShow).toHaveBeenCalledWith(false);
  });
});
