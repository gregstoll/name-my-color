import React, { ChangeEvent } from 'react';
import colorlab from 'colorlab';
import { lab, LabColor } from 'd3-color';
import { SketchPicker, ColorResult } from 'react-color';
import './App.css';

const COLOR_SETS: ColorSet[] = [
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

interface ColorSet {
  filename: string,
  title: string,
  description: string
};

interface FriendlyColor {
  name: string,
  cssColor: string,
  labColor: LabColor
};

type AppState = {
  isFetching: boolean,
  colorData: Map<string, FriendlyColor[]>,
  targetColor: string,
  inputColor: string,
  haveUpdatedFromHash: boolean
};

class App extends React.Component<{}, AppState> {
  state: AppState = {
    isFetching: false,
    colorData: new Map<string, FriendlyColor[]>(),
    targetColor: "#f70022",
    inputColor: "#f70022",
    haveUpdatedFromHash: false
  };

  render() {
    if (!this.dataHasLoaded()) {
      return <h1>Fetching data...</h1>;
    }
    if (this.state.haveUpdatedFromHash) {
      this.updateHash();
    }
    return (
      <div className="App">
        <InputColor
          colorChange={(color, isValid) => this.handleColorChange(color, isValid)}
          color={this.state.inputColor}
          lastValidColor={this.state.targetColor} />
        <DisplayTargetColor color={this.state.targetColor} />
        <SimilarColors colorData={this.state.colorData} targetColor={this.state.targetColor}/>
      </div>
    );
  }

  handleColorChange(color: string, isValid: boolean): void {
    if (isValid) {
      this.setState({targetColor: color, inputColor: color});
    }
    else {
      this.setState({inputColor: color});
    }
  }

  componentDidMount() {
    this.fetchColors();
    this.updateInitialStateFromHash();
  }
  
  dataHasLoaded() {
    return !(this.state.isFetching || this.state.colorData.size === 0);
  }

  componentDidUpdate(prevProps : {}, prevState: AppState, snapshot: {}) {
    this.updateInitialStateFromHash();
  }

  updateInitialStateFromHash() {
    if (this.dataHasLoaded() && !this.state.haveUpdatedFromHash) {
      this.setStateFromHash();
    }
  }

  setStateFromHash() {
    if (window.location.hash.length > 1) {
      const hashColor = "#" + window.location.hash.substr(1);
      if (colorIsValid(hashColor)) {
        this.setState({inputColor: hashColor, targetColor: hashColor});
      }
    }
    this.setState({haveUpdatedFromHash: true});
  }

  updateHash() {
    window.location.hash = this.state.targetColor;
  }

  async fetchColorsAsync() {
    try {
      this.setState({...this.state, isFetching: true});
      const fetchPromises = COLOR_SETS.map(colorSet => this.fetchColorFile(colorSet.filename + "rgb.txt"));
      const fileContents = await Promise.all(fetchPromises);
      let colorData = new Map<string, FriendlyColor[]>();
      fileContents.forEach((contents, index) => {
        colorData.set(COLOR_SETS[index].filename, this.parseData(contents));
      });
      this.setState({...this.state,
        colorData: colorData,
        isFetching: false
      });
    }
    catch (e) {
      console.log(e);
      this.setState({...this.state, isFetching: false});
    }
  }

  async fetchColorFile(fileName: string) : Promise<string> {
    const response = await fetch (fileName);
    const data = await response.text();
    return data;
  }

  parseData(str: string) : FriendlyColor[] {
    const lines = str.split("\n");
    let colors : FriendlyColor[] = [];
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

  fetchColors = this.fetchColorsAsync;
}

type InputColorProps = {
  lastValidColor: string,
  color: string,
  colorChange: (newColor: string, isValid: boolean) => void
}

type InputColorState = {
  pickerVisible: boolean
}

class InputColor extends React.Component<InputColorProps, InputColorState> {
  state: InputColorState = {
    pickerVisible: false
  };

  render() {
    return <form>
        <label htmlFor="color">Color to name: </label>
        <input type="text" name="color" value={this.props.color} onChange={event => this.handleColorChange(event)}></input>
        &nbsp;<button type="button" onClick={event => this.handleTogglePicker(event)}>{this.state.pickerVisible ? "Hide" : "Show"} picker</button>
        {this.state.pickerVisible && (
          <SketchPicker color={this.props.lastValidColor} onChangeComplete={(color, event) => this.handlePickerColorChange(color)} /> 
        )}
    </form>;
  }

  handleTogglePicker(event: React.FormEvent<HTMLButtonElement>): void {
    this.setState({pickerVisible: !this.state.pickerVisible});
  }

  handlePickerColorChange(color: ColorResult): void {
    this.props.colorChange(color.hex, true);
  }

  handleColorChange(event: ChangeEvent<HTMLInputElement>) {
    let text = event.target.value.trim();
    if (!text.startsWith('#')) {
      text = '#' + text;
    }
    this.props.colorChange(text, colorIsValid(text));
  }
}

const ColorRegex = new RegExp("^[0-9a-fA-F]{6}$");
export function colorIsValid(text: string) : boolean {
  if (!text.startsWith("#")) {
    return false;
  }
  if (text.length !== 7) {
    return false;
  }
  return ColorRegex.test(text.substring(1));
}

type DisplayTargetColorProps = {
  color: string
}
class DisplayTargetColor extends React.Component<DisplayTargetColorProps> {
  render() {
    return <div>
      <span className="colorBox" title={this.props.color} style={{backgroundColor: this.props.color}}></span>&nbsp;{this.props.color}
    </div>;
  }
}

type SimilarColorsProps = {
  colorData: Map<string, FriendlyColor[]>,
  targetColor: string,
  numberOfSimilarColors?: number
};

class SimilarColors extends React.Component<SimilarColorsProps> {
  render() {
    const targetColor = lab(this.props.targetColor);
    let parts : JSX.Element[] = [];
    COLOR_SETS.forEach(colorSet => {
      parts.push(this.getSimilarColorElement(this.props.colorData.get(colorSet.filename)!, targetColor, colorSet));
    });
    return <div>{parts}</div>;
  }

  getSimilarColorElement(colors: FriendlyColor[], targetColor: LabColor, colorSet: ColorSet) : JSX.Element {
    let parts : JSX.Element[] = [];
    parts.push(<h1 key="header">{colorSet.title}</h1>);
    const unsafeDescription = {__html: colorSet.description};
    parts.push(<p key="description" className="colorSetDescription" dangerouslySetInnerHTML={unsafeDescription}></p>);
    const similarColors = this.getMostSimilarColors(colors, targetColor);
    for (const similarColor of similarColors) {
      parts.push(<SimilarColor key={colorSet.filename + "|" + similarColor[1].name}
        color={similarColor[1]}
        distance={similarColor[0]} />);
    }
    return <div key={colorSet.filename} className="colorSet">{parts}</div>
  }

  getMostSimilarColors(colors: FriendlyColor[], targetColor: LabColor) : Array<[number, FriendlyColor]> {
    let distances : Array<[number, FriendlyColor]> =
      colors.map(friendlyColor => [colorDistance(targetColor, friendlyColor.labColor), friendlyColor]);
    distances.sort((a, b) => a[0] - b[0]);
    return distances.slice(0, this.props.numberOfSimilarColors ?? 25);
  }
}

type SimilarColorProps = {
  color: FriendlyColor,
  distance: number
};
type SimilarColorState = {
  expanded: boolean
};
class SimilarColor extends React.Component<SimilarColorProps, SimilarColorState> {
  state: SimilarColorState = {
    expanded: false 
  };

  render() {
    const color = this.props.color;
    return <li onClick={event => this.handleClick(event)}>
      <p className="colorLine">
      <span className="colorBox" title={color.cssColor} style={{backgroundColor: color.cssColor}}></span>
      <span>&nbsp;{color.name}: {getDisplayDistance(this.props.distance)}</span>
      </p>
      { this.state.expanded && (
          <p className="colorSpecification">{color.cssColor}</p>
      )}
    </li>;
  }
  handleClick(event: React.MouseEvent<HTMLLIElement, MouseEvent>): void {
    this.setState({expanded: !this.state.expanded});
  }
}

export function getDisplayDistance(distance: number) : string {
  return (Math.round(distance * 100) / 100).toFixed(2);
}

export function colorDistance(x: LabColor, y: LabColor): number {
  const lab1 = new colorlab.CIELAB(x.l, x.a, x.b);
  const lab2 = new colorlab.CIELAB(y.l, y.a, y.b);
  return colorlab.CIEDE2000(lab1, lab2);
}

export default App;
