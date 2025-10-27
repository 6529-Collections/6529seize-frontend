import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IdentitySearch from '@/components/utils/input/identity/IdentitySearch';
import { useQuery } from '@tanstack/react-query';

let receivedProps: any;
jest.mock('@/components/utils/input/profile-search/CommonProfileSearchItems', () => (props: any) => { receivedProps = props; return <div data-testid="items" />; });

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({ getRandomObjectId: () => 'id' }));

describe('IdentitySearch', () => {
  const setIdentity = jest.fn();
  beforeEach(() => {
    receivedProps = undefined;
    (useQuery as jest.Mock).mockReturnValue({ data: [{ handle: 'user' }] });
  });

  it('opens dropdown after typing and selects value', () => {
    render(<IdentitySearch identity={null} setIdentity={setIdentity} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(receivedProps.open).toBe(false);
    fireEvent.change(input, { target: { value: 'a' } });
    expect(receivedProps.open).toBe(true);
    receivedProps.onProfileSelect({ handle: 'user' });
    expect(setIdentity).toHaveBeenCalledWith('user');
  });

  it('clears identity when clear button clicked', () => {
    render(<IdentitySearch identity="bob" setIdentity={setIdentity} />);
    fireEvent.click(screen.getByLabelText('Clear identity'));
    expect(setIdentity).toHaveBeenCalledWith(null);
  });
});
