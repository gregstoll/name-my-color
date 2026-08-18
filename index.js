"use strict"

import colorlab from "https://cdn.jsdelivr.net/npm/colorlab@0.2/+esm";
const { CIELAB, CIEDE2000 } = colorlab.default ?? colorlab;
import {lab} from "https://cdn.jsdelivr.net/npm/d3-color@3/+esm";

/*let x = lab("#f70022");
let y = lab("#f7022a");

const lab1 = new CIELAB(x.l, x.a, x.b);
const lab2 = new CIELAB(y.l, y.a, y.b);
console.log(CIEDE2000(lab1, lab2));*/

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

class ColorSet extends HTMLElement {

}
customElements.define('color-set', ColorSet);

class NameMyColorApp extends HTMLElement {
    // TODO parse query hash
    #inputColor = "#f70022";
    #targetColor = "#f70022";
    connectedCallback() {
        if (this.inputColorElement) return;
        this.innerHTML = `<input-color></input-color><display-target-color>
            </display-target-color>`;
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
    }
}
customElements.define('name-my-color-app', NameMyColorApp);