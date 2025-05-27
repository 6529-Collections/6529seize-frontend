import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('@testing-library/jest-dom');
// Default API endpoint needed for service tests
process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://example.com';
