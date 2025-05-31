import React from 'react';
import { render, screen } from '@testing-library/react';
import LadysabrinaPage from '../../pages/author/ladysabrina/index';
import DisneyDeekayPage from '../../pages/blog/disney-deekay-their-secret-to-animation/index';
import EducationCollabPage from '../../pages/education/education-collaboration-form/index';
import GMRedirectPage from '../../pages/gm-or-die-small-mp4/index';
import CryptoAdzPage from '../../pages/museum/6529-fund-szn1/cryptoadz/index';
import EntretiemposPage from '../../pages/museum/6529-fund-szn1/entretiempos/index';
import JiometoryPage from '../../pages/museum/6529-fund-szn1/jiometory-no-compute/index';
import ProtoglyphPage from '../../pages/museum/6529-fund-szn1/proof-grails-protoglyph/index';
import WallPage from '../../pages/museum/6529-fund-szn1/proof-grails-wall/index';
import KeyTrialPage from '../../pages/museum/6529-fund-szn1/the-key-the-trial/index';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const getTitle = () => document.querySelector('title')?.textContent;
const getCanonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');

describe('static SEO pages render correctly', () => {
  it('author page renders with canonical link', () => {
    render(<LadysabrinaPage />);
    expect(getTitle()).toBe('Sabrina Khan, Author at 6529.io');
    expect(getCanonical()).toBe('/author/ladysabrina/');
    expect(screen.getAllByText(/Sabrina Khan/i).length).toBeGreaterThan(0);
  });

  it('blog page renders expected metadata', () => {
    render(<DisneyDeekayPage />);
    expect(getTitle()).toBe('Disney and DeeKay: Their Secret to Animation - 6529.io');
    expect(getCanonical()).toBe('/blog/disney-deekay-their-secret-to-animation/');
    expect(screen.getAllByText(/Disney and DeeKay: Their Secret to Animation/i).length).toBeGreaterThan(0);
  });

  it('education collaboration form page renders', () => {
    render(<EducationCollabPage />);
    expect(getTitle()).toBe('EDUCATION COLLABORATION FORM - 6529.io');
    expect(getCanonical()).toBe('/education/education-collaboration-form/');
    expect(screen.getAllByText(/EDUCATION COLLABORATION FORM/i).length).toBeGreaterThan(0);
  });

  it('gm or die redirect page shows redirect meta', () => {
    render(<GMRedirectPage />);
    expect(getTitle()).toBe('Redirecting...');
    const refresh = document.querySelector('meta[http-equiv="refresh"]');
    expect(refresh?.getAttribute('content')).toContain('gm-or-die-small.mp4');
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('cryptoadz museum page renders', () => {
    render(<CryptoAdzPage />);
    expect(getTitle()).toBe('CRYPTOADZ - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/cryptoadz/');
    expect(screen.getAllByText(/CRYPTOADZ/i).length).toBeGreaterThan(0);
  });

  it('entretiempos museum page renders', () => {
    render(<EntretiemposPage />);
    expect(getTitle()).toBe('ENTRETIEMPOS - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/entretiempos/');
    expect(screen.getAllByText(/ENTRETIEMPOS/i).length).toBeGreaterThan(0);
  });

  it('jiometory no compute museum page renders', () => {
    render(<JiometoryPage />);
    expect(getTitle()).toBe('JIOMETORY NO COMPUTE - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/jiometory-no-compute/');
    expect(screen.getAllByText(/JIOMETORY NO COMPUTE/i).length).toBeGreaterThan(0);
  });

  it('proof grails protoglyph page renders', () => {
    render(<ProtoglyphPage />);
    expect(getTitle()).toBe('PROOF GRAILS - PROTOGLYPH - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/proof-grails-protoglyph/');
    expect(screen.getAllByText(/PROTOGLYPH/i).length).toBeGreaterThan(0);
  });

  it('proof grails wall page renders', () => {
    render(<WallPage />);
    expect(getTitle()).toBe('PROOF GRAILS - WALL - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/proof-grails-wall/');
    expect(screen.getAllByText(/WALL/i).length).toBeGreaterThan(0);
  });

  it('the key the trial page renders', () => {
    render(<KeyTrialPage />);
    expect(getTitle()).toBe('THE KEY - THE TRIAL - 6529.io');
    expect(getCanonical()).toBe('/museum/6529-fund-szn1/the-key-the-trial/');
    expect(screen.getAllByText(/THE KEY/i).length).toBeGreaterThan(0);
  });
});
