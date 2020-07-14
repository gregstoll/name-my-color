import React from 'react';
import colorlab from 'colorlab';
import { lab, LabColor } from 'd3-color';
import './App.css';

const COLOR_SETS = ["xkcd"];

interface FriendlyColor {
  name: string,
  cssColor: string,
  labColor: LabColor
};

type AppState = {
  isFetching: boolean,
  xkcd: FriendlyColor[]
};

class App extends React.Component<{}, AppState> {
  state: AppState = {
    isFetching: false,
    xkcd: []
  };

  render() {
    let white = lab('#00aba5');
    let black = lab('#000000');
    if (this.state.isFetching) {
      return <h1>Fetching</h1>;
    }
    // TODO kinda ugly
    let distances : Array<[number, FriendlyColor]> = [];
    for (const friendlyColor of this.state.xkcd) {
      distances.push([colorDistance(white, friendlyColor.labColor), friendlyColor]);
    }
    distances.sort((a, b) => a[0] - b[0]);
    let parts : JSX.Element[] = [];
    for (const distance of distances) {
      parts.push(<li key={distance[1].name}><span className="colorBox" style={{backgroundColor: distance[1].cssColor}}></span>
       {distance[1].name}: {distance[0]} </li>);
    }
    return (
      <div className="App">
        <ul>
          {parts}
        </ul>
      </div>
    );
  }

  componentDidMount() {
    this.fetchColors();
  }

  async fetchColorsAsync() {
    try {
      this.setState({...this.state, isFetching: true});
      //TODO do these in parallel with Promise.all
      const response = await fetch ("xkcdrgb.txt");
      const data = await response.text();
      this.setState({...this.state,
        xkcd: this.parseData(data),
        isFetching: false
      });
    }
    catch (e) {
      console.log(e);
      this.setState({...this.state, isFetching: false});
    }
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

export function colorDistance(x: LabColor, y: LabColor) {
  const lab1 = new colorlab.CIELAB(x.l, x.a, x.b);
  const lab2 = new colorlab.CIELAB(y.l, y.a, x.b);
  return colorlab.CIEDE2000(lab1, lab2);
}

export default App;
