import { mat4, vec3, vec2 } from "gl-matrix";

import { init_buffers, upload_new_buffer_data, upload_buffer_segment } from "./init-buffers.js";
import { draw_scene } from "./draw-scene.js";

console.log("Hello from js");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function calculate_barycentric(length) {
}

// TODO: Load mesh from file. Drop file into browser for easy access.
function create_mesh() {
  const vertices = new Float32Array([
     0.0,  1.0,
    -1.0, -1.0,
     1.0, -2.0,
     2.0,  1.0,
     3.0, -1.0,
     4.0, -1.0,
     3.0, -2.0,
  ]);
  const indices = [
    0, 1, 2,
    0, 2, 3,
    2, 3, 4,
    4, 5, 3,
    4, 6, 2,
    5, 6, 4,
  ];
  //const barycentric = calculate_barycentric(vertices.length);
  const barycentric = [
    0, 1, 0,
    0, 0, 1,
    1, 0, 0,
    0, 0, 1,
    0, 1, 0,
    1, 0, 0,
    0, 0, 1,
  ];
  const mesh = {
    pos: { x: -1.0, y: 1.0 },
    // y axis rotation in radians?
    angle: 0.0,
    // A triangle
    vertices: vertices,
    barycentric: barycentric,
    indices: indices,
    colors: [
      1.0, 0.0, 0.0, 1.0, // red
      0.0, 1.0, 0.0, 1.0, // green
      0.0, 0.0, 1.0, 1.0, // blue
      1.0, 0.0, 1.0, 1.0, // idk
    ],
  };

  return mesh;
}

let fps_chart_elem = document.getElementById("fps-chart");
let times = [];
let start_time_s;

const model_rotate_speed = 2.0;

