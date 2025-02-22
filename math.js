import { mat4, vec4, vec3 } from "gl-matrix";

import { get_mesh_vertex } from "./mesh.js";

function find_ray_plane_time(camera_pos, mesh_pos, plane_normal, ray_dot_norm) {
  let result = 0.0;

  const plane_normal_dot_plane_point = vec3.dot(plane_normal, mesh_pos);
  const plane_normal_dot_camera = vec3.dot(plane_normal, camera_pos);
  const plane_camera_dist = vec3.dist(vec3.create(), camera_pos, mesh_pos);

  result = ((plane_normal_dot_plane_point - plane_normal_dot_camera) / ray_dot_norm);

  return result;
}

function ray_cast(origin, dir, time) {
  let result = vec3.create();

  vec3.add(result, origin, vec3.scale(vec3.create(), dir, time));

  return result;
}

function find_mouse_ray(state, mouse_pos) {
  let result = vec3.create();

  const gl = state.gl_info.gl;

  // NOTE: normalized device coordinates
  const x = (2.0 * mouse_pos[0]) / gl.drawingBufferWidth - 1.0;
  const y = 1.0 - (2.0 * mouse_pos[1]) / gl.drawingBufferHeight;
  const ray_nds = vec3.fromValues(x, y, 1);

  // console.debug("mouse normalized device coord to world: %s", vec3.str(ray_nds));
  const ray_clip = vec4.fromValues(ray_nds[0], ray_nds[1], -1, 1);

  const inverted_view_to_projection = mat4.invert(mat4.create(), state.view_to_projection);
  let ray_eye = vec4.transformMat4(vec4.create(), ray_clip, inverted_view_to_projection);
  ray_eye = vec4.fromValues(ray_eye[0], ray_eye[1], -1, 0);

  const inverse_view = mat4.invert(mat4.create(), state.world_to_view)

  const ray_world_4 = vec4.transformMat4(vec4.create(), ray_eye, inverse_view);
  const ray_world = vec3.fromValues(ray_world_4[0], ray_world_4[1], ray_world_4[2]);

  result = vec3.normalize(vec3.create(), ray_world)

  return result;
}

function find_plane_normal(q, r, s) {
  let result = vec3.create();

  const qr = vec3.sub(vec3.create(), q, r);
  const qs = vec3.sub(vec3.create(), q, s);

  result = vec3.cross(vec3.create(), qr, qs);

  return result;
}

function find_vertex_idx(state, mouse, epsilon = 1.0) {
  let result = null;

  const mesh = state.mesh;

  const ray_world_norm = find_mouse_ray(state, mouse.pos);

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
    const t = find_ray_plane_time(camera_pos, mesh_pos, plane_normal, ray_dot_norm);

    if (t < 0) {
      console.error("You're behind the plane dumbo! t = %f", t);
    } else {
      const ray_at_t = ray_cast(camera_pos, ray_world_norm, t);

      console.debug(
        "Ray(%f) = %s",
        t,
        vec3.str(ray_at_t),
      );

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

        if (distance < epsilon) {
          console.debug("New vertex is idx = %d", idx);
          result = idx;
        }
      }
    }
  }

  return result;
}

export { find_vertex_idx };
