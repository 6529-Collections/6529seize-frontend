import React from 'react';
import { render, screen } from '@testing-library/react';
import NextGenTokenPage from '../../../../../components/nextGen/collections/nextgenToken/NextGenToken';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
  };
});

jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenProvenance', () => () => <div data-testid="provenance" />);
jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenProperties', () => ({
  __esModule: true,
  default: () => <div data-testid='rarity' />,
  NextgenTokenTraits: () => <div data-testid='traits' />,
}));
jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenAbout', () => () => <div data-testid='about' />);
jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenArt', () => () => <div data-testid='art' />);
jest.mock('../../../../../components/nextGen/collections/nextgenToken/NextGenTokenRenderCenter', () => () => <div data-testid='render' />);
jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({
  NextGenBackToCollectionPageLink: () => <div data-testid='back' />,
}));
jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenCollection', () => ({
  ContentView: { ABOUT: 'ABOUT', PROVENANCE: 'PROV', DISPLAY_CENTER: 'CENTER', RARITY: 'RARITY' },
  printViewButton: (cur:any, v:any, setView:any) => <button onClick={() => setView(v)}>{v}</button>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid={props.icon.iconName} style={props.style} onClick={props.onClick} />,
}));

jest.mock('@tippyjs/react', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }: any) => <span data-testid='tippy'>{children}</span> };
});

jest.mock('../../../../../helpers/Helpers', () => ({
  isNullAddress: jest.fn(() => false),
}));

const baseProps = {
  collection: { id: 1, name: 'COL' } as any,
  token: { id: 1, normalised_id: 0, name: 'Token', owner: '0x1', burnt: false } as any,
  traits: [] as any[],
  tokenCount: 2,
  view: 'ABOUT' as any,
  setView: jest.fn(),
};

function renderComponent(props?: Partial<typeof baseProps>) {
  return render(<NextGenTokenPage {...baseProps} {...props} />);
}

describe('NextGenTokenPage navigation', () => {
  it('disables previous button on first token', () => {
    renderComponent();
    const prev = screen.getByTestId('circle-chevron-left');
    expect(prev.getAttribute('style')).toContain('color: rgb(154, 154, 154)');
    expect(prev.parentElement?.getAttribute('data-testid')).not.toBe('tippy');
  });

  it('enables previous button when not first token', () => {
    renderComponent({ token: { ...baseProps.token, normalised_id: 1, id: 2 } });
    const prev = screen.getByTestId('circle-chevron-left');
    expect(prev.getAttribute('style')).toContain('color: rgb(255, 255, 255)');
    expect(prev.parentElement?.getAttribute('data-testid')).toBe('tippy');
  });

  it('shows burnt icon when burnt', () => {
    renderComponent({ token: { ...baseProps.token, burnt: true } });
    expect(screen.getByTestId('fire')).toBeInTheDocument();
  });
});
