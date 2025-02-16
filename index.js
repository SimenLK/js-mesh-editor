import { mat4 } from "gl-matrix";

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

function create_mesh() {
  const mesh = {
    pos: { x: -1.0, y: 1.0 },
    // Four points for a triangle strip.
    // TODO: Make indicies and triangles
    vertices: [
      1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      -1.0, -1.0,
    ],
    colors: [
      1.0, 1.0, 1.0, 1.0, // white
      1.0, 0.0, 0.0, 1.0, // red
      0.0, 1.0, 0.0, 1.0, // green
      0.0, 0.0, 1.0, 1.0, // blue
    ],
  };

  return mesh;
}

let start_time;

function step(state, timestamp) {
  const mesh = state.mesh;

  const elapsed = timestamp - start_time;
  start_time = timestamp;

  let new_pos = mesh.pos;

  if (state.keys.left) {
    new_pos.x -= 0.01;
  }
  if (state.keys.right) {
    new_pos.x += 0.01;
  }

  state.mesh.pos = new_pos;

  // console.debug("Render: timestamp: %i - %i = %i", timestamp, start_time, elapsed);
  draw_scene(state);

  requestAnimationFrame((t) => step(state, t));
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

  console.log("Vertex shader:\n%s", vertex_shader_elem.innerText);

  const shader_program =
    init_shader_program(
      gl,
      vertex_shader_elem.innerText,
      fragment_shader_elem.innerText
    );

  // TODO: Only the program info?
  const program_info = {
    program: shader_program,
    attrib_locations: {
      vertex_pos: gl.getAttribLocation(shader_program, "a_vertexPosition"),
      vertex_color: gl.getAttribLocation(shader_program, "a_vertex_color"),
    },
    uniform_locations: {
      model_to_world: gl.getUniformLocation(shader_program, "u_model_to_world"),
      world_to_view: gl.getUniformLocation(shader_program, "u_world_to_view"),
      view_to_projection: gl.getUniformLocation(shader_program, "u_view_to_projection"),
    },
  };

  const mesh = create_mesh();

  const buffers = init_buffers(gl, mesh.vertices, mesh.colors);

  const state = {
    gl: gl,
    program_info: program_info,
    buffers: buffers,
    keys: {
      left: false,
      right: false,
    },
    mesh: mesh,
  };

  console.log("Starting render with state: %o", state);
  //console.dir(canvas);
  console.debug("canvas type: %s", typeof(canvas));

  document.onkeydown = (event) => {
    // console.debug("key down: %s => %i", event.key, event.keyCode);

    switch (event.keyCode) {
      case 37: {
        state.keys.left = true;
        break;
      }
      case 39: {
        state.keys.right = true;
        break;
      }
    }
  };

  document.onkeyup = (event) => {
    // console.debug("document key up: %s => %i", event.key, event.keyCode);

    switch (event.keyCode) {
      case 37: {
        state.keys.left = false;
        break;
      }
      case 39: {
        state.keys.right = false;
      } break;
    }
  };

  requestAnimationFrame((t) => step(state, t));
}

main();

// vim: set ts=2 sw=2:
