import React from 'react';
import PrenodesPage from '../../pages/network/prenodes';
import { renderWithAuth } from '../utils/testContexts';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('prenodes page', () => {
  it('renders Prenodes page', () => {
    const mockAuthContext = {
      setTitle: jest.fn(),
    };
    
    renderWithAuth(<PrenodesPage />, mockAuthContext);

    expect(mockAuthContext.setTitle).toHaveBeenCalledWith({
      title: "Prenodes | Network",
    });
  });

  it('has correct metadata', () => {
    expect(PrenodesPage.metadata).toEqual({
      title: "Prenodes",
      description: "Network",
    });
  });
});