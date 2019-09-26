import Map from 'ol/Map';
import {Style, Icon} from 'ol/style';
import {createEmpty, boundingExtent, extend, getCenter} from 'ol/extent';
import {fromLonLat} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Tile from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';


function applyTransform(transform, coordinate) {
  const x = coordinate[0];
  const y = coordinate[1];
  coordinate[0] = transform[0] * x + transform[2] * y + transform[4];
  coordinate[1] = transform[1] * x + transform[3] * y + transform[5];
  return coordinate;
}


const map = window.map = new Map({
  target: 'map',
  layers: [
    new Tile({
      source: new OSMSource()
    })
  ],
  view: new View({
    zoom: 10
  })
});


const arrowStyles = {};
['red', 'green', 'black', 'blue'].forEach(color => {
  const style = new Style({
    image: new Icon({
      src: 'white-arrow.png',
      color
    })
  });
  arrowStyles[color] = style;
});

const extent = createEmpty();
const features = [];
function addPoint(lonLat, data) {
  const coordinate = fromLonLat(lonLat);
  const bExtent = boundingExtent([coordinate]);
  extend(extent, bExtent);
  features.push(new Feature(new Point([...coordinate, data], 'XYM')));
}

Promise.all([
  fetch('./grid.json').then(r => r.json()),
  fetch('./u.json').then(r => r.json()),
  fetch('./v.json').then(r => r.json()),
]).then(array => {
  const [grid, us, vs] = array;
  const shape = grid._metadata.shape;
  for (let g = 0; g < shape[0]; ++g) {
    const latGroup = grid.lat[g];
    const lonGroup = grid.lon[g];
    const uGroup = us.array[g];
    const vGroup = vs.array[g];
    for (let i = 0; i < shape[1]; ++i) {
      const lonLat = [lonGroup[i], latGroup[i]];
      const u = uGroup[i];
      const v = vGroup[i];
      const speed = Math.sqrt(u * u + v * v);
      const rotation = Math.atan2(v, u) * 180 / Math.PI;
      const data = {u, v, speed, rotation};
      addPoint(lonLat, data);
    }
  }
  const center = getCenter(extent);

  map.getView().setCenter(center);
  const source = new VectorSource({
    features
  });
  const arrowLayer = new VectorLayer({
    style(feature, resolution) {
      const {speed, rotation} = feature.getGeometry().getCoordinates()[2];
      let color = 'black';
      if (speed < 0.5) {
        color = 'blue';
      } else if (speed < 1) {
        color = 'green';
      } else {
        color = 'red';
      }
      const style = arrowStyles[color];
      style.getImage().setRotation(rotation);
      return style;
    },
    source
  });
  //map.addLayer(arrowLayer);

  const particule = {
    coordinates: [...center]
  };

  let previousTime = new Date().getTime();
  map.on('postcompose', event => {
    const {context, frameState} = event;
    const currentTime = new Date().getTime();

    const pixel = applyTransform(frameState.coordinateToPixelTransform, [...particule.coordinates]);
    context.fillRect(pixel[0], pixel[1], 5, 5);
    var elapsed = frameState.time - previousTime;
    previousTime = frameState.time;
    // Look up the coordinate speed in the table (or even interpolate?)
    // compute new position
    map.render();
  });
});