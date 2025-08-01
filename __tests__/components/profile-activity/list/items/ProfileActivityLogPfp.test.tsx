import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img {...p} /> }));
import ProfileActivityLogPfp from '../../../../../components/profile-activity/list/items/ProfileActivityLogPfp';
import { ProfileActivityLogType, ProfileActivityLogPfpEdit } from '../../../../../entities/IProfile';

jest.mock("../../../../../components/profile-activity/list/items/utils/ProfileActivityLogItemAction", () => (p: any) => <span>{p.action}</span>);
jest.mock("../../../../../helpers/image.helpers", () => ({ getScaledImageUri: (u: string) => u, ImageScale: {} }));

describe('ProfileActivityLogPfp', () => {
  const base: ProfileActivityLogPfpEdit = {
    type: ProfileActivityLogType.PFP_EDIT,
    timestamp: 0,
    contents: { new_value: '/new.png', old_value: '' }
  } as any;

  it('renders added state when no old value', () => {
    render(<ProfileActivityLogPfp log={{ ...base, contents: { new_value: '/new.png', old_value: '' } }} />);
    expect(screen.getByText('added')).toBeInTheDocument();
    expect(screen.getByAltText('Profile picture').getAttribute('src')).toContain('new.png');
  });

  it('renders changed state with old image', () => {
    render(<ProfileActivityLogPfp log={{ ...base, contents: { new_value: '/new.png', old_value: '/old.png' } }} />);
    expect(screen.getByText('changed')).toBeInTheDocument();
    const imgs = screen.getAllByAltText('Profile picture');
    expect(imgs).toHaveLength(2);
    expect(imgs[0].src).toContain('old.png');
    expect(imgs[1].src).toContain('/new.png');
  });
});
