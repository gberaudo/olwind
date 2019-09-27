const fs = require('fs');

import {createEmpty, extendCoordinate} from 'ol/extent';
import {fromLonLat} from 'ol/proj';


function readFile(filename) {
  return new Promise(resolve => {
    fs.readFile(filename, (err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data));
    });
  });
}

const extent = createEmpty();
Promise.all([
  readFile('./grid.json'),
  readFile('./u.json'),
  readFile('./v.json'),
]).then(array => {
  const [grid, us, vs] = array;
  const shape = grid._metadata.shape;
  const myUs = [];
  const myVs = [];
  for (let g = 0; g < grid.lat.length; ++g) {
    const latGroup = grid.lat[g];
    const lonGroup = grid.lon[g];
    const uGroup = us.array[g];
    const vGroup = vs.array[g];
    for (let i = 0; i < latGroup.length; ++i) {
      const lonLat = [lonGroup[i], latGroup[i]];
      let u = uGroup[i];
      let v = vGroup[i];
      myUs.push(u);
      myVs.push(v);
      const coordinate = fromLonLat(lonLat);
      extendCoordinate(extent, coordinate);
    }
  }

  const uFile = process.cwd() + '/u.bin';
  const vFile = process.cwd() + '/v.bin';
  const metaFile = process.cwd() + '/metadata.json';

  // Surprisingly, writing binary data is not straight forward
  function writeBinaryBuffer(filename, data) {
    const wstream = fs.createWriteStream(filename);
    //prepare the length of the buffer to 4 bytes per float
    const buffer = new Buffer(data.length*4);
    for (let i = 0; i < data.length; i++){
        //write the float in Little-Endian and move the offset
        buffer.writeFloatLE(data[i], i*4);
    }

    wstream.write(buffer);
    wstream.end();
    console.log("The file was saved!", filename);
  }

  writeBinaryBuffer(uFile, new Float32Array(myUs));
  writeBinaryBuffer(vFile, new Float32Array(myVs));

  fs.writeFile(metaFile, JSON.stringify({
    extent,
    width: shape[1], // !!
    height: shape[0] // !!
  }), function(err) {
    if (err) {
        throw new Error(err);
    }
    console.log("The file was saved!", metaFile);
  });
});
