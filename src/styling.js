


import {Style, Icon} from 'ol/style';


export function createBarbsStyle(uvBuffer) {
  const styles = [];
  for (let i = 0; i < 26; ++i) {
    const style = new Style({
      image: new Icon({
        rotateWithView: true,
        src: 'arrows/wind_' + i + '.png',
      })
    });
    styles[i] = style;
  }

  function colorFunction(speed) {
    let knots = speed / 1.852;
    return styles[Math.ceil(knots / 5)];

  }

  return (feature, resolution) => {
    return baseStyleFunction(feature, resolution, uvBuffer, colorFunction);
  }
}

export function createStupidStyle(uvBuffer) {
  const arrowStyles = {};
  ['red', 'green', 'black', 'blue'].forEach(color => {
    const style = new Style({
      image: new Icon({
        rotateWithView: true,
        src: 'white-arrow.png',
        color
      })
    });
    arrowStyles[color] = style;
  });

  function colorFunction(speed) {
    let color = 'black';
    if (speed < 0.2) {
      return null;
    } else if (speed < 1) {
      color = 'blue';
    } else if (speed < 5) {
      color = 'green';
    } else {
      color = 'red';
    }
    return arrowStyles[color];
  }

  return (feature, resolution) => {
    return baseStyleFunction(feature, resolution, uvBuffer, colorFunction);
  }
}


export function baseStyleFunction(feature, resolution, uvBuffer, colorFunction) {
  const symbolSizeInMetersWithPadding = 16 * 2 * resolution;
  const density = uvBuffer.density;
  const decimator = Math.max(density[0] * symbolSizeInMetersWithPadding, density[1] * symbolSizeInMetersWithPadding);
  const {i, column, line} = feature.getGeometry().getCoordinates()[2];
  if (column % Math.ceil(decimator) !== 0 || line %  Math.ceil(decimator) !== 0) {
    return null;
  }
  const speed = uvBuffer.getSpeed(i);
  const rotation = uvBuffer.getRotation(i);
  const style = colorFunction(speed);
  if (style) {
    // OL rotation is positive when clockwise! :/
    style.getImage().setRotation(-rotation);
    return style;
  }
}