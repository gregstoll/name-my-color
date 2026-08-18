"use strict"

import colorlab from "https://cdn.jsdelivr.net/npm/colorlab@0.2/+esm";
const { CIELAB, CIEDE2000 } = colorlab.default ?? colorlab;
import {lab} from "https://cdn.jsdelivr.net/npm/d3-color@3/+esm";

/*let x = lab("#f70022");
let y = lab("#f7022a");

const lab1 = new CIELAB(x.l, x.a, x.b);
const lab2 = new CIELAB(y.l, y.a, y.b);
console.log(CIEDE2000(lab1, lab2));*/

const COLOR_SETS = [
  {
    filename: "xkcd",
    title: "Xkcd",
    description: "The popular <a href=\"https://xkcd.com\">xkcd</a> webcomic did a project to crowdsource common color names; you can see the results <a href=\"https://xkcd.com/color/rgb/\">here</a>."
  },
  {
    filename: "css",
    title: "CSS",
    description: "The named colors defined in the CSS4 spec, available <a href=\"https://www.w3.org/TR/css-color-4/#hex-notation\">here</a>."
  },
  {
    filename: "meodai",
    title: "Meodia Color Names",
    description: "A large set of handpicked color names available <a href=\"https://github.com/meodai/color-names\">on GitHub</a>. This uses only the \"good\" color names from the list."
  }
];


const ColorRegex = new RegExp("^[0-9a-fA-F]{6}$");
/**
 * 
 * @param {string} text the color to test
 * @returns whether it's of the form "#aabbcc"
 */
export function colorIsValid(text) {
  if (!text.startsWith("#")) {
    return false;
  }
  if (text.length !== 7) {
    return false;
  }
  return ColorRegex.test(text.substring(1));
}

class InputColor extends HTMLElement {
    /** @type string */
    #color;
    /** @type string */
    #lastValidColor;

    static get observedAttributes() {
        return ['color', 'lastvalidcolor'];
    }
    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.update();
    }

    connectedCallback() {
         if (this.querySelector('form')) return;
         this.innerHTML = `
            <form>
                <label htmlFor="colorText">Color to name: </label>
                <input type="text" name="colorText"></input>
                &nbsp;<input type="color"></input>
            </form>`;
        this.textElement.addEventListener("change", this.handleColorChange.bind(this));
        this.colorElement.addEventListener("change", this.handleColorChange.bind(this));
        let textElement = this.querySelector('input[type="text"]');

        this.update();
    }

    get textElement() {
        return this.querySelector('input[type="text"]');
    }
    get colorElement() {
        return this.querySelector('input[type="color"]');
    }

    update() {
        if (!this.querySelector('form')) return;
        let newColor = this.getAttribute("color");
        let newLastValidColor = this.getAttribute("lastvalidcolor");
        // TODO - show color (lastValidColor?) in text
        if (this.#color !== newColor || this.#lastValidColor !== newLastValidColor) {
            this.#color = newColor;
            this.#lastValidColor = newLastValidColor;
            this.textElement.value = this.#color;
            this.colorElement.value = this.#lastValidColor;
        }
    }

    handleColorChange(event) {
        let text = event.target.value.trim();
        if (!text.startsWith('#')) {
            text = '#' + text;
        }
        this.dispatchEvent(new CustomEvent("colorChange", {
            detail: { color: text, colorIsValid: colorIsValid(text) }
        }));
    }
}
customElements.define('input-color', InputColor);

class DisplayTargetColor extends HTMLElement {
    connectedCallback() {
        if (this.querySelector('div')) return;
        this.innerHTML = `
            <div>
                <span class="colorBox"></span>&nbsp;<span id="colorText"></span>
            </div>`;
        this.update();
    }
    static get observedAttributes() {
        return ['color'];
    }
    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.update();
    }
    update() {
        if (!this.querySelector('div')) return;
        let color = this.getAttribute('color');
        let colorBox = this.querySelector(".colorBox");
        colorBox.setAttribute('title', color);
        colorBox.style.backgroundColor = color;
        let colorText = this.querySelector("#colorText");
        colorText.innerText = color;
    }
}
customElements.define('display-target-color', DisplayTargetColor);

class SimilarColor extends HTMLElement {
    #expanded = false;
    #friendlyColor;
    #distance;
    constructor(friendlyColor, distance) {
        super();
        this.#friendlyColor = friendlyColor;
        this.#distance = distance;
    }
    connectedCallback() {
        if (this.childNodes.length) return;
        // TODO expanded
        this.innerHTML = `
            <li>
            <p class="colorLine">
            <span class="colorBox" title=${this.#friendlyColor.cssColor} style="background-color: ${this.#friendlyColor.cssColor}"></span>
            <span>&nbsp;${this.#friendlyColor.name}: ${this.getDisplayDistance(this.#distance)}</span>
            </p>
            </li>`;
    }

    getDisplayDistance(distance) {
        return (Math.round(distance * 100) / 100).toFixed(2);
    }
}
customElements.define('similar-color', SimilarColor);

