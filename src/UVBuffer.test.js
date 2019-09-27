
import UVBuffer, { positionFromIndex, coordinateFromPosition, positionFromCoordinate, interpolatePosition } from './UVBuffer';


test('positionFromIndex', () => {
  const width = 10; // width is the number of columns in the data
  expect(positionFromIndex(0, width)).toEqual([0, 0]);
  expect(positionFromIndex(9, width)).toEqual([9, 0]);
  expect(positionFromIndex(10, width)).toEqual([0, 1]);
  expect(positionFromIndex(15, width)).toEqual([5, 1]);
});

test('coordinateFromPosition', () => {
  const width = 25; // width is the number of columns in the data
  const height = 6; // height is the number of rows in the data
  const extent = [
    -5, 4, // minx miny
    20, 10 // maxx maxy
  ];
  expect(coordinateFromPosition(extent, width, height, [0, 0])).toEqual([-5, 4]);
  expect(coordinateFromPosition(extent, width, height, [width, height])).toEqual([20, 10]);
  expect(coordinateFromPosition(extent, width, height, [0, height])).toEqual([-5, 10]);
  expect(coordinateFromPosition(extent, width, height, [width, 0])).toEqual([20, 4]);

  expect(coordinateFromPosition(extent, width, height, [5, 3])).toEqual([-5 + 5, 4 + 3]);
  expect(coordinateFromPosition(extent, 2 * width, 2 * height, [5, 3])).toEqual([-5 + 5/2, 4 + 3/2]);
});


test('positionFromCoordinate', () => {
  const width = 10; // width is the number of columns in the data
  const height = 5; // height is the number of rows in the data
  const extent = [
    0, 20, // minx miny
    5, 22.5 // maxx maxy
  ];
  expect(positionFromCoordinate(extent, width, height, [0, 20])).toEqual([0, 0]);
  expect(positionFromCoordinate(extent, width, height, [0, 22.5])).toEqual([0, height - 1]);
  expect(positionFromCoordinate(extent, width, height, [5, 22.5])).toEqual([width - 1, height - 1]);
  expect(positionFromCoordinate(extent, width, height, [5, 20])).toEqual([width - 1, 0]);
  expect(positionFromCoordinate(extent, width, height, [2.5, 21.25])).toEqual([(width - 1) / 2, (height - 1) / 2]);
});

test('interpolatePosition', () => {
  const width = 3; // width is the number of columns in the data
  // const height = 4; // height is the number of rows in the data
  const buffer = [ // Beware that the origin is at bottom left
    1, 2, 3,
    5, 7, 9,
    11, 13, 17,
    19, 23, 29
  ];
  expect(interpolatePosition(width, [0, 0], buffer)).toEqual(1);
  expect(interpolatePosition(width, [1, 0], buffer)).toEqual(2);
  expect(interpolatePosition(width, [2, 0], buffer)).toEqual(3);
  expect(() => interpolatePosition(width, [3, 0], buffer)).toThrow();
  expect(interpolatePosition(width, [0, 1], buffer)).toEqual(5);
  expect(interpolatePosition(width, [1, 1], buffer)).toEqual(7);
  expect(interpolatePosition(width, [2, 3], buffer)).toEqual(29);
  expect(() => interpolatePosition(width, [2, 4], buffer)).toThrow();

  expect(interpolatePosition(width, [0.5, 0.5], buffer)).toEqual((1+2+5+7)/4);
  expect(interpolatePosition(width, [1.5, 1.5], buffer)).toEqual((7+9+13+17)/4);
  expect(interpolatePosition(width, [0.5, 2.5], buffer)).toEqual((11+13+19+23)/4);
});


test('create UVBuffer', () => {
  const uGroup = [2.2, 3, 5, 7, 9, 11.18];
  const vGroup = [-13.7, -17, -19, -23, -29, -31.62];
  const width = 2;
  const height = 3;
  const extent = [0, 0, 20, 30];
  const buffer = new UVBuffer(uGroup, vGroup, width, height, extent);
  expect(buffer.getUVSpeed([0, 0])[0]).toBeCloseTo(2.2);
  expect(buffer.getUVSpeed([0, 0])[1]).toBeCloseTo(-13.7);
  expect(buffer.getUVSpeed([20, 30])[0]).toBeCloseTo(11.18);
  expect(buffer.getUVSpeed([20, 30])[1]).toBeCloseTo(-31.62);
})