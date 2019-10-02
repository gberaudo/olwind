import Map from 'ol/Map';
import {getCenter} from 'ol/extent';



import Tile from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import UVBuffer from './UVBuffer';
import { CanvasWindParticlesLayer } from './CanvasWindParticlesLayer';
import { ArrowLayer } from './ArrowLayer';

const ARROW_OPACITY = 0.5;
const OSM_OPACTIY = 1;
const INITIAL_TTL = 50;
const NUMBER_OF_PARTICULES = 10000;



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
  window.uv = uvBuffer;

  const barbsStyle = document.location.search.includes('barbs') ? 'barbs' : null;
  const arrowLayer = new ArrowLayer({
    uvBuffer,
    opacity: ARROW_OPACITY,
    style: barbsStyle
  });
  map.addLayer(arrowLayer);

  const windParticlesLayer = new CanvasWindParticlesLayer({
    map,
    uvBuffer,
    particles: NUMBER_OF_PARTICULES,
    fading: 0.90,
    ttl: INITIAL_TTL
  })
  map.addLayer(windParticlesLayer);

  const center = getCenter(extent);
  map.getView().setCenter(center);
});