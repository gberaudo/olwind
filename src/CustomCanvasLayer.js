import Layer from 'ol/layer/Layer'
import Observable from 'ol/Observable';


export class CustomCanvasLayerRenderer extends Observable {

  /**
   * @param {CustomCanvasLayer} layer
   */
  constructor(layer) {
    super();
    this.layer = layer;
    this.canvas_ = document.createElement('canvas');
    this.canvas_.classList.add('custom-canvas');
    // document.body.appendChild(this.canvas_);
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

    const ctx = this.canvas_.getContext('2d');
    let [width, height] = frameState.size;
    width *= frameState.pixelRatio;
    height *= frameState.pixelRatio;
    if (this.canvas_.width !== width || this.canvas_.height !== height) {
      this.canvas_.width = width;
      this.canvas_.height = height;
    }

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
    const width = this.canvas_.width;
    const height = this.canvas_.height;
    context.drawImage(this.canvas_, 0, 0, width, height);
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
