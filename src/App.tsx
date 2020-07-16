import React from 'react';
import colorlab from 'colorlab';
import { lab, LabColor } from 'd3-color';
import './App.css';

const COLOR_SETS = ["xkcd", "css"];

interface FriendlyColor {
  name: string,
  cssColor: string,
  labColor: LabColor
};

type AppState = {
  isFetching: boolean,
  colorData: Map<string, FriendlyColor[]>,
};

class App extends React.Component<{}, AppState> {
  state: AppState = {
    isFetching: false,
    colorData: new Map<string, FriendlyColor[]>()
  };

  render() {
    let white = lab('#00aba5');
    let black = lab('#000000');
    if (this.state.isFetching || this.state.colorData.size === 0) {
      return <h1>Fetching data...</h1>;
    }
    // TODO kinda ugly
    let parts : JSX.Element[] = [];
    COLOR_SETS.map(name => {
      for (let part of this.getMostSimilarColors(this.state.colorData.get(name)!, white, name)) {
        parts.push(part);
      }
    });
    return (
      <div className="App">
        <div>
          <span className="colorBox" title="#00aba5" style={{backgroundColor: "#00aba5"}}></span>#00aba5
        </div>
        <ul>
          {parts}
        </ul>
      </div>
    );
  }

  getMostSimilarColors(colors: FriendlyColor[], targetColor: LabColor, label: string) : JSX.Element[] {
    let distances : Array<[number, FriendlyColor]> = [];
    for (const friendlyColor of colors) {
      distances.push([colorDistance(targetColor, friendlyColor.labColor), friendlyColor]);
    }
    distances.sort((a, b) => a[0] - b[0]);
    let parts : JSX.Element[] = [];
    parts.push(<h1>{label}</h1>);
    // TODO - constant for 10 here
    for (const distance of distances.slice(0, 10)) {
      parts.push(<li key={label + "|" + distance[1].name}><span className="colorBox" title={distance[1].cssColor} style={{backgroundColor: distance[1].cssColor}}></span>
       {distance[1].name}: {getDisplayDistance(distance[0])} </li>);
    }
    return parts;
  }

  componentWillMount() {
    this.fetchColors();
  }

  async fetchColorsAsync() {
    try {
      this.setState({...this.state, isFetching: true});
      //TODO do these in parallel with Promise.all
      const fetchPromises = COLOR_SETS.map(title => this.fetchColorFile(title + "rgb.txt"));
      const fileContents = await Promise.all(fetchPromises);
      let colorData = new Map<string, FriendlyColor[]>();
      fileContents.map((contents, index) => {
        colorData.set(COLOR_SETS[index], this.parseData(contents));
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

export function getDisplayDistance(distance: number) : string {
  return (Math.round(distance * 100) / 100).toFixed(2);
}

export function colorDistance(x: LabColor, y: LabColor): number {
  const lab1 = new colorlab.CIELAB(x.l, x.a, x.b);
  const lab2 = new colorlab.CIELAB(y.l, y.a, x.b);
  return colorlab.CIEDE2000(lab1, lab2);
}

export default App;
