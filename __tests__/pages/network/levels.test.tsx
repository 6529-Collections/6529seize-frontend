import React from 'react';
import { render, screen } from '@testing-library/react';
import LevelsPage from '../../../pages/network/levels';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../components/levels/ProgressChart', () => () => <div data-testid="progress-chart" />);
jest.mock('../../../components/levels/TableOfLevels', () => () => <div data-testid="table-of-levels" />);

describe('LevelsPage', () => {
  it('sets title and renders components', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <LevelsPage />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'Levels | Network' });
    expect(screen.getByText('Levels')).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    expect(screen.getByTestId('table-of-levels')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(LevelsPage.metadata).toEqual({ title: 'Levels', description: 'Network' });
  });
});
