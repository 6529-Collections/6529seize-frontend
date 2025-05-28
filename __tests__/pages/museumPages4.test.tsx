import { render, screen } from '@testing-library/react';
import React from 'react';
import EmmaIndex from '../../pages/emma/index';
import Clonex from '../../pages/museum/6529-fund-szn1/clonex';
import Grifters from '../../pages/museum/6529-fund-szn1/grifters';
import Mfers from '../../pages/museum/6529-fund-szn1/mfers';
import NonEither from '../../pages/museum/6529-fund-szn1/non-either';
import PublicDomain from '../../pages/museum/6529-public-domain';
import AcMuseum from '../../pages/museum/ac-museum';
import Genesis from '../../pages/museum/genesis';
import Entretiempos from '../../pages/museum/genesis/entretiempos';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper', () => ({ children }: any) => <div>{children}</div>);

describe('new static museum pages render', () => {
  it('renders EMMA index page', () => {
    render(<EmmaIndex />);
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });

  it('renders Clonex page', () => {
    render(<Clonex />);
    expect(screen.getAllByText(/CLONEX/i).length).toBeGreaterThan(0);
  });

  it('renders Grifters page', () => {
    render(<Grifters />);
    expect(screen.getAllByText(/GRIFTERS/i).length).toBeGreaterThan(0);
  });

  it('renders Mfers page', () => {
    render(<Mfers />);
    expect(screen.getAllByText(/MFERS/i).length).toBeGreaterThan(0);
  });

  it('renders Non-Either page', () => {
    render(<NonEither />);
    expect(screen.getAllByText(/NON EITHER/i).length).toBeGreaterThan(0);
  });

  it('renders Public Domain page', () => {
    render(<PublicDomain />);
    expect(screen.getAllByText(/PUBLIC DOMAIN/i).length).toBeGreaterThan(0);
  });

  it('renders AC Museum page', () => {
    render(<AcMuseum />);
    expect(screen.getAllByText(/AC COLLECTION/i).length).toBeGreaterThan(0);
  });

  it('renders Genesis page', () => {
    render(<Genesis />);
    expect(screen.getAllByText(/GENESIS/i).length).toBeGreaterThan(0);
  });

  it('renders Entretiempos page', () => {
    render(<Entretiempos />);
    expect(screen.getAllByText(/ENTRETIEMPOS/i).length).toBeGreaterThan(0);
  });
});
