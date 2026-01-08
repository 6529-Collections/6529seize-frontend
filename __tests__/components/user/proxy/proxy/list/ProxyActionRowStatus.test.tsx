import React from 'react';
import { render, screen } from '@testing-library/react';
import ProxyActionRowStatus from '@/components/user/proxy/proxy/list/ProxyActionRowStatus';
import { ProfileProxyActionStatus, ProfileProxySide } from '@/entities/IProxy';
import type { ApiProfileMin } from '@/generated/models/ApiProfileMin';


describe('ProxyActionRowStatus', () => {
  const profile: ApiProfileMin = { handle: 'bob', pfp: 'img', id: '1' } as any;

  it('renders label and image', () => {
    render(<ProxyActionRowStatus status={ProfileProxyActionStatus.ACTIVE} statusOwnerProfile={profile} side={ProfileProxySide.GRANTED} />);
    expect(screen.getByText('Granted')).toBeInTheDocument();
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('img');
  });

  it('renders placeholder when no pfp', () => {
    const { container } = render(<ProxyActionRowStatus status={ProfileProxyActionStatus.REJECTED} statusOwnerProfile={{ ...profile, pfp: undefined }} side={ProfileProxySide.RECEIVED} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
