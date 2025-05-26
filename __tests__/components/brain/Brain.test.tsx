import React from 'react';
import { render, screen } from '@testing-library/react';

const mockBreakpointFn = jest.fn();

jest.mock('react-use', () => ({
  createBreakpoint: jest.fn(() => mockBreakpointFn),
}));

jest.mock('../../../components/brain/BrainMobile', () => (props: any) => (
  <div data-testid="mobile">{props.children}</div>
));

jest.mock('../../../components/brain/BrainDesktop', () => (props: any) => (
  <div data-testid="desktop">{props.children}</div>
));

import Brain from '../../../components/brain/Brain';

describe('Brain', () => {
  it('renders BrainMobile on small screens', () => {
    mockBreakpointFn.mockReturnValue('S');
    render(<Brain>child</Brain>);
    expect(screen.getByTestId('mobile')).toHaveTextContent('child');
    expect(screen.queryByTestId('desktop')).toBeNull();
  });

  it('renders BrainDesktop otherwise', () => {
    mockBreakpointFn.mockReturnValue('LG');
    render(<Brain>desk</Brain>);
    expect(screen.getByTestId('desktop')).toHaveTextContent('desk');
    expect(screen.queryByTestId('mobile')).toBeNull();
  });
});
