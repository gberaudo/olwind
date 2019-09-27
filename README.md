# OpenLayers wind layers

## Goal

Provide:
- an arrow layer displaying wind force and direction;
- a smooth particules layer animating the movement of the wind.

Particles are kept while panning and zooming, contributing to a nice user experience.

The project currently uses the canvas 2D API making it usable on any browser.
It is compatible with OpenLayers 5 and probably OpenLayers 4.

## Dataset

You need to provide 3 files:

- metadata.json
```json
{
  "extent":[576551.1954449099,5667450.411567883,1300927.6096102786,6160637.315193227],
  "width":233,
  "height":347
}
```

Where:
  - extent: the geographical extent of the dataset;
  - width: the number of columns of the dataset;
  - height: the number of rows of the dataset;

- u.bin et v.bin
  the horizontal and vertical speeds as a 32 bit array of floating points.
  the indices in these files map to the following layout:
  ```
  9, 10, 11, 12
  5,  6,  7,  8
  1,  2,  3,  4
  ```

## Demo
See https://gberaudo.github.io/olwind


## Local dev
```
git clone https://github.com/gberaudo/olwind.git
cd olwind
npm install
npm start
```

## Other interesting projects

- https://github.com/sakitam-fdd/wind-layer


