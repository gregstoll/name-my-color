import React from 'react';
import { render } from '@testing-library/react';
import { lab, LabColor } from 'd3-color';
import App, { colorDistance, getDisplayDistance } from './App';

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