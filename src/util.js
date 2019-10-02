
import {create, scale, translate, multiply} from 'ol/transform';
import {getCenter, getSize} from 'ol/extent';


export function createExtentTransformToUnit(extent) {
  const center = getCenter(extent);
  const size = getSize(extent);
  const translateToOrigin = translate(create(), -center[0], -center[1]);
  const scaleToUnit = scale(create(),  2 / size[0], 2 / size[1]);
  return multiply(scaleToUnit, translateToOrigin);
}

export function createExtentTransformFromUnit(extent) {
  const center = getCenter(extent);
  const size = getSize(extent);
  const scaleToSize = scale(create(), size[0] / 2, size[1] / 2);
  const translateToCenter = translate(create(), center[0], center[1]);
  return multiply(translateToCenter, scaleToSize);
}

/**
 * Create the matrix to transform coordinates in the source extent
 * to coordinates in the destination extent.
 */
export function createExtentTransform(srcExtent, dstExtent) {
  const A = createExtentTransformToUnit(srcExtent);
  const B = createExtentTransformFromUnit(dstExtent);
  return multiply(B, A);
}

export function createClippingSpaceToDatasetTransform(canvasSize, viewportExtent, datasetExtent) {
  // console.log(canvasSize, viewportExtent, datasetExtent);
  const A = createExtentTransform([0, 0, ...canvasSize], viewportExtent);
  const B = createExtentTransform(datasetExtent, [0, 0, 1, 1]);
  // const B = createExtentTransform(viewportExtent, [0, 0, 1, 1]);  // hack to have the viewport always cover the whole dataset
  return multiply(B, A);
}

export function createMatrix3FromTransform(t) {
  return [
    t[0], t[1], 0,
    t[2], t[3], 0,
    t[4], t[5], 1
  ];
}

export function resizeCanvasIfNeeded(frameState, canvas) {
  let [width, height] = frameState.size;
  width *= frameState.pixelRatio;
  height *= frameState.pixelRatio;
  // if (frameState.viewState.rotation !== 0) {
  //   width = Math.max(width, height) * 1.5;
  //   height = width;
  // }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
}