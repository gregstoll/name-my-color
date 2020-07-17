import React from 'react';
import colorlab from 'colorlab';
import { lab, LabColor } from 'd3-color';
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
};

class App extends React.Component<{}, AppState> {
  state: AppState = {
    isFetching: false,
    colorData: new Map<string, FriendlyColor[]>()
  };

  render() {
    //TODO - separate component to gather color
    //let white = lab('#00aba5');
    //let white = lab('#aabb99');
    if (this.state.isFetching || this.state.colorData.size === 0) {
      return <h1>Fetching data...</h1>;
    }
    return (
      <div className="App">
        <div>
          <span className="colorBox" title="#00aba5" style={{backgroundColor: "#00aba5"}}></span>#00aba5
        </div>
        <SimilarColors colorData={this.state.colorData} targetColor="#00aba5"/>
      </div>
    );
  }

  componentWillMount() {
    this.fetchColors();
  }

  async fetchColorsAsync() {
    try {
      this.setState({...this.state, isFetching: true});
      const fetchPromises = COLOR_SETS.map(colorSet => this.fetchColorFile(colorSet.filename + "rgb.txt"));
      const fileContents = await Promise.all(fetchPromises);
      let colorData = new Map<string, FriendlyColor[]>();
      fileContents.map((contents, index) => {
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

type SimilarColorsProps = {
  colorData: Map<string, FriendlyColor[]>,
  targetColor: string
};


class SimilarColors extends React.Component<SimilarColorsProps> {
  render() {
    //TODO validate the string
    const targetColor = lab(this.props.targetColor);
    let parts : JSX.Element[] = [];
    COLOR_SETS.map(colorSet => {
      parts.push(this.getSimilarColorElement(this.props.colorData.get(colorSet.filename)!, targetColor, colorSet));
    });
    return <div>{parts}</div>;
  }

  getSimilarColorElement(colors: FriendlyColor[], targetColor: LabColor, colorSet: ColorSet) : JSX.Element {
    let parts : JSX.Element[] = [];
    parts.push(<h1>{colorSet.title}</h1>);
    const unsafeDescription = {__html: colorSet.description};
    parts.push(<p className="colorSetDescription" dangerouslySetInnerHTML={unsafeDescription}></p>);
    const similarColors = this.getMostSimilarColors(colors, targetColor);
    for (const similarColor of similarColors) {
      parts.push(<li key={colorSet.filename + "|" + similarColor[1].name} className="colorLine">
        <span className="colorBox" title={similarColor[1].cssColor} style={{backgroundColor: similarColor[1].cssColor}}></span>
        <span>&nbsp;{similarColor[1].name}: {getDisplayDistance(similarColor[0])}</span>
       </li>);
    }
    return <div className="colorSet">{parts}</div>
  }

  getMostSimilarColors(colors: FriendlyColor[], targetColor: LabColor) : Array<[number, FriendlyColor]> {
    let distances : Array<[number, FriendlyColor]> =
      colors.map(friendlyColor => [colorDistance(targetColor, friendlyColor.labColor), friendlyColor]);
    distances.sort((a, b) => a[0] - b[0]);
    // TODO - constant for 25 here
    return distances.slice(0, 25);
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
