import Map from 'ol/Map';

import Tile from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import UVBuffer from './UVBuffer';

import './webgl-debug'
import { WebGLWindGradientLayer } from './WebGLWindGradientLayer';


const map = window.map = new Map({
  target: 'map',
  layers: [
    new Tile({
      source: new OSMSource()
    })
  ],
  view: new View({
    zoom: 12
  })
});

// const img = new Image();
// let loaded = false;
// img.onload = function() {
//   loaded = true;
// };
// img.src = './stub.png';



Promise.all([
  fetch('./metadata.json').then(r => r.json()),
  fetch('./u.bin').then(r => r.arrayBuffer()),
  fetch('./v.bin').then(r => r.arrayBuffer()),
]).then(array => {
  const [metadata, us, vs] = array;
  const {extent, width, height} = metadata;
  const uBuffer = new Float32Array(us);
  const vBuffer = new Float32Array(vs);
  const uvBuffer = new UVBuffer(uBuffer, vBuffer, width, height, extent);

  const customLayer = new WebGLWindGradientLayer({
    map,
    uvBuffer
  });
  map.addLayer(customLayer);

  map.getView().fit(uvBuffer.extent, map.getSize());
});