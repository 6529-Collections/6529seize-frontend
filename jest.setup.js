import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('@testing-library/jest-dom');

// Mock CSS parsing for react-bootstrap and other CSS-dependent components
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop) => {
      if (prop === 'transition-duration' || prop === 'animation-duration') {
        return '0s';
      }
      return '';
    },
    transitionDuration: '0s',
    animationDuration: '0s'
  })
});

// Mock CSS module imports
global.CSS = {
  supports: () => false,
  escape: (str) => str
};

// Mock DOM methods that Bootstrap modals might use
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});

// Mock CSS functions that dom-helpers/css might use
global.css = (element, property, value) => {
  if (arguments.length === 3) {
    return element;
  }
  if (typeof property === 'string') {
    if (property.includes('duration') || property.includes('delay')) {
      return '0s';
    }
    if (property.includes('margin') || property.includes('padding')) {
      return '0px';
    }
    return '';
  }
  return '';
};

// Mock matchMedia for device detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Default API endpoint needed for service tests
process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://example.com';
