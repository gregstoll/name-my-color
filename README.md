# Name My Color

This is a project to find a name for a color. It is written in React + TypeScript.

See it in action at https://gregstoll.com/namemycolor (soon!)

It uses [d3-color](https://github.com/d3/d3-color) to convert from the RGB colorspace to the CIELab colorspace, and [colorlab](https://github.com/signalwerk/colorlab) to calculate the distance using the CIEDE2000 algorithm.  The color picker is the `SketchPicker` from [react-color](https://github.com/casesandberg/react-color).
