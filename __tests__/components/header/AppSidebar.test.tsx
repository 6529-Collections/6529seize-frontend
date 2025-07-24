import React from 'react';
import { render } from '@testing-library/react';
import AppSidebar from '../../../components/header/AppSidebar';

let headerProps: any = null;
let menuProps: any = null;
let connectProps: any = null;

jest.mock('../../../components/header/AppSidebarHeader', () => (props: any) => { headerProps = props; return <div data-testid="header" />; });
jest.mock('../../../components/header/AppSidebarMenuItems', () => (props: any) => { menuProps = props; return <div data-testid="menu" />; });
jest.mock('../../../components/header/AppUserConnect', () => (props: any) => { connectProps = props; return <div data-testid="connect" />; });

jest.mock('../../../components/app-wallets/AppWalletsContext');

(describe => {
  const { useAppWallets } = require('../../../components/app-wallets/AppWalletsContext');

  describe('AppSidebar', () => {
    beforeEach(() => { headerProps = menuProps = connectProps = null; });

    it('includes App Wallets when supported and handles close', () => {
      const onClose = jest.fn();
      (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: true });
      render(<AppSidebar open={true} onClose={onClose} />);
      expect(menuProps.menu.find((m: any) => m.label === 'Tools').children[0]).toEqual({ label: 'App Wallets', path: '/tools/app-wallets' });
      headerProps.onClose();
      expect(onClose).toHaveBeenCalled();
      connectProps.onNavigate();
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('omits App Wallets when unsupported', () => {
      (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: false });
      render(<AppSidebar open={true} onClose={() => {}} />);
      expect(menuProps.menu.find((m: any) => m.label === 'Tools').children[0].label).not.toBe('App Wallets');
    });

    it('renders nothing when closed', () => {
      (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: false });
      const { queryByTestId } = render(<AppSidebar open={false} onClose={() => {}} />);
      expect(queryByTestId('menu')).toBeNull();
    });
  });
})(describe);
