import { mat4, vec4, vec3, vec2 } from "gl-matrix";

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
     0.0,  0.0,
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
    model_to_world: mat4.fromTranslation(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0)),
    // y axis rotation in radians?
    angle: Math.PI,
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

  mat4.rotateY(mesh.model_to_world, mesh.model_to_world, mesh.angle);

  return mesh;
}

function get_mesh_vertex(vertices, z, idx) {
  const result = vec3.fromValues(vertices[idx], vertices[idx + 1], z,);

  return result;
}

function ray_cast(origin, dir, time) {
  let result = vec3.create();

  vec3.add(result, origin, vec3.scale(vec3.create(), dir, time));

  return result;
}

function find_plane_normal(q, r, s) {
  let result = vec3.create();

  const qr = vec3.sub(vec3.create(), q, r);
  const qs = vec3.sub(vec3.create(), q, s);

  result = vec3.cross(vec3.create(), qr, qs);

  return result;
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

  if (mouse.left_pressed) {
    switch (state.mode) {
      case "pan": {
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
        break;
      }

      case "select": {
        const gl_info = state.gl_info;
        const gl = gl_info.gl;
        const x = (2.0 * mouse.pos[0]) / gl.drawingBufferWidth - 1.0;
        const y = 1.0 - (2.0 * mouse.pos[1]) / gl.drawingBufferHeight;
        // NOTE: normalized device coordinates
        const ray_nds = vec3.fromValues(x, y, 1);
        // console.debug("mouse normalized device coord to world: %s", vec3.str(ray_nds));
        const ray_clip = vec4.fromValues(ray_nds[0], ray_nds[1], -1, 1);

        const inverted_view_to_projection = mat4.invert(mat4.create(), state.view_to_projection);
        let ray_eye = vec4.transformMat4(vec4.create(), ray_clip, inverted_view_to_projection);
        ray_eye = vec4.fromValues(ray_eye[0], ray_eye[1], -1, 0);

        const inverse_view = mat4.invert(mat4.create(), state.world_to_view)

        const ray_world_4 = vec4.transformMat4(vec4.create(), ray_eye, inverse_view);
        const ray_world = vec3.fromValues(ray_world_4[0], ray_world_4[1], ray_world_4[2]);
        const ray_world_norm = vec3.normalize(vec3.create(), ray_world);

        // NOTE: World coorinates from here!
        const camera_pos = mat4.getTranslation(vec3.create(), state.world_to_view);
        const mesh_pos = mat4.getTranslation(vec3.create(), mesh.model_to_world);

        console.debug("Origin %s with ray: %s", vec3.str(camera_pos), vec3.str(ray_world_norm));

        // NOTE: Create a plane from our mesh. The first three points
        const q = get_mesh_vertex(mesh.vertices, mesh_pos[2], 0);
        const r = get_mesh_vertex(mesh.vertices, mesh_pos[2], 2);
        const s = get_mesh_vertex(mesh.vertices, mesh_pos[2], 4);
        const plane_normal = find_plane_normal(q, r, s);

        const ray_dot_norm = vec3.dot(ray_world_norm, plane_normal);

        if (ray_dot_norm === 0) {
        } else {
          const plane_normal_dot_plane_point = vec3.dot(plane_normal, mesh_pos);
          const plane_normal_dot_camera = vec3.dot(plane_normal, camera_pos);
          const plane_camera_dist = vec3.dist(vec3.create(), camera_pos, mesh_pos);
          const t = ((plane_normal_dot_plane_point - plane_normal_dot_camera) / ray_dot_norm);

          if (t < 0) {
            console.error("You're behind the plane dumbo! t = %f", t);
          } else {
            const ray_at_t = ray_cast(camera_pos, ray_world_norm, t);

            console.debug(
              "Ray(%f) = %s",
              t,
              vec3.str(ray_at_t),
            );

            let smallest_distance = Number.MAX_VALUE;

            // TODO: Walk the ray along its vector to see if we hit a vertex
            for (let idx = 0; idx < mesh.vertices.length; idx += 2) {
              const vertex =
                vec3.fromValues(
                  mesh.vertices[idx],
                  mesh.vertices[idx + 1],
                  0.0,
                );
              // Move the vertex into its position in the world
              const in_world = vec3.transformMat4(vec3.create(), vertex, mesh.model_to_world);
              // Move vertex in the world infront of the camera
              const in_view = vec3.transformMat4(vec3.create(), vertex, state.world_to_view);
              // Find the distance to the vertex in the mesh, and the vertex
              // where our mouse ray hit the mesh plane
              const distance = vec3.dist(in_world, ray_at_t);

              console.debug(
                "Vertex %s vs ray at t %s = %f",
                vec3.str(in_world),
                vec3.str(ray_at_t),
                distance
              );

              if (distance < smallest_distance) {
                console.debug("New vertex is idx = %d", idx);
                smallest_distance = distance;
                state.selected_vertex_idx = idx;
              }
            }
          }
        }

        break;
      }

      default: {
        console.error("State in invalid mode: %s", state.mode);
      }
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

  let new_pos = mesh.world_pos;

  if (state.keys.rotate_left) {
    const to_rotate = model_rotate_speed * elapsed_s;
    state.model_to_world = mat4.rotateZ(mat4.create(), state.model_to_world, to_rotate);
  }
  if (state.keys.rotate_right) {
    const to_rotate = model_rotate_speed * elapsed_s;
    state.model_to_world = mat4.rotateZ(mat4.create(), state.model_to_world, -to_rotate);
  }

  state.mesh.world_pos = new_pos;

  let vertex_moved = false;
  let new_vertex_pos =
    vec2.fromValues(
      mesh.vertices[state.selected_vertex_idx],
      mesh.vertices[state.selected_vertex_idx + 1],
    );

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

  mesh.vertices[state.selected_vertex_idx] = new_vertex_pos[0];
  mesh.vertices[state.selected_vertex_idx + 1] = new_vertex_pos[1];

  if (vertex_moved) {
    // TODO: Try not updating the buffer
    const gl_info = state.gl_info;
    const gl = gl_info.gl;
    upload_buffer_segment(gl, gl_info.buffers.position, state.selected_vertex_idx, new_vertex_pos);
  }

  // console.debug("Render: timestamp: %i - %i = %i", timestamp, start_time, elapsed);
  draw_scene(state);

  // NOTE: Init the sidebar debug stats
  const camera_pos_elem = document.getElementById("camera-pos");
  camera_pos_elem.innerText = vec3.str(state.camera.pos);
  const camera_dir_elem = document.getElementById("camera-dir");
  camera_dir_elem.innerText = vec3.str(state.camera.dir);

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
