import React from 'react';
import { render, screen } from '@testing-library/react';
import About100M from '../../pages/about/100m-project';
import FromFibonacciToFidenza from '../../pages/blog/from-fibonacci-to-fidenza';
import EmailProtection from '../../pages/cdn-cgi/l/email-protection';
import EmailSignatures from '../../pages/email-signatures';
import MuseumFund from '../../pages/museum/6529-fund-szn1';
import ConstructionToken from '../../pages/museum/6529-fund-szn1/construction-token';
import ImageWithArrow from '../../pages/museum/6529-fund-szn1/image-with-arrow';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

describe('additional static pages render', () => {
  it('renders 100m project page', () => {
    render(<TestProvider><About100M /></TestProvider>);
    expect(screen.getAllByText(/100M PROJECT/i).length).toBeGreaterThan(0);
  });

  it('renders blog fibonacci page', () => {
    render(<TestProvider><FromFibonacciToFidenza /></TestProvider>);
    expect(screen.getAllByText(/FROM FIBONACCI TO FIDENZA/i).length).toBeGreaterThan(0);
  });

  it('renders email protection page', () => {
    render(<TestProvider><EmailProtection /></TestProvider>);
    expect(screen.getAllByText(/Email Protection/i).length).toBeGreaterThan(0);
  });

  it('renders email signatures page', () => {
    render(<TestProvider><EmailSignatures /></TestProvider>);
    expect(screen.getAllByText(/EMAIL SIGNATURES/i).length).toBeGreaterThan(0);
  });

  it('renders fund szn1 page', () => {
    render(<TestProvider><MuseumFund /></TestProvider>);
    expect(screen.getAllByText(/6529 FUND SZN1/i).length).toBeGreaterThan(0);
  });

  it('renders construction token page', () => {
    render(<TestProvider><ConstructionToken /></TestProvider>);
    expect(screen.getAllByText(/CONSTRUCTION TOKEN/i).length).toBeGreaterThan(0);
  });

  it('renders image with arrow page', () => {
    render(<TestProvider><ImageWithArrow /></TestProvider>);
    expect(screen.getAllByText(/IMAGE WITH ARROW/i).length).toBeGreaterThan(0);
  });
});
