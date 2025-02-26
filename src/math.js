import { mat4, vec4, vec3 } from "gl-matrix";

import { get_mesh_vertex, find_mesh_plane_normal } from "./mesh.js";

function to_radian(x) {
  return x * (Math.PI / 180);
}

function find_ray_plane_time(camera_pos, mesh_pos, plane_normal, ray_dot_norm) {
  let result = 0.0;

  const d = vec3.sub(vec3.create(), mesh_pos, camera_pos);

  result = vec3.dot(d, plane_normal) / ray_dot_norm;

  return result;
}

function ray_cast(origin, dir, time) {
  let result = vec3.create();

  result = vec3.add(vec3.create(), origin, vec3.scale(vec3.create(), dir, time));

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

  // Transform to camera space from projected space
  const inverted_view_to_projection = mat4.invert(mat4.create(), state.view_to_projection);
  let ray_eye = vec4.transformMat4(vec4.create(), ray_clip, inverted_view_to_projection);
  ray_eye = vec4.fromValues(ray_eye[0], ray_eye[1], -1, 0);
  console.debug(
    "Ray in camera space: (%f, %f, %f)",
    ray_eye[0].toFixed(3),
    ray_eye[1].toFixed(3),
    ray_eye[2].toFixed(3),
  );

  // Transform to world space from camera space
  const inverse_view = mat4.invert(mat4.create(), state.world_to_view)
  const ray_world_4 = vec4.transformMat4(vec4.create(), ray_eye, inverse_view);
  const ray_world = vec3.fromValues(ray_world_4[0], ray_world_4[1], ray_world_4[2]);

  result = vec3.normalize(vec3.create(), ray_world)

  return result;
}

function find_plane_normal(q, r, s) {
  let result = vec3.create();

  const qr = vec3.sub(vec3.create(), r, q);
  const qs = vec3.sub(vec3.create(), s, q);

  result = vec3.cross(vec3.create(), qr, qs);

  return result;
}

function find_vertex_idx(state, mouse, epsilon = 0.3) {
  let result = null;

  const mesh = state.mesh;

  const ray_world_norm = find_mouse_ray(state, mouse.pos);

  // NOTE: World coorinates from here!
  const camera_pos = state.camera.pos;
  const mesh_pos = mat4.getTranslation(vec3.create(), mesh.model_to_world);
  const mesh_plane_normal = find_mesh_plane_normal(mesh);

  console.debug("mesh normal: %s", vec3.str(mesh_plane_normal));
  console.debug(
    "Origin (%f, %f, %f) with ray: (%f, %f, %f)",
    camera_pos[0].toFixed(3),
    camera_pos[1].toFixed(3),
    camera_pos[2].toFixed(3),
    ray_world_norm[0].toFixed(3),
    ray_world_norm[1].toFixed(3),
    ray_world_norm[2].toFixed(3),
  );

  const ray_dot_norm = vec3.dot(ray_world_norm, mesh_plane_normal);
  if (Math.abs(ray_dot_norm) > 0.0001) {
    const t = find_ray_plane_time(camera_pos, mesh_pos, mesh_plane_normal, ray_dot_norm);

    if (t < 0) {
      console.error("You're behind the plane dumbo! t = %f", t);
    } else {
      const ray_at_t = ray_cast(camera_pos, ray_world_norm, t);

      console.debug(
        "Ray(%f) = %f, %f, %f",
        t.toFixed(3),
        ray_at_t[0].toFixed(3),
        ray_at_t[1].toFixed(3),
        ray_at_t[2].toFixed(3),
      );

      for (let idx = 0; idx < mesh.vertices.length; idx += 2) {
        const vertex = get_mesh_vertex(mesh, idx);

        // Move the vertex into its position in the world
        const in_world = vec3.transformMat4(vec3.create(), vertex, mesh.model_to_world);
        // Find the distance to the vertex in the mesh, and the vertex
        // where our mouse ray hit the mesh plane
        const distance = vec3.dist(ray_at_t, in_world);

        console.debug(
          "Vertex[%i] = (%f, %f, %f) vs ray at t = %f < %f",
          idx,
          in_world[0].toFixed(3),
          in_world[1].toFixed(3),
          in_world[2].toFixed(3),
          distance,
          epsilon,
        );

        if (distance < epsilon) {
          result = idx;
        }
      }
    }
  }

  return result;
}

export { to_radian, find_vertex_idx, find_plane_normal };
