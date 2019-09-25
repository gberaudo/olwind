const map = window.map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    zoom: 10
  })
});

const Style = ol.style.Style;
const Icon = ol.style.Icon;
const colorAsArray = ol.color.asArray;

const arrowStyles = {};
['red', 'green', 'black', 'blue'].forEach(color => {
  const style = new Style({
    image: new Icon({
      src: 'white-arrow.png',
      color
    })
  });
  arrowStyles[color] = style;
});

const extent = ol.extent.createEmpty();
const features = [];
function addPoint(lonLat, data) {
  const coordinate = ol.proj.fromLonLat(lonLat);
  const boundingExtent = ol.extent.boundingExtent([coordinate]);
  ol.extent.extend(extent, boundingExtent);
  features.push(new ol.Feature(new ol.geom.Point([...coordinate, data], 'XYM')));
}

Promise.all([
  fetch('./grid.json').then(r => r.json()),
  fetch('./u.json').then(r => r.json()),
  fetch('./v.json').then(r => r.json()),
]).then(array => {
  const [grid, us, vs] = array;
  const shape = grid._metadata.shape;
  for (let g = 0; g < shape[0]; ++g) {
    const latGroup = grid.lat[g];
    const lonGroup = grid.lon[g];
    const uGroup = us.array[g];
    const vGroup = vs.array[g];
    for (let i = 0; i < shape[1]; ++i) {
      const lonLat = [lonGroup[i], latGroup[i]];
      const u = uGroup[i];
      const v = vGroup[i];
      const speed = Math.sqrt(u * u + v * v);
      const rotation = Math.atan2(v, u) * 180 / Math.PI;
      const data = {u, v, speed, rotation};
      addPoint(lonLat, data);
    }
  }
  const center = ol.extent.getCenter(extent);

  map.getView().setCenter(center);
  const source = new ol.source.Vector({
    features
  });
  map.addLayer(new ol.layer.Vector({
    style(feature, resolution) {
      const {speed, rotation} = feature.getGeometry().getCoordinates()[2];
      let color = 'black';
      if (speed < 0.5) {
        color = 'blue';
      } else if (speed < 1) {
        color = 'green';
      } else {
        color = 'red';
      }
      const style = arrowStyles[color];
      style.getImage().setRotation(rotation);
      return style;
    },
    source
  }));
});
