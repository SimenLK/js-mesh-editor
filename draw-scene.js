import { mat4, vec3 } from "gl-matrix";

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

function set_color_attribute(gl, program_info, buffers) {
  const num_components = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    program_info.attrib_locations.vertex_color,
    num_components,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(program_info.attrib_locations.vertex_color);
}

function set_barycentric_attribute(gl, program_info, buffers) {
  const num_components = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.barycentric);
  gl.vertexAttribPointer(
    program_info.attrib_locations.vertex_barycentric,
    num_components,
    type,
    normalize,
    stride,
    offset,
  );

  gl.enableVertexAttribArray(program_info.attrib_locations.vertex_barycentric);
}

function draw_scene(state) {
  const { gl_info, camera, mesh, } = state;
  const { gl, program_info, buffers, } = gl_info;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // NOTE: This is not uplading the buffer, only activating it for this frame.
  set_pos_attribute(gl, program_info, buffers);
  // set_color_attribute(gl, program_info, buffers);
  set_barycentric_attribute(gl, program_info, buffers);

  // if (state.fixed_direction) {
  //   // Move the camera?
  //   state.world_to_view = mat4.fromTranslation(mat4.create(), camera.pos,);
  // } else {
  //   state.world_to_view = mat4.lookAt( mat4.create(), camera.pos, camera.dir, camera.up,);
  // }
  state.world_to_view =
    mat4.lookAt(
      mat4.create(),
      camera.pos,
      vec3.add(vec3.create(), camera.pos, camera.dir),
      camera.up
    );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

  gl.useProgram(program_info.program);

  gl.uniformMatrix4fv(
    program_info.uniform_locations.model_to_world,
    false,
    mesh.model_to_world,
  );

  gl.uniformMatrix4fv(
    program_info.uniform_locations.world_to_view,
    false,
    state.world_to_view,
  );

  gl.uniformMatrix4fv(
    program_info.uniform_locations.view_to_projection,
    false,
    state.view_to_projection,
  );

  {
    const vertex_count = mesh.indices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertex_count, type, offset);
  }
}

export { draw_scene };
