import { init_buffers } from "./init-buffers.js";
import { draw_scene } from "./draw-scene.js";

console.log("Hello from js");

function load_shader(gl, type, src) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, src);

  gl.compileShader(shader);

  const compile_status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compile_status) {
    const err = gl.getShaderInfoLog(shader);
    console.error("Error compiling shader: %o", err);

    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

function init_shader_program(gl, vertex_shader_src, fragment_shader_src) {
  const vertex_shader = load_shader(gl, gl.VERTEX_SHADER, vertex_shader_src);
  const fragment_shader = load_shader(gl, gl.FRAGMENT_SHADER, fragment_shader_src);

  const program = gl.createProgram();
  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);

  const link_status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!link_status) {
    const err = gl.getProgramInfoLog(program);
    console.error("Error linking shader: %o", err);

    return null;
  }

  return program;
}

function main() {
  const canvas = document.getElementById("mesh-editor");
  console.log("We found the canvas: %o", canvas);

  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("Unable to initialize WebGL2");
    return;
  }

  console.info("Got ctx: %o", gl);

  const vertex_shader_elem = document.getElementById("vertex-shader");
  const fragment_shader_elem = document.getElementById("fragment-shader");

  const shader_program = init_shader_program(gl, vertex_shader_elem.innerText, fragment_shader_elem.innerText);

  const program_info = {
    program: shader_program,
    attrib_locations: {
      vertex_pos: gl.getAttribLocation(shader_program, "a_vertexPosition"),
    },
    uniform_locations: {
      projection_matrix: gl.getUniformLocation(shader_program, "u_projectionMatrix"),
      model_view__matrix: gl.getUniformLocation(shader_program, "u_modelViewMatrix"),
    },
  };

  const buffers = init_buffers(gl);
  console.log("Created buffers: %o", buffers);

  draw_scene(gl, program_info, buffers);
}

main();
