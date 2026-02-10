import React from 'react';
import { render } from '@testing-library/react';
import { TraitField } from '@/components/waves/memes/traits/TraitField';
import { FieldType } from '@/components/waves/memes/traits/schema';

const TextTraitMock = jest.fn(() => <div data-testid="text" />);
const NumberTraitMock = jest.fn(() => <div data-testid="number" />);
const DropdownTraitMock = jest.fn(() => <div data-testid="dropdown" />);
const BooleanTraitMock = jest.fn(() => <div data-testid="boolean" />);

jest.mock('@/components/waves/memes/traits/TextTrait', () => ({
  TextTrait: (props: any) => TextTraitMock(props),
}));
jest.mock('@/components/waves/memes/traits/NumberTrait', () => ({
  NumberTrait: (props: any) => NumberTraitMock(props),
}));
jest.mock('@/components/waves/memes/traits/DropdownTrait', () => ({
  DropdownTrait: (props: any) => DropdownTraitMock(props),
}));
jest.mock('@/components/waves/memes/traits/BooleanTrait', () => ({
  BooleanTrait: (props: any) => BooleanTraitMock(props),
}));

const baseTraits = { title: '', description: '', field: 'value' } as any;
const noop = () => {};

beforeEach(() => {
  TextTraitMock.mockClear();
  NumberTraitMock.mockClear();
  DropdownTraitMock.mockClear();
  BooleanTraitMock.mockClear();
});

it('renders specific trait component based on type', () => {
  render(
    <TraitField
      definition={{ type: FieldType.NUMBER, field: 'pointsPower', label: 'Points' }}
      traits={{ pointsPower: 0 } as any}
      updateText={noop}
      updateNumber={noop}
      updateBoolean={noop}
    />
  );
  expect(NumberTraitMock).toHaveBeenCalled();
});

it('memoizes non title fields', () => {
  const { rerender } = render(
    <TraitField
      definition={{ type: FieldType.TEXT, field: 'artist', label: 'Artist' }}
      traits={{ artist: 'a' } as any}
      updateText={noop}
      updateNumber={noop}
      updateBoolean={noop}
    />
  );
  expect(TextTraitMock).toHaveBeenCalledTimes(1);
  rerender(
    <TraitField
      definition={{ type: FieldType.TEXT, field: 'artist', label: 'Artist' }}
      traits={{ artist: 'a' } as any}
      updateText={noop}
      updateNumber={noop}
      updateBoolean={noop}
    />
  );
  expect(TextTraitMock).toHaveBeenCalledTimes(1);
});

it('re-renders title field even when unchanged', () => {
  const { rerender } = render(
    <TraitField
      definition={{ type: FieldType.TEXT, field: 'title', label: 'Title' }}
      traits={{ title: 'a' } as any}
      updateText={noop}
      updateNumber={noop}
      updateBoolean={noop}
    />
  );
  expect(TextTraitMock).toHaveBeenCalledTimes(1);
  rerender(
    <TraitField
      definition={{ type: FieldType.TEXT, field: 'title', label: 'Title' }}
      traits={{ title: 'a' } as any}
      updateText={noop}
      updateNumber={noop}
      updateBoolean={noop}
    />
  );
  expect(TextTraitMock).toHaveBeenCalledTimes(2);
});
