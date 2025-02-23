import { mat4, vec4, vec3, vec2 } from "gl-matrix";

import { init_buffers, upload_new_buffer_data, upload_buffer_segment } from "./init-buffers.js";
import { draw_scene } from "./draw-scene.js";
import { find_vertex_idx } from "./math.js";
import { create_mesh, get_mesh_vertex, get_mesh_vertex_v2, set_mesh_vertex } from "./mesh.js";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function vec_to_str(vector) {
  let result = [];

  vector.forEach((v, idx) =>
    result[idx] = v.toFixed(3)
  );

  return result;
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

function ui_draw_mesh_vertices(mesh) {
  const mesh_vertices_elem = document.getElementById("mesh-vertices");

  mesh_vertices_elem.replaceChildren();

  for (let i = 0; i < mesh.vertices.length; i += 2) {
    const vertex = get_mesh_vertex_v2(mesh, i);
    const x = vertex[0].toFixed(3);
    const y = vertex[1].toFixed(3);

    const new_elem = document.createElement("div");
    new_elem.classList.add("vertex-container");

    const vertex_code = document.createElement("code");
    vertex_code.innerText = `vertex[${i}]:`;
    vertex_code.classList.add("vertex-label");

    const vector_code_container = document.createElement("div");
    vector_code_container.classList.add("vertex-value");

    const vector_code_x = document.createElement("code");
    vector_code_x.innerText = `${x}`;
    vector_code_container.appendChild(vector_code_x);

    const vector_code_y = document.createElement("code");
    vector_code_y.innerText = `${y}`;
    vector_code_container.appendChild(vector_code_y);

    new_elem.appendChild(vertex_code);
    new_elem.appendChild(vector_code_container);

    mesh_vertices_elem.appendChild(new_elem);
  }
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

  switch (state.mode) {
    case "pan": {
      if (mouse.left_pressed) {
        if (state.fixed_direction) {
          let delta = vec2.create();
          delta = vec2.subtract(vec2.create(), mouse.pos, mouse.old_pos);
          // TODO: Optional sensitivity on the scale here?
          delta = vec2.scale(vec2.create(), delta, 0.02);

          // TODO: I don't know why I have to flip the y here
          const v3 = vec3.fromValues(delta[0], -delta[1], 0.0);
          camera.pos = vec3.add(vec3.create(), camera.pos, v3);
        } else {
          let delta = vec2.create();
          delta = vec2.subtract(vec2.create(), mouse.pos, mouse.old_pos);
          // TODO: Optional sensitivity on the scale here?
          delta = vec2.scale(vec2.create(), delta, 0.02);

          // TODO: I don't know why I have to flip the y here
          const v3 = vec3.fromValues(delta[0], -delta[1], 0.0);
          camera.dir = vec3.add(vec3.create(), camera.dir, v3);
        }
      }
      break;
    }

    case "select": {
      if (!state.selecting && mouse.left_pressed) {
        state.selecting = true;
        const new_idx = find_vertex_idx(state, mouse);

        if (new_idx !== null) {
          console.debug("New vertex is idx = %d", new_idx);
          state.selected_vertex_idx = new_idx;
        }
      } else if (!mouse.left_pressed) {
        state.selecting = false;
      }

      break;
    }

    default: {
      console.error("State in invalid mode: %s", state.mode);
    }
  }

  if (state.keys.move_left) {
    camera.pos[0] -= camera.speed * elapsed_s;
  }
  if (state.keys.move_forward) {
    camera.pos[2] += camera.speed * elapsed_s;
  }
  if (state.keys.move_right) {
    camera.pos[0] += camera.speed * elapsed_s;
  }
  if (state.keys.move_backward) {
    camera.pos[2] -= camera.speed * elapsed_s;
  }

  state.mouse.old_pos = state.mouse.pos;

  if (state.keys.rotate_left) {
    const to_rotate = model_rotate_speed * elapsed_s;
    mesh.model_to_world = mat4.rotateY(mat4.create(), mesh.model_to_world, to_rotate);
  }
  if (state.keys.rotate_right) {
    const to_rotate = model_rotate_speed * elapsed_s;
    mesh.model_to_world = mat4.rotateY(mat4.create(), mesh.model_to_world, -to_rotate);
  }

  let vertex_moved = false;
  let new_vertex_pos = get_mesh_vertex_v2(mesh, state.selected_vertex_idx);

  if (state.keys.left) {
    new_vertex_pos[0] -= 0.1;
    vertex_moved = true;
  }
  if (state.keys.right) {
    new_vertex_pos[0] += 0.1;
    vertex_moved = true;
  }
  if (state.keys.up) {
    new_vertex_pos[1] += 0.1;
    vertex_moved = true;
  }
  if (state.keys.down) {
    new_vertex_pos[1] -= 0.1;
    vertex_moved = true;
  }

  if (vertex_moved) {
    const gl_info = state.gl_info;
    const gl = gl_info.gl;

    set_mesh_vertex(mesh, state.selected_vertex_idx, new_vertex_pos);

    upload_buffer_segment(
      gl,
      gl_info.buffers.position,
      state.selected_vertex_idx,
      new_vertex_pos
    );

    ui_draw_mesh_vertices(mesh);
  }

  // console.debug("Render: timestamp: %i - %i = %i", timestamp, start_time, elapsed);
  draw_scene(state);

  // NOTE: Draw html ui
  const camera_pos_elem = document.getElementById("camera-pos");
  const text = vec_to_str(state.camera.pos);
  console.debug("pos is: %o", text);
  camera_pos_elem.innerText = text;
  const camera_dir_elem = document.getElementById("camera-dir");
  camera_dir_elem.innerText = vec3.str(state.camera.dir);

  const vertex_idx_elem = document.getElementById("vertex-idx");
  vertex_idx_elem.innerText = state.selected_vertex_idx;
  const mesh_pos_elem = document.getElementById("mesh-pos");
  const mesh_pos = mat4.getTranslation(vec3.create(), mesh.model_to_world);
  mesh_pos_elem.innerText = vec3.str(mesh_pos);

  state.frame_count += 1;

  requestAnimationFrame((t) => step(state, t));
}

function main() {
  const canvas = document.getElementById("mesh-editor");
  console.log("We found the canvas:");

  canvas.width = 1280;
  canvas.height = 720;

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
      fov: (60 * Math.PI) / 180,
      aspect_ratio: gl.canvas.clientWidth / gl.canvas.clientHeight,
      z_near: 0.1,
      z_far: 100.0,
    },
    fixed_direction: true,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      rotate_left: false,
      rotate_right: false,
      move_forward: false,
      move_backward: false,
      move_left: false,
      move_right: false,
      move_up: false,
      move_down: false,
    },
    mouse: {
      pos: vec2.create(),
      old_pos: vec2.create(),
      left_pressed: false,
      right_pressed: false,
    },
    view_to_projection: mat4.create(),
    world_to_view: mat4.create(),
    camera: {
      pos: vec3.fromValues( 0.0, 0.0, -6.0),
      dir: vec3.fromValues( 0.0, 0.0,  1.5),
      up:  vec3.fromValues( 0.0, 1.0,  0.0),
      speed: 2.0,
    },
    mesh: mesh,
    selected_vertex_idx: 0,
    selecting: false,
  };

  state.view_to_projection =
    mat4.perspective(
      mat4.create(),
      state.gl_info.fov,
      state.gl_info.aspect_ratio,
      state.gl_info.z_near,
      state.gl_info.z_far
    );

  const mode_form = document.getElementById("mode-form");
  mode_form.onchange = (event) => {
    console.debug("mode form change: %o", event);
    state.mode = event.target.value;
  };

  const mouse_pos_elem = document.getElementById("mouse-pos");
  mouse_pos_elem.innerText = vec2.str(state.mouse.pos);
  const mouse_pressed_elem = document.getElementById("mouse-pressed");
  mouse_pressed_elem.innerText = state.mouse.left_pressed;

  ui_draw_mesh_vertices(mesh);

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
        state.keys.move_backward = true;
        break;
      }
      case 87: { // w
        state.keys.move_forward = true;
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
        state.keys.move_backward = false;
        break;
      }
      case 87: { // w
        state.keys.move_forward = false;
        break;
      }
    }
  };

  document.onwheel = (event) => {
    console.debug("Mouse on wheel deltaY = %f", event.deltaY);
    state.camera.pos[2] += event.deltaY < 0 ? 1.0 : -1.0;
  };

  canvas.onmousemove = (event) => {
    const new_pos = vec2.fromValues(event.offsetX, event.offsetY);
    state.mouse.pos = new_pos;

    mouse_pos_elem.innerText = vec2.str(new_pos);
  };

  canvas.onmousedown = (event) => {
    state.mouse.left_pressed = true;

    mouse_pressed_elem.innerText = true;
  };

  canvas.onmouseup = (event) => {
    state.mouse.left_pressed = false;

    mouse_pressed_elem.innerText = false;
  };

  requestAnimationFrame((t) => step(state, t));
}

main();

// vim: set ts=2 sw=2:
