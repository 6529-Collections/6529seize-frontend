import { render } from '@testing-library/react';
import React from 'react';
import GroupCreateConfig from '../../../../../../components/groups/page/create/config/GroupCreateConfig';
import { GroupCreateWalletsType } from '../../../../../../components/groups/page/create/config/wallets/GroupCreateWallets';

let levelProps: any = null;
let tdhProps: any = null;
let cicProps: any = null;
let repProps: any = null;
let nftsProps: any = null;
let collectionsProps: any = null;
let includeWalletsProps: any = null;
let excludeWalletsProps: any = null;

jest.mock('../../../../../../components/groups/page/create/GroupCreateConfigHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

jest.mock('../../../../../../components/groups/page/create/config/GroupCreateLevel', () => ({
  __esModule: true,
  default: (props: any) => { levelProps = props; return <div data-testid="level" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/GroupCreateTDH', () => ({
  __esModule: true,
  default: (props: any) => { tdhProps = props; return <div data-testid="tdh" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/GroupCreateCIC', () => ({
  __esModule: true,
  default: (props: any) => { cicProps = props; return <div data-testid="cic" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/GroupCreateRep', () => ({
  __esModule: true,
  default: (props: any) => { repProps = props; return <div data-testid="rep" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/nfts/GroupCreateNfts', () => ({
  __esModule: true,
  default: (props: any) => { nftsProps = props; return <div data-testid="nfts" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/nfts/GroupCreateCollections', () => ({
  __esModule: true,
  default: (props: any) => { collectionsProps = props; return <div data-testid="collections" />; },
}));

jest.mock('../../../../../../components/groups/page/create/config/wallets/GroupCreateWallets', () => ({
  __esModule: true,
  GroupCreateWalletsType: { INCLUDE: 'INCLUDE', EXCLUDE: 'EXCLUDE' },
  default: (props: any) => {
    if (props.type === 'INCLUDE') {
      includeWalletsProps = props;
      return <div data-testid="wallets-include" />;
    }
    excludeWalletsProps = props;
    return <div data-testid="wallets-exclude" />;
  },
}));

function renderComponent() {
  const level = { min: 1 } as any;
  const tdh = { min: 2 } as any;
  const cic = { min: 3 } as any;
  const rep = { min: 4 } as any;
  const wallets: string[] | null = ['a'];
  const excludeWallets: string[] | null = ['b'];
  const nfts: any = [];
  const setLevel = jest.fn();
  const setTDH = jest.fn();
  const setCIC = jest.fn();
  const setRep = jest.fn();
  const setWallets = jest.fn();
  const setExcludeWallets = jest.fn();
  const setNfts = jest.fn();

  render(
    <GroupCreateConfig
      level={level}
      tdh={tdh}
      cic={cic}
      rep={rep}
      wallets={wallets}
      excludeWallets={excludeWallets}
      nfts={nfts}
      iAmIncluded={false}
      setLevel={setLevel}
      setTDH={setTDH}
      setCIC={setCIC}
      setRep={setRep}
      setWallets={setWallets}
      setExcludeWallets={setExcludeWallets}
      setNfts={setNfts}
    />
  );

  return { level, tdh, cic, rep, wallets, excludeWallets, nfts, setLevel, setTDH, setCIC, setRep, setWallets, setExcludeWallets, setNfts };
}

describe('GroupCreateConfig', () => {
  beforeEach(() => {
    levelProps = null;
    tdhProps = null;
    cicProps = null;
    repProps = null;
    nftsProps = null;
    collectionsProps = null;
    includeWalletsProps = null;
    excludeWalletsProps = null;
  });

  it('passes props to sub components', () => {
    const refs = renderComponent();

    expect(levelProps.level).toBe(refs.level);
    expect(levelProps.setLevel).toBe(refs.setLevel);

    expect(tdhProps.tdh).toBe(refs.tdh);
    expect(tdhProps.setTDH).toBe(refs.setTDH);

    expect(cicProps.cic).toBe(refs.cic);
    expect(cicProps.setCIC).toBe(refs.setCIC);

    expect(repProps.rep).toBe(refs.rep);
    expect(repProps.setRep).toBe(refs.setRep);

    expect(nftsProps.nfts).toBe(refs.nfts);
    expect(nftsProps.setNfts).toBe(refs.setNfts);

    expect(collectionsProps.nfts).toBe(refs.nfts);
    expect(collectionsProps.setNfts).toBe(refs.setNfts);

    expect(includeWalletsProps.type).toBe(GroupCreateWalletsType.INCLUDE);
    expect(includeWalletsProps.wallets).toBe(refs.wallets);
    expect(includeWalletsProps.setWallets).toBe(refs.setWallets);
    expect(includeWalletsProps.walletsLimit).toBe(10000);

    expect(excludeWalletsProps.type).toBe(GroupCreateWalletsType.EXCLUDE);
    expect(excludeWalletsProps.wallets).toBe(refs.excludeWallets);
    expect(excludeWalletsProps.setWallets).toBe(refs.setExcludeWallets);
    expect(excludeWalletsProps.walletsLimit).toBe(1000);
  });
});
