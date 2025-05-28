import React from 'react';
import { render } from '@testing-library/react';
import Clonex from '../../pages/museum/6529-fund-szn1/clonex';
import Grifters from '../../pages/museum/6529-fund-szn1/grifters';
import GenesisPage from '../../pages/museum/genesis';
import Gazers from '../../pages/museum/genesis/gazers';
import GlitchCrystalMonsters from '../../pages/museum/genesis/glitch-crystal-monsters';
import KaiGen from '../../pages/museum/genesis/kai-gen';
import Labios from '../../pages/museum/genesis/labios';
import ImaginedWorlds from '../../pages/museum/imagined-worlds';
import MuseumDistrict from '../../pages/om/6529-museum-district';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const pages = [
  {
    Component: Clonex,
    title: 'CLONEX - 6529.io',
    canonical: '/museum/6529-fund-szn1/clonex/',
    heading: /CLONEX/i,
  },
  {
    Component: Grifters,
    title: 'GRIFTERS - 6529.io',
    canonical: '/museum/6529-fund-szn1/grifters/',
    heading: /GRIFTERS/i,
  },
  {
    Component: GenesisPage,
    title: 'GENESIS - 6529.io',
    canonical: '/museum/genesis/',
    heading: /GENESIS/i,
  },
  {
    Component: Gazers,
    title: 'GAZERS - 6529.io',
    canonical: '/museum/genesis/gazers/',
    heading: /GAZERS/i,
  },
  {
    Component: GlitchCrystalMonsters,
    title: 'GLITCH CRYSTAL MONSTERS - 6529.io',
    canonical: '/museum/genesis/glitch-crystal-monsters/',
    heading: /GLITCH CRYSTAL MONSTERS/i,
  },
  {
    Component: KaiGen,
    title: 'KAI-GEN - 6529.io',
    canonical: '/museum/genesis/kai-gen/',
    heading: /KAI-GEN/i,
  },
  {
    Component: Labios,
    title: 'LABIOS - 6529.io',
    canonical: '/museum/genesis/labios/',
    heading: /LABIOS/i,
  },
  {
    Component: ImaginedWorlds,
    title: 'IMAGINED WORLDS - 6529.io',
    canonical: '/museum/imagined-worlds/',
    heading: /IMAGINED WORLDS/i,
  },
  {
    Component: MuseumDistrict,
    title: '6529 MUSEUM DISTRICT - 6529.io',
    canonical: '/om/6529-museum-district/',
    heading: /6529 MUSEUM DISTRICT/i,
  },
];

describe('museum pages render correctly', () => {
  pages.forEach(({ Component, title, canonical, heading }) => {
    it(`renders ${title}`, () => {
      render(<Component />);

      const titleEl = document.querySelector('title');
      expect(titleEl?.textContent).toBe(title);

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      expect(canonicalLink?.getAttribute('href')).toBe(canonical);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle?.getAttribute('content')).toBe(title);

      const h1 = document.querySelector('h1');
      expect(h1?.textContent).toMatch(heading);
    });
  });
});
