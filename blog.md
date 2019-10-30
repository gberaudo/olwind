# Introducing OpenLayers wind layers

## The project

OpenLayers is a popular JS library used to display advanced maps in the browser. It relies on the canvas API to render both image and vector data. I wanted to have a stab at implementing some particles and gradient layers. This opportunity came last summer when I received a "Camptocamp grant" to make it a reality; I would like to thank my colleagues who voted enthusiastically for my proposition.

Here is a short video of the results (data from [Meteotest](https://meteotest.ch/wetter/wind), thanks to them!):

![Video of the results](https://github.com/gberaudo/olwind/blob/master/video.gif)

Even, better [you can play with this live demo](https://gberaudo.github.io/olwind).


## Description of the layers

In the capture above you can see 3 layers which are all rendered based on some grid data: the horizontal and vertical wind speeds (u and v). In detail, there are:
- a layer with animated particles representing dust moved by the blowing of the wind;
- a layer with arrows representing the wind direction and strength;
- a layer with smooth gradient of wind speed representing the strengh of the wind.

### The particles layer

I was initially thinking of using WebGL to render this layer. However, since a CPU approach is often easier to debug, I decided to have a first try with an implementation 100% on the CPU. I was pleased by the performance. Currently, in the demo, 10'000 particles are rendered each frame which is both enough and smooth on desktop and smartphones.

Here is how it works:
- each particle has a geographic position, initially randomized in the displayed extent;
- each frame:
  - dead particles are recreated in the displayed extent;
  - particles are moved according to the local wind speeds;
  - the previously rendered canvas is dimmed, adjusted to the new viewport and new positions are rendered on top of it.


The following particle parameters can be easliy changed by editing the source code:
- number of particles;
- time to live;
- dimming factor.


### The arrows layer

This layer is a completely standard OpenLayers vector layer so I will no give many details here.

Simply note the use of:
- the *updateWhileInteracting* parameter to render when panning;
- the style function which efficiently avoid creating new styles each frame.


### The smooth gradient layer

This layer is implemented using WebGL. Indeed it requires computing an interpolated value for each pixel of the viewport which is a task perfectly fitted for WebGL.

The (u, v) data is sent to the GPU in 2 Float textures. There the fragment shader picks the interpolated wind speeds from the pixel coordinates and computes the resulting color using a gradient scale. This scale is hardcoded at the moment but it could be removed from the fragement shader to instead use a texture provided by the application.

Displaying geolocalized grid data as a gradient is quite general. It could be used for temperatures, elevations, slopes, ... I think it would be great to have a generalization of this layer directly in OpenLayers.


## Future

My work on implementing wind layers was essentially a Proof Of Concept. If you are interested in making it graduate to a production-ready status or adapted to a different use cases, let's get in touch!

[Here is the link to the code source](https://github.com/gberaudo/olwind).

Guillaume Beraudo
