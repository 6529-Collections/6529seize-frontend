import { render } from '@testing-library/react';
import Buidl from '../../pages/buidl';
import { AuthContext } from '../../components/auth/Auth';

describe('Buidl page', () => {
  it('sets title on mount', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <Buidl />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'BUIDL' });
  });
});
