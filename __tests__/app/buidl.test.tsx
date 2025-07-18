import { render } from '@testing-library/react';
import Buidl from '@/app/buidl/page';
import { AuthContext } from '../../components/auth/Auth';


// Mock TitleContext
jest.mock('../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Buidl page', () => {
  it('renders page', () => {
    render(
      <AuthContext.Provider value={{} as any}>
        <Buidl />
      </AuthContext.Provider>
    );
    // Component renders successfully (no specific UI element to test for this static page)
  });
});
