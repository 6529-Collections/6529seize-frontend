import { render, screen } from '@testing-library/react';
import React from 'react';
import { getJsonData } from '../../../../../../components/nextGen/collections/collectionParts/mint/NextGenMintWidget';

describe('getJsonData', () => {
  it('parses JSON string and renders list', () => {
    const json = JSON.stringify({ foo: 'bar', count: 5 });
    render(getJsonData('abc', json));
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Foo: bar');
    expect(items[1].textContent).toBe('Count: 5');
  });

  it('handles empty object', () => {
    render(getJsonData('def', JSON.stringify({})));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
