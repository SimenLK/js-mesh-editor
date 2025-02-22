import { mat4, vec3 } from "gl-matrix";

function get_mesh_vertex(vertices, z, idx) {
  const result = vec3.fromValues(vertices[idx], vertices[idx + 1], z,);

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

export { create_mesh, get_mesh_vertex };
