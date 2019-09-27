import Map from 'ol/Map';
import {Style, Icon} from 'ol/style';
import {getWidth, getHeight, getCenter, getIntersection, isEmpty, containsCoordinate} from 'ol/extent';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Tile from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import UVBuffer, { positionFromIndex, coordinateFromPosition } from './UVBuffer';

const ARROW_OPACITY = 0.9;
const OSM_OPACTIY = 0.5;
const INITIAL_TTL = 50;
const NUMBER_OF_PARTICULES = 1000;
const PARTICULE_SIZE = 2;

function applyTransform(transform, coordinate) {
  const x = coordinate[0];
  const y = coordinate[1];
  coordinate[0] = transform[0] * x + transform[2] * y + transform[4];
  coordinate[1] = transform[1] * x + transform[3] * y + transform[5];
  return coordinate;
}

function randomCoordinate(extent) {
  return [
    Math.random() * getWidth(extent) + extent[0],
    Math.random() * getHeight(extent) + extent[1],
  ];
}

const map = window.map = new Map({
  target: 'map',
  layers: [
    new Tile({
      opacity: OSM_OPACTIY,
      source: new OSMSource()
    })
  ],
  view: new View({
    zoom: 12
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

Promise.all([
  fetch('./metadata.json').then(r => r.json()),
  fetch('./u.bin').then(r => r.arrayBuffer()),
  fetch('./v.bin').then(r => r.arrayBuffer()),
]).then(array => {
  const [metadata, us, vs] = array;
  const {extent, width, height} = metadata;
  const uBuffer = new Float32Array(us);
  const vBuffer = new Float32Array(vs);
  const density = [
    width / (extent[2] - extent[0]),
    height / (extent[3] - extent[1]),
  ];
  let i = 0;
  const features = [];
  for (let line = 0; line < height; ++line) {
    for (let column = 0; column < width; ++column) {
      const position = positionFromIndex(i, width, height);
      const coordinate = coordinateFromPosition(extent, width, height, position);
      features.push(new Feature(new Point([...coordinate, {
        i,
        column,
        line, 
      }], 'XYM')));
      ++i;
    } 
  }
  const uvBuffer = new UVBuffer(uBuffer, vBuffer, width, height, extent);
  window.uv = uvBuffer;

  const center = getCenter(extent);
  map.getView().setCenter(center);

  const source = new VectorSource({
    features
  });

  const arrowLayer = new VectorLayer({
    rotateWithView: true,
    opacity: ARROW_OPACITY,
    style(feature, resolution) {
      const symbolSizeInMetersWithPadding = 16 * 2 * resolution;
      const decimator = Math.max(density[0] * symbolSizeInMetersWithPadding, density[1] * symbolSizeInMetersWithPadding);
      const {i, column, line} = feature.getGeometry().getCoordinates()[2];
      if (column % Math.ceil(decimator) !== 0 || line %  Math.ceil(decimator) !== 0) {
        return null;
      }
      const speed = uvBuffer.getSpeed(i);
      const rotation = uvBuffer.getRotation(i);
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
      const style = arrowStyles[color];
      // OL rotation is positive when clockwise! :/
      style.getImage().setRotation(-rotation);
      return style;
    },
    source
  });
  map.addLayer(arrowLayer);

  const particules = new Array(NUMBER_OF_PARTICULES);
  for (let i = 0; i < NUMBER_OF_PARTICULES; ++i) {
    particules[i] = {
    ttl: Math.random() * INITIAL_TTL,
    coordinates: null
    };
  }

  map.on('postcompose', event => {
    const {context, frameState} = event;
    const viewportWithDataExtent = getIntersection(extent, frameState.extent);

    if (isEmpty(viewportWithDataExtent)) {
      return;
    }

    particules.forEach(particule => {
      if (!particule.coordinates || !containsCoordinate(viewportWithDataExtent, particule.coordinates)) {
        particule.coordinates = randomCoordinate(viewportWithDataExtent);
      }
      const pixel = applyTransform(frameState.coordinateToPixelTransform, [...particule.coordinates]);
      context.fillRect(pixel[0], pixel[1], PARTICULE_SIZE, PARTICULE_SIZE);
      --particule.ttl;
      if (particule.ttl < 0) {
        particule.coordinates = randomCoordinate(viewportWithDataExtent);
        particule.ttl = INITIAL_TTL;
      }
  
      // Compute new position
      const [u, v] = uvBuffer.getUVSpeed(particule.coordinates);
      const resolution = frameState.viewState.resolution * 1;
      
      particule.coordinates[0] += u * resolution;
      particule.coordinates[1] += v * resolution;
    })

    map.render();
  });
});