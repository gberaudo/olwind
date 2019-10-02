import { positionFromIndex, coordinateFromPosition } from './UVBuffer';
import { createStupidStyle, createBarbsStyle } from './styling';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

export class ArrowLayer extends VectorLayer {
  constructor(options) {
    /**
     * @type {import('./UVBuffer').default}
     */
    const uvBuffer = options.uvBuffer;
    const width = uvBuffer.dataWidth_;
    const height = uvBuffer.dataHeight_;
    const extent = uvBuffer.extent;

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

    const style = options.style === 'barbs' ? createBarbsStyle(uvBuffer) : createStupidStyle(uvBuffer);
    super({
      opacity: options.opacity,
      updateWhileInteracting: true,
      style,
      source: new VectorSource({
        features
      })
    });
  }
}
