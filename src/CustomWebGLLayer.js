import Layer from 'ol/layer/Layer'
import Observable from 'ol/Observable';
import { resizeCanvasIfNeeded } from './util.js';


export class CustomWebGLLayerRenderer extends Observable {

  /**
   * @param {CustomWebGLLayer} layer
   */
  constructor(layer) {
    super();
    this.layer = layer;
    this.canvas_ = document.createElement('canvas');
    this.canvas_.classList.add('custom-canvas');
    //document.body.appendChild(this.canvas_);
  }

  /**
   * Determine if this renderer handles the provided layer.
   * @param {import("ol/layer/Layer.js").default} layer The candidate layer.
   * @return {boolean} The renderer can render the layer.
   */
  static handles(layer) {
    return layer instanceof CustomWebGLLayer;
  }

  /**
   * Create a layer renderer.
   * @param {import("../Map.js").default} _ The map renderer.
   * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
   * @return {CustomWebGLLayerRenderer} The layer renderer.
   */
  static create(_, layer) {
    return new CustomWebGLLayerRenderer(/** @type {CustomWebGLLayer} */ (layer));
  }

  /**
   * Called by the OpenLayer renderer on render if the layer is visible.
   * @param {import('ol/PluggableMap.js').FrameState} frameState
   */
  prepareFrame(frameState) {
    const layer = this.layer;

    resizeCanvasIfNeeded(frameState, this.canvas_);

    const ctx = this.canvas_.getContext('webgl');
    return layer.doRender_.call(layer, frameState, ctx);
  }

  /**
   * Called by the OpenLayer renderer on render if the layer is visible.
   * @param {import('ol/PluggableMap.js').FrameState} frameState
   * @param {import("ol/layer/Layer.js").State} layerState Layer state.
   * @param {CanvasRenderingContext2D} context Context
   */
  composeFrame(frameState, layerState, context) {
    context.globalAlpha = this.layer.getOpacity() || 1;
    context.drawImage(this.canvas_, 0, 0, this.canvas_.width, this.canvas_.height);
    context.globalAlpha = 1;
  }
}

export default class CustomWebGLLayer extends Layer {
  constructor(options) {
    super({
      opacity: options.opacity
    });
    this.doRender_ = options.renderFunction;
  }

  getSourceState() {
    return 'ready';
  }
}
