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

// Default API endpoint needed for service tests
process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://example.com';
