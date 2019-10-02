import Layer from 'ol/layer/Layer'
import Observable from 'ol/Observable';
import { resizeCanvasIfNeeded } from './util.js';
import {apply} from 'ol/transform';

const tmpPreviousCenterPixel = [];

export class CustomCanvasLayerRenderer extends Observable {

  /**
   * @param {CustomCanvasLayer} layer
   */
  constructor(layer) {
    super();
    this.layer = layer;
    this.canvases_ = [
      document.createElement('canvas'),
      document.createElement('canvas') // minor: could make it lazy
    ];

    this.previousFrame_ = {
      canvasId: 0,
      centerX: 0,
      centerY: 0,
      resolution: Infinity,
    };
  }

  /**
   * Determine if this renderer handles the provided layer.
   * @param {import("ol/layer/Layer.js").default} layer The candidate layer.
   * @return {boolean} The renderer can render the layer.
   */
  static handles(layer) {
    return layer instanceof CustomCanvasLayer;
  }

  /**
   * Create a layer renderer.
   * @param {import("../Map.js").default} _ The map renderer.
   * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
   * @return {CustomCanvasLayerRenderer} The layer renderer.
   */
  static create(_, layer) {
    return new CustomCanvasLayerRenderer(/** @type {CustomCanvasLayer} */ (layer));
  }

  /**
   * Called by the OpenLayer renderer on render if the layer is visible.
   * @param {import('ol/PluggableMap.js').FrameState} frameState
   */
  prepareFrame(frameState) {
    const layer = this.layer;

    const previousCanvas = this.canvases_[this.previousFrame_.canvasId];
    let nextCanvas = previousCanvas;
    const resized = resizeCanvasIfNeeded(frameState, previousCanvas);
    let nextCanvasId = this.previousFrame_.canvasId;

    const [currentCenterX, currentCenterY] = frameState.viewState.center;
    const nextResolution = frameState.viewState.resolution;
    if (!resized && this.previousFrame_.resolution === nextResolution) {
      tmpPreviousCenterPixel[0] = this.previousFrame_.centerX;
      tmpPreviousCenterPixel[1] = this.previousFrame_.centerY;
      apply(frameState.coordinateToPixelTransform, tmpPreviousCenterPixel);

      const dx = tmpPreviousCenterPixel[0] - frameState.size[0] / 2;
      const dy = tmpPreviousCenterPixel[1] - frameState.size[1] / 2;
      if (dx !== 0 || dy !== 0) {
        nextCanvasId = (nextCanvasId + 1) % 2;
        nextCanvas = this.canvases_[nextCanvasId];
        resizeCanvasIfNeeded(frameState, nextCanvas);
        const newContext = nextCanvas.getContext('2d');
        newContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        newContext.drawImage(previousCanvas, dx, dy);
      }
    }

    this.previousFrame_.canvasId = nextCanvasId;
    this.previousFrame_.centerX = currentCenterX
    this.previousFrame_.centerY = currentCenterY;
    this.previousFrame_.resolution = nextResolution;

    const ctx = nextCanvas.getContext('2d');

    layer.doRender_(frameState, ctx);

    frameState.animate = true;
    return true;
  }

  /**
   * Called by the OpenLayer renderer on render if the layer is visible.
   * @param {import('ol/PluggableMap.js').FrameState} frameState
   * @param {import("ol/layer/Layer.js").State} layerState Layer state.
   * @param {CanvasRenderingContext2D} context Context
   */
  composeFrame(frameState, layerState, context) {
    const canvas = this.canvases_[this.previousFrame_.canvasId];
    const width = canvas.width;
    const height = canvas.height;
    context.drawImage(canvas, 0, 0, width, height);
  }
}

export default class CustomCanvasLayer extends Layer {
  constructor(options) {
    super({});
    this.doRender_ = options.renderFunction;
  }

  getSourceState() {
    return 'ready';
  }
}
