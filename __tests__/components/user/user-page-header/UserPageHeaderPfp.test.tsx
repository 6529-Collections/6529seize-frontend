import { render } from '@testing-library/react';
import UserPageHeaderPfp from '../../../../components/user/user-page-header/pfp/UserPageHeaderPfp';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('UserPageHeaderPfp', () => {
  it('renders image when profile has pfp', () => {
    const { container } = render(
      <UserPageHeaderPfp profile={{ pfp: 'url' } as any} defaultBanner1="#000" defaultBanner2="#fff" />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toContain('url');
  });

  it('renders placeholder when no pfp', () => {
    const { container } = render(
      <UserPageHeaderPfp profile={{} as any} defaultBanner1="#000" defaultBanner2="#fff" />
    );
    expect(container.querySelector('img')).toBeNull();
  });
});