function step(state, timestamp_ms) {
  const mouse = state.mouse;
  const camera = state.camera;
  const mesh = state.mesh;

  const timestamp_s = 0.001 * timestamp_ms;
  const elapsed_s = timestamp_s - start_time_s;
  start_time_s = timestamp_s;

  if (state.frame_count % 100 === 0) {
    times.push(1000 * elapsed_s);
    const formatted = times.map((time) => time.toFixed(5));
    fps_chart_elem.innerText = formatted;
    if (times.length > 10) {
      times.shift();
    }
  }

  if (mouse.pressed) {
    let delta = vec2.create();
    delta = vec2.subtract(vec2.create(), mouse.pos, mouse.old_pos);
    // TODO: Optional sensitivity on the scale here?
    delta = vec2.scale(vec2.create(), delta, 0.02);

    // TODO: I don't know why I have to flip the y here
    const v3 = vec3.fromValues(delta[0], -delta[1], 0.0);
    camera.pos = vec3.add(vec3.create(), camera.pos, v3);
  }

  state.mouse.old_pos = state.mouse.pos;

  let new_pos = mesh.pos;

  // NOTE: Is the cameras movement inverted?
  if (state.keys.left) {
    camera.pos[0] += camera.speed * elapsed_s;
  }
  if (state.keys.up) {
    camera.pos[1] -= camera.speed * elapsed_s;
  }
  if (state.keys.right) {
    camera.pos[0] -= camera.speed * elapsed_s;
  }
  if (state.keys.down) {
    camera.pos[1] += camera.speed * elapsed_s;
  }
  if (state.keys.rotate_left) {
    mesh.angle -= model_rotate_speed * elapsed_s;
  }
  if (state.keys.rotate_right) {
    mesh.angle += model_rotate_speed * elapsed_s;
  }

  state.mesh.pos = new_pos;

  let vertex_moved = false;
  let new_vertex_pos =
    vec2.fromValues(
      mesh.vertices[state.selected_vertex_idx],
      mesh.vertices[state.selected_vertex_idx + 1],
    );

  if (state.keys.move_left) {
    new_vertex_pos[0] -= 0.1;
    vertex_moved = true;
  }
  if (state.keys.move_right) {
    new_vertex_pos[0] += 0.1;
    vertex_moved = true;
  }
  if (state.keys.move_up) {
    new_vertex_pos[1] += 0.1;
    vertex_moved = true;
  }
  if (state.keys.move_down) {
    new_vertex_pos[1] -= 0.1;
    vertex_moved = true;
  }

  mesh.vertices[state.selected_vertex_idx] = new_vertex_pos[0];
  mesh.vertices[state.selected_vertex_idx + 1] = new_vertex_pos[1];

  if (vertex_moved) {
    // TODO: Try not updating the buffer
    const gl_info = state.gl_info;
    const gl = gl_info.gl;
    upload_buffer_segment(gl, gl_info.buffers.position, 0, new_vertex_pos);
  }

  // console.debug("Render: timestamp: %i - %i = %i", timestamp, start_time, elapsed);
  draw_scene(state);

  state.frame_count += 1;

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
      // vertex_color: gl.getAttribLocation(shader_program, "a_vertex_color"),
      vertex_barycentric: gl.getAttribLocation(shader_program, "a_barycentric"),
    },
    uniform_locations: {
      model_to_world: gl.getUniformLocation(shader_program, "u_model_to_world"),
      world_to_view: gl.getUniformLocation(shader_program, "u_world_to_view"),
      view_to_projection: gl.getUniformLocation(shader_program, "u_view_to_projection"),
    },
  };

  const mesh = create_mesh();

  const buffers = init_buffers(gl, mesh.vertices, mesh.colors, mesh.indices, mesh.barycentric);

  // TODO: Create state function. Make defaults
  const state = {
    frame_count: 0,
    // NOTE: editor mode.
    // - "pan": moving the model and scene around
    // - "select": selcting vertices to edit them
    mode: "pan",
    gl_info: {
      gl: gl,
      program_info: program_info,
      buffers: buffers,
    },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      rotate_left: false,
      rotate_right: false,
      move_left: false,
      move_up: false,
      move_right: false,
      move_down: false,
    },
    mouse: {
      pos: vec2.create(),
      old_pos: vec2.create(),
      pressed: false,
    },
    camera: {
      pos: vec3.fromValues(0.0, 0.0, -9.0),
      dir: vec3.fromValues(0.0, 0.0, -1.0),
      up:  vec3.fromValues(0.0, 1.0, 0.0),
      speed: 2.0,
    },
    mesh: mesh,
    selected_vertex_idx: 0,
  };

  // NOTE: Init the sidebar debug stats
  const mouse_pos_elem = document.getElementById("mouse-pos");
  mouse_pos_elem.innerText = vec2.str(state.mouse.pos);
  const mouse_pressed_elem = document.getElementById("mouse-pressed");
  mouse_pressed_elem.innerText = state.mouse.pressed;

  console.log("Starting render with state: %o", state);
  //console.dir(canvas);
  console.debug("canvas type: %s", typeof(canvas));
  console.debug("state.buffers.index is Float32Array?: %o", state.gl_info.buffers.index instanceof Float32Array);

  document.onkeydown = (event) => {
     //console.debug("key down: %s => %i", event.key, event.keyCode);
    switch (event.keyCode) {
      case 37: {
        state.keys.left = true;
        break;
      }
      case 38: {
        state.keys.up = true;
        break;
      }
      case 39: {
        state.keys.right = true;
        break;
      }
      case 40: {
        state.keys.down = true;
        break;
      }

      case 65: { // a
        state.keys.move_left = true;
        break;
      }
      case 68: { // d
        state.keys.move_right = true;
        break;
      }
      case 69: { // e
        state.keys.rotate_right = true;
        break;
      }
      case 81: { // q
        state.keys.rotate_left = true;
        break;
      }
      case 83: { // s
        state.keys.move_down = true;
        break;
      }
      case 87: { // w
        state.keys.move_up = true;
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
      case 38: {
        state.keys.up = false;
        break;
      }
      case 39: {
        state.keys.right = false;
        break;
      }
      case 40: {
        state.keys.down = false;
        break;
      }
      case 65: { // a
        state.keys.move_left = false;
        break;
      }
      case 68: { // d
        state.keys.move_right = false;
        break;
      }
      case 69: { // e
        state.keys.rotate_right = false;
        break;
      }
      case 81: { // q
        state.keys.rotate_left = false;
        break;
      }
      case 83: { // s
        state.keys.move_down = false;
        break;
      }
      case 87: { // w
        state.keys.move_up = false;
        break;
      }
    }
  };

  document.onwheel = (event) => {
    state.camera.pos[2] += event.deltaY < 0 ? 1.0 : -1.0;
  };

  canvas.onmousemove = (event) => {
    const new_pos = vec2.fromValues(event.offsetX, event.offsetY);
    state.mouse.pos = new_pos;

    mouse_pos_elem.innerText = vec2.str(new_pos);
  };

  canvas.onmousedown = (event) => {
    state.mouse.pressed = true;

    mouse_pressed_elem.innerText = true;
  };

  canvas.onmouseup = (event) => {
    state.mouse.pressed = false;

    mouse_pressed_elem.innerText = false;
  };

  requestAnimationFrame((t) => step(state, t));
}

main();

// vim: set ts=2 sw=2:
