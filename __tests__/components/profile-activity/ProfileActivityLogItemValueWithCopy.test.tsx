import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileActivityLogItemValueWithCopy from '../../../components/profile-activity/list/items/utils/ProfileActivityLogItemValueWithCopy';
import { useCopyToClipboard } from 'react-use';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);
jest.mock("react-use", () => ({ useCopyToClipboard: jest.fn() }));
describe('ProfileActivityLogItemValueWithCopy', () => {
  const copy = jest.fn();
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ isReady: true });
    (useCopyToClipboard as jest.Mock).mockReturnValue([null, copy]);
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
  });


  it('copies value on click and shows feedback', async () => {
    render(<ProfileActivityLogItemValueWithCopy title="Address" value="0x1" />);
    
    // Initially should show the title
    expect(screen.getByText('Address')).toBeInTheDocument();
    
    await fireEvent.click(screen.getByRole('button'));
    expect(copy).toHaveBeenCalledWith('0x1');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
