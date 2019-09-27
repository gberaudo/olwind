import Map from 'ol/Map';
import {createEmpty, getWidth, getHeight, getCenter, getIntersection, isEmpty, containsCoordinate} from 'ol/extent';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {apply as applyTransform} from 'ol/transform';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Tile from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import View from 'ol/View';
import UVBuffer, { positionFromIndex, coordinateFromPosition } from './UVBuffer';
import { createStupidStyle, createBarbsStyle } from './styling';
import CustomCanvasLayer, { CustomCanvasLayerRenderer } from './CustomCanvasLayer';

const ARROW_OPACITY = 0.4;
const OSM_OPACTIY = 0.5;
const INITIAL_TTL = 50;
const NUMBER_OF_PARTICULES = 10000;
const PARTICULE_SIZE = 1;


function randomizeCoordinates(extent, coordinates) {
  coordinates[0] = Math.random() * getWidth(extent) + extent[0];
  coordinates[1] = Math.random() * getHeight(extent) + extent[1];
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



Promise.all([
  fetch('./metadata.json').then(r => r.json()),
  fetch('./u.bin').then(r => r.arrayBuffer()),
  fetch('./v.bin').then(r => r.arrayBuffer()),
]).then(array => {
  const [metadata, us, vs] = array;
  const {extent, width, height} = metadata;
  const uBuffer = new Float32Array(us);
  const vBuffer = new Float32Array(vs);
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

  const barbStyle = document.location.search.includes('barbs');
  const style = barbStyle ? createBarbsStyle(uvBuffer) : createStupidStyle(uvBuffer);
  const arrowLayer = new VectorLayer({
    opacity: ARROW_OPACITY,
    updateWhileInteracting: true,
    style,
    source
  });
  map.addLayer(arrowLayer);

  const particules = new Array(NUMBER_OF_PARTICULES);
  for (let i = 0; i < NUMBER_OF_PARTICULES; ++i) {
    particules[i] = {
    ttl: Math.random() * INITIAL_TTL,
    coordinates: []
    };
  }

  const pixel = [];
  const viewportWithDataExtent = createEmpty();

  const advanceParticules = (frameState, context) => {
    getIntersection(extent, frameState.extent, viewportWithDataExtent);
    if (isEmpty(viewportWithDataExtent)) {
      return;
    }

    const resolution = frameState.viewState.resolution * 1;
    const pixelRatio = frameState.pixelRatio;
    particules.forEach(particule => {
      if (particule.coordinates.length === 0 || !containsCoordinate(viewportWithDataExtent, particule.coordinates)) {
        randomizeCoordinates(viewportWithDataExtent, particule.coordinates);
      }
      pixel[0] = particule.coordinates[0];
      pixel[1] = particule.coordinates[1];
      applyTransform(frameState.coordinateToPixelTransform, pixel);
      context.fillRect(
        pixel[0] * pixelRatio, pixel[1] * pixelRatio,
        PARTICULE_SIZE * pixelRatio, PARTICULE_SIZE * pixelRatio
      );
      --particule.ttl;
      if (particule.ttl < 0) {
        randomizeCoordinates(viewportWithDataExtent, particule.coordinates);
        particule.ttl = INITIAL_TTL;
      }

      // Compute new position
      const [u, v] = uvBuffer.getUVSpeed(particule.coordinates);

      particule.coordinates[0] += u * resolution;
      particule.coordinates[1] += v * resolution;
    })
  }

  const customLayer = new CustomCanvasLayer({
    renderFunction: (frameState, context) => {
      const canvas = context.canvas;
      context.globalAlpha = 0.8;
      context.globalCompositeOperation = 'destination-in';
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = 'black';
      advanceParticules(frameState, context);
    }
  });
  map.addLayer(customLayer);
  map.getRenderer().registerLayerRenderers([CustomCanvasLayerRenderer])


  // map.on('postcompose', event => {
  //   const {context, frameState} = event;
  //   advanceParticules(frameState, context);
  //   map.render();
  // });
});