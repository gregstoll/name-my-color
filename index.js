"use strict"

import colorlab from "https://cdn.jsdelivr.net/npm/colorlab@0.2/+esm";
const { CIELAB, CIEDE2000 } = colorlab.default ?? colorlab;
import {lab} from "https://cdn.jsdelivr.net/npm/d3-color@3/+esm";

let x = lab("#f70022");
let y = lab("#f7022a");

const lab1 = new CIELAB(x.l, x.a, x.b);
const lab2 = new CIELAB(y.l, y.a, y.b);
console.log(CIEDE2000(lab1, lab2));

