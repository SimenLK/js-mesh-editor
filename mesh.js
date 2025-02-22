import { mat4, vec3, vec2 } from "gl-matrix";

import { find_plane_normal } from "./math.js";

function get_mesh_vertex(mesh, idx) {
  console.assert(idx < mesh.vertices.length);
  console.assert(idx + 1 <= mesh.vertices.length);

  const mesh_pos = mat4.getTranslation(vec3.create(), mesh.model_to_world);

  const result =
    vec3.fromValues(
      mesh.vertices[idx],
      mesh.vertices[idx + 1],
      mesh_pos[2]
    );

  return result;
}

function get_mesh_vertex_v2(mesh, idx) {
  let result = vec2.create();

  console.assert(idx < mesh.vertices.length);
  console.assert(idx + 1 <= mesh.vertices.length);

  result =
    vec2.set(
      vec2.create(),
      mesh.vertices[idx],
      mesh.vertices[idx + 1],
    );

  return result;
}

function set_mesh_vertex(mesh, idx, vertex) {
  console.assert(idx < mesh.vertices.length);
  console.assert(idx + 1 <= mesh.vertices.length);
  console.assert(vertex instanceof Float32Array);
  console.assert(vertex.length === 2);

  mesh.vertices[idx] = vertex[0];
  mesh.vertices[idx + 1] = vertex[1];
}

function find_mesh_plane_normal(mesh) {
  let result = vec3.create();

  // NOTE: Create a plane from our mesh. The first three points
  const q = vec3.transformMat4(vec3.create(), get_mesh_vertex(mesh, 0), mesh.model_to_world);
  const r = vec3.transformMat4(vec3.create(), get_mesh_vertex(mesh, 2), mesh.model_to_world);
  const s = vec3.transformMat4(vec3.create(), get_mesh_vertex(mesh, 4), mesh.model_to_world);
  result = find_plane_normal(q, r, s);

  return result;
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

export { create_mesh, get_mesh_vertex, get_mesh_vertex_v2, set_mesh_vertex, find_mesh_plane_normal };