class ColorSet extends HTMLElement {
    #colorSetInfo;
    #colorData;
    #targetColor;
    constructor(colorSetInfo) {
        super();
        this.#colorSetInfo = colorSetInfo;
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        if (this.shadowRoot.childNodes.length) return;
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="index.css">
            <div class="colorSet">
                <h1 id="header"></h1>
                <p class="colorSetDescription"></p>
                <div id="similarColors"></div>
            </div>
        `;
        this.update();
    }
    update() {
        if (!this.shadowRoot.childNodes.length || !this.#targetColor) return;
        this.shadowRoot.getElementById("header").innerText = this.#colorSetInfo.title;
        // dangerous!
        this.shadowRoot.querySelector(".colorSetDescription").innerHTML = this.#colorSetInfo.description;
        let similarColorsList = this.shadowRoot.getElementById("similarColors");
        let children = [];
        let similarColors = this.getMostSimilarColors(this.#colorData, this.#targetColor);
        for (let similarColor of similarColors) {
            children.push(new SimilarColor(similarColor[1], similarColor[0]));
        }
        similarColorsList.replaceChildren(...children);
    }
    set colorData(val) {
        this.#colorData = val;
        this.update();
    }
    set targetColor(val) {
        this.#targetColor = val;
        this.update();
    }

    getMostSimilarColors(colors, targetColor) {
        let distances =
            colors.map(friendlyColor => [this.colorDistance(targetColor, friendlyColor.labColor), friendlyColor]);
        distances.sort((a, b) => a[0] - b[0]);
        return distances.slice(0, 25);
    }

    colorDistance(x, y) {
        const lab1 = new CIELAB(x.l, x.a, x.b);
        const lab2 = new CIELAB(y.l, y.a, y.b);
        return CIEDE2000(lab1, lab2);
    }
}
customElements.define('color-set', ColorSet);

class NameMyColorApp extends HTMLElement {
    // TODO parse query hash
    #inputColor = "#f70022";
    #targetColor = "#f70022";
    #isFetching = false;
    #colorSets = new Map();
    connectedCallback() {
        if (this.inputColorElement || this.#isFetching) return;
        for (const colorSetInfo of COLOR_SETS) {
            let colorSet = new ColorSet(colorSetInfo);
            this.#colorSets.set(colorSetInfo.filename, colorSet);
        }
        this.innerHTML = `<h1>Fetching data...</h1>`;
        this.fetchColorsAsync();
    }
    gotColors() {
        this.innerHTML = `<input-color></input-color><display-target-color>
            </display-target-color>
            <div id="similarColors></div>`;
        for (const colorSetInfo of COLOR_SETS) {
            let colorSet = this.#colorSets.get(colorSetInfo.filename);
            colorSet.targetColor = lab(this.#targetColor);
            this.appendChild(colorSet);
        }
        this.inputColorElement.addEventListener("colorChange", e => {
            // TODO update query hash?
            this.#inputColor = e.detail.color;
            if (e.detail.colorIsValid) {
                this.#targetColor = e.detail.color;
            }
            this.update();
        });
        this.update();
    }
    get inputColorElement() {
        return this.querySelector("input-color");
    }
    update() {
        if (!this.inputColorElement) return;
        this.inputColorElement.setAttribute("color", this.#inputColor);
        this.inputColorElement.setAttribute("lastvalidcolor", this.#targetColor);
        this.querySelector("display-target-color").setAttribute("color", this.#targetColor);
        for (const colorSetInfo of COLOR_SETS) {
            this.#colorSets.get(colorSetInfo.filename).targetColor = lab(this.#targetColor);
        }
    }

    async fetchColorsAsync() {
        try {
            this.#isFetching = true;
            const fetchPromises = COLOR_SETS.map(colorSet => this.fetchColorFile(colorSet.filename + "rgb.txt"));
            const fileContents = await Promise.all(fetchPromises);
            let colorData = new Map();
            fileContents.forEach((contents, index) => {
                let colorSet = this.#colorSets.get(COLOR_SETS[index].filename);
                colorSet.colorData = this.parseData(contents);
            });
            this.#isFetching = false;
            this.gotColors();
        }
        catch (e) {
            // TODO something better?
            console.log(e);
        }
    }

    async fetchColorFile(fileName) {
        const response = await fetch("data/" + fileName);
        const data = await response.text();
        return data;
    }

    parseData(str) {
        const lines = str.split("\n");
        let colors = [];
        for (let line of lines) {
            line = line.trim();
            if (line.length === 0 || line.startsWith('#')) {
                continue;
            }
            const hashIndex = line.lastIndexOf("#");
            const name = line.substring(0, hashIndex).trim();
            const value = line.substring(hashIndex).trim();
            colors.push({name: name, cssColor: value, labColor: lab(value)});
        }
        return colors;
    }
}
customElements.define('name-my-color-app', NameMyColorApp);