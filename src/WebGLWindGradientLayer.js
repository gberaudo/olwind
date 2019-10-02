import CustomWebGLLayer, { CustomWebGLLayerRenderer } from "./CustomWebGLLayer";
import { createClippingSpaceToDatasetTransform, createMatrix3FromTransform } from './util';



export function createTransform(uvBuffer, map) {
  const mapSize = map.getSize();
  const view = map.getView();
  const viewportExtent = view.calculateExtent(mapSize);
  return createClippingSpaceToDatasetTransform(mapSize, viewportExtent, uvBuffer.extent);
}


export class WebGLWindGradientLayer extends CustomWebGLLayer {
  constructor(options) {
    super({
      opacity: options.opacity,
      renderFunction: (...args) => { return this.reallyDoRender_(...args); }
    });

    this.uvBuffer = options.uvBuffer;
    if (!this.uvBuffer) {
      console.error('You must pass the uvbuffer in constructor');
    }

    this.map = options.map;
    if (!this.map) {
      console.error('You must pass the map in constructor');
    }
    
    this.map.getRenderer().registerLayerRenderers([CustomWebGLLayerRenderer])
  }

  reallyDoRender_(frameState, context) {
    if (!this.matrixLoc) {
      this.createProgram_(context);
    }
    this.draw(context);
    frameState.animate = true;
    return true;
  }


  /**
   * @param {CanvasRenderingContext2D} gl 
   */
  createProgram_(gl) {
    // gl =  WebGLDebugUtils.makeDebugContext(gl);
    var vertices = [-1, 1, -1, -1, 1, -1, 1, 1];

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      alert("this machine or browser does not support OES_texture_float");
      return;
    }
    var linear = gl.getExtension("OES_texture_float_linear");
    if (!linear) {
      alert("this machine or browser does not support  OES_texture_float_linear");
      return;
    }

    const indices = [0, 1, 2, 3];

    // Create an empty buffer object to store vertex buffer
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create an empty buffer object to store Index buffer
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    /*====================== Shaders =======================*/

    // Vertex shader source code
    var vertCode = `
    attribute vec2 coordinates;
    void main(void) {
      gl_Position = vec4(coordinates, 0.0, 1.0);
    }
  `;

    // Create a vertex shader object
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    // Fragment shader source code
    var fragCode = `
 #ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
  #else
    precision mediump float;
  #endif
    uniform sampler2D texu;
    uniform sampler2D texv;
    uniform mat3 matrix;

    vec3 colorA = vec3(0.0, 0.0, 1.0);
    vec3 colorB = vec3(0.0, 1.0, 0.0);
    vec3 colorC = vec3(1.0, 0.0, 0.0);

    void main(void) {
      mediump vec3 coord = matrix * vec3(gl_FragCoord.x, gl_FragCoord.y, 1);
      mediump float speedu = texture2D(texu, coord.xy).x;
      mediump float  speedv = texture2D(texv, coord.xy).y;
      float speed = sqrt(speedu * speedu + speedv * speedv);
      if (coord.x < 0.0 || coord.y < 0.0 || coord.x > 1.0 || coord.y > 1.0) {
        discard;
      }
      vec3 color = colorC;
      if (speed < 5.0) {
        color = mix(colorA, colorB, speed / 5.0);
      } else if (speed < 10.0) {
        color = mix(colorB, colorC, (speed - 5.0) / 5.0);
      }
      gl_FragColor = vec4(color.rgb, 1.0);
    }
  `;

    // Create fragment shader object 
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    // Create a shader program object to
    // store the combined shader program
    var shaderProgram = gl.createProgram();

    // Attach a vertex shader
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    gl.validateProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      var info = gl.getProgramInfoLog(shaderProgram);
      throw 'Could not compile WebGL program. \n\n' + info;
    }

    // Use the combined shader program object
    gl.useProgram(shaderProgram);

    /* ======= Associating shaders to buffer objects =======*/

    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Get the attribute location
    var coordPtr = gl.getAttribLocation(shaderProgram, "coordinates");

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(coordPtr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordPtr);


    // Workaround alignment issues
    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

    this.reloadTextures(gl);

    const texuLoc = gl.getUniformLocation(shaderProgram, "texu");
    gl.uniform1i(texuLoc, 0);

    const texvLoc = gl.getUniformLocation(shaderProgram, "texv");
    gl.uniform1i(texvLoc, 1);

    const matrixLoc = gl.getUniformLocation(shaderProgram, "matrix");
    this.matrixLoc = matrixLoc;
  }

  activateTexture(gl, nb, uvBuffer) {
    gl.activeTexture(nb === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    const internalFormat = gl.LUMINANCE;
    const width = uvBuffer.dataWidth_;
    const height = uvBuffer.dataHeight_;
    const border = 0;
    const format = gl.LUMINANCE;
    const type = gl.FLOAT;
    const data = nb === 0 ? uvBuffer.uBuffer_ : uvBuffer.vBuffer_;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, border, format, type, data);
  }


  reloadTextures(gl) {
    this.activateTexture(gl, 0, this.uvBuffer)
    this.activateTexture(gl, 1, this.uvBuffer)
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} gl 
   */
  draw(gl) {
    const matrix = createMatrix3FromTransform(createTransform(this.uvBuffer, this.map));
    gl.uniformMatrix3fv(this.matrixLoc, false, matrix);
    /*============= Drawing the Quad ================*/

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the view port
    const canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);
  }

}