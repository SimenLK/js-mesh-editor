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
  const {
    gl_info,
    camera,
    mesh
  } = state;

  const { gl, program_info, buffers } = gl_info;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fov = (45 * Math.PI) / 180;
  const aspect_ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const z_near = 0.1;
  const z_far = 100.0;
  const view_to_projection = mat4.create();

  mat4.perspective(view_to_projection, fov, aspect_ratio, z_near, z_far);

  // NOTE: This is not uplading the buffer, only activating it for this frame.
  set_pos_attribute(gl, program_info, buffers);
  // set_color_attribute(gl, program_info, buffers);
  set_barycentric_attribute(gl, program_info, buffers);

  const model_to_world = mat4.create();
  const world_to_view = mat4.create();

  mat4.rotateZ(
    model_to_world,
    model_to_world,
    mesh.angle,
  );

  // Translate the model
  mat4.translate(
    model_to_world,
    model_to_world,
    [mesh.pos.x, 0.0, 0.0],
  );

  const fixed_direction = true;
  if (fixed_direction) {
    // Move the camera?
    mat4.translate(
      world_to_view,
      world_to_view,
      camera.pos,
    );
  } else {
    mat4.lookAt(
      world_to_view,
      camera.pos,
      camera.dir,
      camera.up,
    );
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

  gl.useProgram(program_info.program);

  gl.uniformMatrix4fv(
    program_info.uniform_locations.model_to_world,
    false,
    model_to_world,
  );

  gl.uniformMatrix4fv(
    program_info.uniform_locations.world_to_view,
    false,
    world_to_view,
  );

  gl.uniformMatrix4fv(
    program_info.uniform_locations.view_to_projection,
    false,
    view_to_projection,
  );

  {
    const vertex_count = mesh.indices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertex_count, type, offset);
  }
}

export { draw_scene };
