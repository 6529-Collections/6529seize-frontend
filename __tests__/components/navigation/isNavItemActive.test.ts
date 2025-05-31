import { isNavItemActive } from '../../../components/navigation/isNavItemActive';
import type { NavItem } from '../../../components/navigation/navTypes';
import type { NextRouter } from 'next/router';

function makeRouter(pathname: string, query: Record<string, any> = {}): NextRouter {
  return { pathname, query } as NextRouter;
}

describe('isNavItemActive', () => {
  it('returns true for Network item when on network routes with no active view', () => {
    const item: NavItem = { kind: 'route', name: 'Network', href: '/network', icon: '' } as any;
    const router = makeRouter('/network');
    expect(isNavItemActive(item, router, null, false)).toBe(true);
  });

  it('handles Stream route based on wave query', () => {
    const item: NavItem = { kind: 'route', name: 'Stream', href: '/my-stream', icon: '' } as any;
    const routerNoWave = makeRouter('/my-stream');
    expect(isNavItemActive(item, routerNoWave, null, false)).toBe(true);
    const routerWave = makeRouter('/my-stream', { wave: 'w1' });
    expect(isNavItemActive(item, routerWave, null, false)).toBe(false);
  });

  it('returns true for waves view when viewing non-DM wave sub route', () => {
    const item: NavItem = { kind: 'view', name: 'Waves', viewKey: 'waves', icon: '' } as any;
    const router = makeRouter('/my-stream', { wave: 'x1' });
    expect(isNavItemActive(item, router, null, false)).toBe(true);
  });

  it('returns true for messages view when current wave is DM', () => {
    const item: NavItem = { kind: 'view', name: 'Messages', viewKey: 'messages', icon: '' } as any;
    const router = makeRouter('/my-stream', { wave: 'dm1' });
    expect(isNavItemActive(item, router, null, true)).toBe(true);
  });
});
