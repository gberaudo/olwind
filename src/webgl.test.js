import {createExtentTransform, createExtentTransformToUnit, createExtentTransformFromUnit, createClippingSpaceToDatasetTransform} from './util';

export function safeApply(transform, coordinate) {
  const x = coordinate[0];
  const y = coordinate[1];
  const output = [];
  output[0] = transform[0] * x + transform[2] * y + transform[4];
  output[1] = transform[1] * x + transform[3] * y + transform[5];
  return output;
}

test('transform [-1, -1, 1, 1] to [-1, -1, 1, 1]', () => {
  let P = createExtentTransformToUnit([-1, -1, 1, 1]);
  expect(safeApply(P, [-1, -1])).toEqual([-1, -1]);
  expect(safeApply(P, [1, 1])).toEqual([1, 1]);

  P = createExtentTransformFromUnit([-1, -1, 1, 1]);
  expect(safeApply(P, [-1, -1])).toEqual([-1, -1]);
  expect(safeApply(P, [1, 1])).toEqual([1, 1]);

  P = createExtentTransform([-1, -1, 1, 1], [-1, -1, 1, 1]);
  expect(safeApply(P, [-1, -1])).toEqual([-1, -1]);
  expect(safeApply(P, [1, 1])).toEqual([1, 1]);
});


test('transform [-1, -1, 1, 1] to [0, 0, 6, 6]', () => {
  let P = createExtentTransformFromUnit([0, 0, 6, 6]);
  expect(safeApply(P, [-1, -1])).toEqual([0, 0]);
  expect(safeApply(P, [1, 1])).toEqual([6, 6]);

  P = createExtentTransform([-1, -1, 1, 1], [0, 0, 6, 6]);
  expect(safeApply(P, [-1, -1])).toEqual([0, 0]);
  expect(safeApply(P, [1, 1])).toEqual([6, 6]);
});


test('transform [0, 0, 6, 6] to [-1, -1, 1, 1]', () => {
  let P = createExtentTransformToUnit([0, 0, 6, 6]);
  expect(safeApply(P, [0, 0])).toEqual([-1, -1]);
  expect(safeApply(P, [6, 6])).toEqual([1, 1]);

  P = createExtentTransform([0, 0, 6, 6], [-1, -1, 1, 1]);
  expect(safeApply(P, [0, 0])).toEqual([-1, -1]);
  expect(safeApply(P, [6, 6])).toEqual([1, 1]);
});



test('transform [0, 0, 6, 6] to [-1, -1, 1, 1]', () => {
  let P = createExtentTransformToUnit([0, 0, 6, 6]);
  expect(safeApply(P, [0, 0])).toEqual([-1, -1]);
  expect(safeApply(P, [6, 6])).toEqual([1, 1]);

  P = createExtentTransform([0, 0, 6, 6], [-1, -1, 1, 1]);
  expect(safeApply(P, [0, 0])).toEqual([-1, -1]);
  expect(safeApply(P, [6, 6])).toEqual([1, 1]);
});


expect.extend({
  toBeCloseArray(received, expected) {
    if (!received.length === expected.length) {
      return {
        pass: false,
        message: () => `expected array length: ${expected.length}. Actual: ${received.length}`,
      };
    }
    for (let i = 0; i < expected.length; ++i) {
      if (Math.abs(expected[i] - received[i]) > 10**-10) {
        return {
          pass: false,
          message: () => `expected[${i}] (${expected[i]}) !==  received[${i}] (${received[i]})`,
        };
      }
    }
    return {
      pass: true,
      message: () => '',
    };
  },
});

test('transform from clipping space to dataset', () => {
  const viewportExtent = [100, 100, 300, 200]; // [minx, miny, maxx, maxy]
  // We choose dataWidth: 200, dataHeight: 100
  let P = createClippingSpaceToDatasetTransform(viewportExtent, [100, 100, 300, 200]);
  expect(safeApply(P, [-1, -1])).toEqual([0, 0]);
  expect(safeApply(P, [1, 1])).toEqual([1, 1]);

  P = createClippingSpaceToDatasetTransform(viewportExtent, [0, 0, 200, 100]);
  expect(safeApply(P, [-1, -1])).toEqual([0.5, 1]);
  expect(safeApply(P, [1, 1])).toEqual([1.5, 2]);

  P = createClippingSpaceToDatasetTransform(viewportExtent, [100, 100, 600, 400]);
  expect(safeApply(P, [-1, -1])).toBeCloseArray([0, 0]);
  expect(safeApply(P, [1, 1])).toBeCloseArray([2/5, 1/3]);
});
