import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SearchWalletsDisplay } from '../../../components/searchModal/SearchModal';

jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg onClick={props.onClick}>{props.children}</svg> }));
jest.mock('react-bootstrap', () => ({
  Modal: (props: any) => <div>{props.children}</div>,
  InputGroup: (props: any) => <div {...props} />,
  Form: { Control: (props: any) => <input {...props} /> },
  Button: (props: any) => <button {...props} />,
}));

describe('SearchWalletsDisplay', () => {
  it('formats and removes wallets', async () => {
    const set = jest.fn();
    render(<SearchWalletsDisplay searchWallets={['0x1234567890123456789012345678901234567890','bob.eth']} setSearchWallets={set} setShowSearchModal={jest.fn()} />);
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(screen.getByText('bob.eth')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(set).toHaveBeenCalledWith(['bob.eth']);
  });
});

