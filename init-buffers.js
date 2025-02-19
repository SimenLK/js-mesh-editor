function init_position_buffer(gl, vertices) {
  const pos_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  return pos_buffer;
}

function init_index_buffer(gl, indices) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return buffer;
}

function init_color_buffer(gl, colors) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return buffer;
}

function init_barycentric_buffer(gl, barycentric) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(barycentric), gl.STATIC_DRAW);

  return buffer;
}

function init_buffers(gl, vertices, colors, indices, barycentric) {
  const pos_buffer = init_position_buffer(gl, vertices);
  const index_buffer = init_index_buffer(gl, indices);
  const color_buffer = init_color_buffer(gl, colors);
  const barycentric_buffer = init_barycentric_buffer(gl, barycentric);

  return {
    position: pos_buffer,
    index: index_buffer,
    color: color_buffer,
    barycentric: barycentric_buffer,
  };
}

function upload_new_buffer_data(gl, buffer_index, data) {
  console.assert(data instanceof Float32Array);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer_index);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
}

function upload_buffer_segment(gl, buffer_index, index, data) {
  // TODO: Enforce the user providing the typed float array
  const float_array = new Float32Array(data)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer_index);
  gl.bufferSubData(gl.ARRAY_BUFFER, index * float_array.BYTES_PER_ELEMENT, float_array);
}

export { init_buffers, upload_new_buffer_data, upload_buffer_segment };
