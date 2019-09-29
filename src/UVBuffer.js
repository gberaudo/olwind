import {clone} from 'ol/extent';

/**
 * The array buffer contains flattened values.
 * @param {number} i position in the buffer
 * @param {number} width number of columns
 * @return {number[]} [x,y] position in the data 2 dimensional array
 */
export function positionFromIndex(i, width) {
  console.assert(Number.isInteger(i) && i >= 0);
  const x = i % width;
  const y = (i - x) / width;
  console.assert(Number.isInteger(y) && y >= 0);
  return [x, y];
}

/**
 * 
 * @param {import('ol/extent/Extent').default} extent geographical extent of the data
 * @param {number} width width of the data 2 dimensional array
 * @param {number} height height of the  data 2 dimensional array
 * @param {number[]} position in the data 2 dimensional array
 * @return {number[]} geographical coordinates
 */
export function coordinateFromPosition(extent, width, height, position) {
  const xRatio = position[0] / width;
  const yRatio = position[1] / height;
  const x = extent[0] + (extent[2] - extent[0]) * xRatio;
  const y = extent[1] + (extent[3] - extent[1]) * yRatio;
  return [x, y];
}

/**
 * @param {import ('ol/extent/Extent.js').default} extent geographical extent of the data
 * @param {number} width number or columns of the data 2 dimensional array
 * @param {number} height number of rows of the data 2 dimensional array
 * @param {number[]} geographical coordinates
 * @return {number[]} position in the data 2 dimensional array
 */
export function positionFromCoordinate(extent, width, height, coordinate) {
  // extent:  `[minx, miny, maxx, maxy]`
  // Ratio of the extent where the coordinate is located
  const xRatio = (coordinate[0] - extent[0]) / (extent[2] - extent[0]);
  const yRatio = (coordinate[1] - extent[1]) / (extent[3] - extent[1]);

  const x = xRatio * (width - 1);
  const y = yRatio * (height - 1);
  return [x, y];
}

/**
 * 
 * @param {number} width number or columns
 * @param {number[]} coordinate
 * @param {ArrayBuffer} buffer
 * @return {number}
 */
export function interpolatePosition(width, position, buffer) {
  //position = [55, 100];
  const [x, y] = position;
  if (position[0] >= width) {
    throw new Error('Out of bound');
  }

  if (position[1] * width + position[0] >= (buffer.length)) {
    throw new Error('Out of buffer bound');
  }

  const x1 =  Math.floor(x);
  const y1 =  Math.floor(y);
  const x2 =  Math.ceil(x);
  const y2 =  Math.ceil(y);

  const dx = x - x1;
  const dy = y - y1;

  const fx2y1 = buffer[x2 + width * y1];
  const fx1y1 = buffer[x1 + width * y1];
  const fx1y2 = buffer[x1 + width * y2];
  const fx2y2 = buffer[x2 + width * y2];
  const dfx = fx2y1 - fx1y1;
  const dfy = fx1y2 - fx1y1;
  const dfxy = fx1y1 + fx2y2 - fx2y1 - fx1y2;

  //return fx1y1;
  return dfx * dx + dfy * dy + dfxy * dx * dy + fx1y1;
}


export default class UVBuffer {
  /**
   * The dataset is a matrix of velocities.
   * The origin is at the bottom left
   * - 8, 9, 10, 11
   * - 4, 5, 6, 7
   * - 0, 1, 2, 3
   * Here width = 4 and height = 3.
   * @param {Float32Array||number[]} us Horizontal velocities
   * @param {Float32Array||number[]} vs Vertival velocities
   * @param {number} width number of columns in the dataset
   * @param {number} height number of rows in the dataset
   * @param {import('ol/coordinate').default[]} extent Geographical extent of the dataset
   */
  constructor(us, vs, width, height, extent) {
    if (us.length != width * height) {
      throw new Error(`Us size ${us.length} is not consistent with data dimensions: ${width}x${height}`);
    }
    if (vs.length != width * height) {
      throw new Error(`Vs size ${vs.length} is not consistent with data dimensions: ${width}x${height}`);
    }
    this.extent = clone(extent);
    this.dataWidth_ = width;
    this.dataHeight_ = height;
    this.speedBuffer_ = new Float32Array(us.length);
    this.simpleSpeedBuffer = new Uint8Array(us.length);
    this.rotationBuffer_ = new Float32Array(us.length);
    this.uBuffer_ = us;
    this.vBuffer_ = vs;
    this.density = [
      width / (extent[2] - extent[0]),
      height / (extent[3] - extent[1]),
    ];
    for (let i = 0; i < us.length; ++i) {
      const u = us[i];
      const v = vs[i];
      const speed = Math.sqrt(u * u + v * v);
      const rotation = Math.atan2(v, u);
      this.speedBuffer_[i] = speed;
      this.simpleSpeedBuffer[i] = Math.ceil(speed);
      this.rotationBuffer_[i] = rotation;
    }
    console.log(`Size: ${this.dataWidth_}x${this.dataHeight_} = ${this.uBuffer_.length}`);
  }


  getUVSpeed(coordinate) {
    const width = this.dataWidth_;
    const height = this.dataHeight_;
    const position = positionFromCoordinate(this.extent, width, height, coordinate);
    const u = interpolatePosition(width, position, this.uBuffer_);
    const v = interpolatePosition(width, position, this.vBuffer_);
    return [u,v];
  }

  getRotation(i) {
    return this.rotationBuffer_[i];
  }

  getSpeed(i) {
    return this.speedBuffer_[i];
  }

  saveU() {
    const link = document.createElement( 'a' );
    link.style.display = 'none';
    document.body.appendChild( link );

    const blob = new Blob( [ this.uBuffer_ ], { type: 'application/octet-stream' } );	
    const objectURL = URL.createObjectURL( blob );
    
    link.href = objectURL;
    link.href = URL.createObjectURL( blob );
    link.download =  'u.binary';
    link.click();
    
  }
}