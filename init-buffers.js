function init_position_buffer(gl, vertices) {
  const pos_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return pos_buffer;
}

function init_buffers(gl) {
  const pos_buffer = init_position_buffer(gl);
function init_buffers(gl, vertices, colors) {
  const pos_buffer = init_position_buffer(gl, vertices);

  return {
    position: pos_buffer,
  };
}

export { init_buffers };
