# OpenLayers wind layers

## Goal

Provide:
- a smooth particules layer animating the movement of the wind;
- an arrow layer displaying wind force and direction;
- a gradient layer displaying wind force;

Particles are kept while panning and zooming, contributing to a nice user experience.

It is compatible with OpenLayers 5 and probably OpenLayers 4.


## Demo
See https://gberaudo.github.io/olwind


## Blog post
See https://github.com/gberaudo/olwind/blob/master/blog.md


## Local dev
```
git clone https://github.com/gberaudo/olwind.git
cd olwind
npm install
npm start
```

## Limitations / Contribution ideas


- handling map rotation
  - arrows are shifted (OpenLayers bug?);
  - custom layers dimensions is fix;
- handling soft-zoom
  - when the browser uses softzoom (ctrl + wheel on a DOM element) the WebGL layer is shifted;
- particle speed changes with resolution, it should be fixed (in pixels / frame);
- WebGL gradient should use a nicer looking gradient (see OL heatmap);

If you are interested in working on one of these items, create an issue or contact me so that we can discuss it.


## Other interesting projects

- https://github.com/sakitam-fdd/wind-layer


## Custom dataset

If you want to use your own data, you need to provide 3 files:

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

## Licenses

The project is dual licensed:
- BSD-2 clause for its ease of use and reuse;
- GPL-3 as a tribute to Richard Stallman's incredible work for liberty.
