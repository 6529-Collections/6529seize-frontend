import React from 'react';
import { render, screen } from '@testing-library/react';
import ProxyActionRowStatus from '@/components/user/proxy/proxy/list/ProxyActionRowStatus';
import { ProfileProxyActionStatus, ProfileProxySide } from '@/entities/IProxy';
import type { ApiProfileMin } from '@/generated/models/ApiProfileMin';
import { ImageScale } from '@/helpers/image.helpers';
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from '@/__tests__/utils/avatarSrc';


describe('ProxyActionRowStatus', () => {
  const profile: ApiProfileMin = { handle: 'bob', pfp: 'img', id: '1' } as any;

  it('renders label and image', () => {
    render(<ProxyActionRowStatus status={ProfileProxyActionStatus.ACTIVE} statusOwnerProfile={profile} side={ProfileProxySide.GRANTED} />);
    expect(screen.getByText('Granted')).toBeInTheDocument();
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('img');
  });

  it('requests the AUTOx50 derivative of a CDN profile picture', () => {
    render(
      <ProxyActionRowStatus
        status={ProfileProxyActionStatus.ACTIVE}
        statusOwnerProfile={{ ...profile, pfp: CDN_AVATAR_URL }}
        side={ProfileProxySide.GRANTED}
      />
    );
    expect(getRequestedImageSrc(screen.getByRole('img'))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it('renders placeholder when no pfp', () => {
    const { container } = render(<ProxyActionRowStatus status={ProfileProxyActionStatus.REJECTED} statusOwnerProfile={{ ...profile, pfp: undefined }} side={ProfileProxySide.RECEIVED} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
