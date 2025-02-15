import { mat4 } from "gl-matrix";

function set_pos_attribute(gl, program_info, buffers) {
  const num_components = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    program_info.attrib_locations.vertex_pos,
    num_components,
    type,
    normalize,
    stride,
    offset,
  );

  gl.enableVertexAttribArray(program_info.attrib_locations.vertex_pos);
}

function draw_scene(gl, program_info, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fov = (45 * Math.PI) / 180;
  const aspect_ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const z_near = 0.1;
  const z_far = 100.0;
  const projection_matrix = mat4.create();

  mat4.perspective(projection_matrix, fov, aspect_ratio, z_near, z_far);

  const model_view_matrix = mat4.create();

  mat4.translate(
    model_view_matrix,
    model_view_matrix,
    [-0.0, 0.0, -6.0],
  );

  set_pos_attribute(gl, program_info, buffers);

  gl.uniformMatrix4fv(
    program_info.uniform_locations.projection_matrix,
    false,
    projection_matrix,
  );

  gl.uniformMatrix4fv(
    program_info.uniform_locations.model_view_matrix,
    false,
    model_view_matrix,
  );

  {
    const offset = 0;
    const vertex_count = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertex_count);
  }
}

export { draw_scene };
