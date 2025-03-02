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
      0.0,
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

function parse_mesh_file(text) {
  let mesh = null;
  let valid_mesh = false;

  // console.debug("[Mesh] Got file to parse:\n%s", text);
  const lines = text.split('\n');
  console.debug("[Mesh] lines:\n%o", lines);

  const num_vertices = Number.parseInt(lines[0]);
  valid_mesh = !isNaN(num_vertices);

  if (valid_mesh) {
    const vertex_strs = lines.slice(1, num_vertices + 1);

    const vertices = vertex_strs.flatMap((str) => {
      const numbers = str.split(' ');
      return numbers.map((num_str) => {
        return Number.parseFloat(num_str);
      });
    });

    console.assert(num_vertices * 2 === vertices.length, "num_vertices * 2 !== vertices.length");

    console.debug("[Mesh] Number of vertices: %i * 2 = %i", num_vertices, num_vertices * 2);
    console.debug("[Mesh] Vertex string pairs: %o", vertex_strs);
    console.debug("[Mesh] Vertices: %o", vertices);
    console.debug(
      "[Mesh] Vertices[%i..%i]: %o",
      num_vertices - 4,
      num_vertices,
      vertices.slice(num_vertices - 4, num_vertices)
    );
    console.debug("[Mesh] Vertices[last + 1]: %o", lines[num_vertices + 1]);

    const indices_start = num_vertices + 1;
    const num_indices = Number.parseInt(lines[indices_start]);
    valid_mesh = !isNaN(num_indices);
    if (valid_mesh) {
      const elements_start = indices_start + 1;
      console.debug("[Mesh] Number of indices: %i * 3 = %i", num_indices, num_indices * 3);
      const elem_strs = lines.slice(elements_start, elements_start + num_indices);

      console.assert(num_indices === elem_strs.length);
      console.debug("[Mesh] Element index strings: %o", elem_strs);

      const indices = elem_strs.flatMap((str) => {
        const numbers = str.split(' ');
        const elem_indices = numbers.map((num_str) => {
          return Number.parseInt(num_str);
        });

        return elem_indices;
      });

      console.debug("[Mesh] Indices: %o", indices);

      const pos = vec3.fromValues(0.0,  0.0, -5.0);

      mesh = {
        model_to_world: mat4.fromTranslation(mat4.create(), pos),
        // NOTE: y axis rotation in radians
        angle: 0.0,
        vertices: new Float32Array(vertices),
        barycentric: [],
        indices: new Uint16Array(indices),
      };
    }
  }

  return mesh;
}

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
  const pos = vec3.fromValues(0.0,  0.0, -5.0);
  const model_to_world = mat4.fromTranslation(mat4.create(), pos);
  const num_barycentric = (0.5 * vertices.length) * 3;
  const mesh = {
    model_to_world: model_to_world,
    // y axis rotation in radians?
    angle: 0.0,
    // A triangle
    vertices: vertices,
    barycentric: Array(num_barycentric).fill(0, 0, num_barycentric), // barycentric,
    indices: indices,
    colors: [
      1.0, 0.0, 0.0, 1.0, // red
      0.0, 1.0, 0.0, 1.0, // green
      0.0, 0.0, 1.0, 1.0, // blue
      1.0, 0.0, 1.0, 1.0, // idk
    ],
  };

  mat4.rotateY(mesh.model_to_world, mesh.model_to_world, mesh.angle);

  console.debug("[Mesh] Created mesh: %o", mesh);

  return mesh;
}

export {
  create_mesh,
  find_mesh_plane_normal,
  get_mesh_vertex,
  get_mesh_vertex_v2,
  parse_mesh_file,
  set_mesh_vertex,
};
