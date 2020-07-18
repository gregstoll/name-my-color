import React from 'react';
import { render } from '@testing-library/react';
import { lab } from 'd3-color';
import App, { colorDistance, getDisplayDistance, colorIsValid } from './App';

test('colorDistance is 0 for identical colors', () => 
{
  const color1 = lab('#123456');
  const color2 = lab('#123456');
  expect(colorDistance(color1, color2)).toBe(0);
});

test('colorDistance is 100 for white and black', () => 
{
  const white = lab('#ffffff');
  const black = lab('#000000');
  expect(colorDistance(white, black)).toBe(100);
});

test('getDisplayDistance of 0', () => 
{
  expect(getDisplayDistance(0)).toBe("0.00");
});

test('getDisplayDistance of 0.5', () => 
{
  expect(getDisplayDistance(0.5)).toBe("0.50");
});

test('getDisplayDistance of 2.544', () => 
{
  expect(getDisplayDistance(2.544)).toBe("2.54");
});

test('getDisplayDistance of 2.546', () => 
{
  expect(getDisplayDistance(2.546)).toBe("2.55");
});

test('colorIsValid of #000000', () =>
{
  expect(colorIsValid("#000000")).toBe(true);
});

test('colorIsValid of #0000000', () =>
{
  expect(colorIsValid("#0000000")).toBe(false);
});

test('colorIsValid of #00000', () =>
{
  expect(colorIsValid("#00000")).toBe(false);
});

test('colorIsValid of #afafaf', () =>
{
  expect(colorIsValid("#afafaf")).toBe(true);
});

test('colorIsValid of #AFAFAF', () =>
{
  expect(colorIsValid("#AFAFAF")).toBe(true);
});

test('colorIsValid of #agagag', () =>
{
  expect(colorIsValid("#agagag")).toBe(false);
});

test('colorIsValid of #000', () =>
{
  expect(colorIsValid("#000")).toBe(false);
});

test('colorIsValid of #azazaz', () =>
{
  expect(colorIsValid("#azazaz")).toBe(false);
});

test('colorIsValid of #89abcd', () =>
{
  expect(colorIsValid("#89abcd")).toBe(true);
});