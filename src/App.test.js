import React from 'react';
import { render } from '@testing-library/react';
import { lab, LabColor } from 'd3-color';
import App, { colorDistance } from './App';

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