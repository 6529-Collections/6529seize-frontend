import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HeaderActionButtons from '../../../components/header/HeaderActionButtons';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/navigation/ViewContext', () => ({ useViewContext: jest.fn() }));

const { useRouter } = require('next/router');
const { useViewContext } = require('../../../components/navigation/ViewContext');

describe('HeaderActionButtons', () => {
  afterEach(() => jest.clearAllMocks());

  it('navigates to create wave when activeView is waves', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useViewContext as jest.Mock).mockReturnValue({ activeView: 'waves' });

    render(<HeaderActionButtons />);
    const btn = screen.getByRole('button', { name: 'Create Wave' });
    fireEvent.click(btn);
    expect(push).toHaveBeenCalledWith('/waves?new=true', undefined, { shallow: true });
  });

  it('navigates to create DM when activeView is messages', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useViewContext as jest.Mock).mockReturnValue({ activeView: 'messages' });

    render(<HeaderActionButtons />);
    const btn = screen.getByRole('button', { name: 'Create DM' });
    fireEvent.click(btn);
    expect(push).toHaveBeenCalledWith('/waves?new-dm=true', undefined, { shallow: true });
  });

  it('renders nothing when view is not messages or waves', () => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useViewContext as jest.Mock).mockReturnValue({ activeView: 'other' });

    const { container } = render(<HeaderActionButtons />);
    expect(container.firstChild).toBeNull();
  });
});
