import CustomCanvasLayer, { CustomCanvasLayerRenderer } from "./CustomCanvasLayer";

import {createEmpty, getWidth, getHeight, getIntersection, isEmpty, containsCoordinate} from 'ol/extent';
import {apply as applyTransform} from 'ol/transform';


function randomizeCoordinates(extent, coordinates) {
  coordinates[0] = Math.random() * getWidth(extent) + extent[0];
  coordinates[1] = Math.random() * getHeight(extent) + extent[1];
}


export class CanvasWindParticlesLayer extends CustomCanvasLayer {

  constructor(options) {
    super({
      /**
       * @param {import('ol/PluggableMap').FrameState} frameState
       */
      renderFunction: (frameState, context) => {

        return this.render(frameState, context);
      }
    });

    this.fading = options.fading || 0.8;

    console.assert(options.ttl);
    this.ttl = options.ttl;

    console.assert(options.map);
    this.map = options.map;

    console.assert(options.uvBuffer);
    this.uvBuffer = options.uvBuffer;

    console.assert(options.particles);
    this.particles = new Array(options.particles);
    for (let i = 0; i < options.particles; ++i) {
      this.particles[i] = {
        ttl: Math.random() * this.ttl,
        coordinates: []
      };
    }

    this.pixel = [];
    this.viewportWithDataExtent = createEmpty();

    this.map.getRenderer().registerLayerRenderers([CustomCanvasLayerRenderer])
    this.particleSize = 1.5;
  }

  render(frameState, context) {
    const canvas = context.canvas;
    if (context.fillStyle != 'dimgray') {
      context.fillStyle = 'dimgray';
    }

    this.advanceParticles(frameState, context);

    context.globalAlpha = this.fading;
    context.globalCompositeOperation = 'destination-in';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';

  }

  advanceParticles(frameState, context) {
    getIntersection(this.uvBuffer.extent, frameState.extent, this.viewportWithDataExtent);
    if (isEmpty(this.viewportWithDataExtent)) {
      return;
    }

    const pixel = this.pixel;
    const resolution = frameState.viewState.resolution;
    const pixelRatio = frameState.pixelRatio;
    this.particles.forEach(particle => {
      if (particle.coordinates.length === 0 || !containsCoordinate(this.viewportWithDataExtent, particle.coordinates)) {
        randomizeCoordinates(this.viewportWithDataExtent, particle.coordinates);
      }
      pixel[0] = particle.coordinates[0];
      pixel[1] = particle.coordinates[1];
      applyTransform(frameState.coordinateToPixelTransform, pixel);
      context.fillRect(
        pixel[0] * pixelRatio, pixel[1] * pixelRatio,
        this.particleSize * pixelRatio, this.particleSize * pixelRatio
      );
      --particle.ttl;
      if (particle.ttl < 0) {
        randomizeCoordinates(this.viewportWithDataExtent, particle.coordinates);
        particle.ttl = this.ttl;
      }

      // Compute new position
      const [u, v] = this.uvBuffer.getUVSpeed(particle.coordinates);

      particle.coordinates[0] += u * resolution;
      particle.coordinates[1] += v * resolution;
    })
  }
}
