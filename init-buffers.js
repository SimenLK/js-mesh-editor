function init_position_buffer(gl) {
  const pos_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);

  // Three points in a triangle I guess
  const positions = [
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return pos_buffer;
}

function init_buffers(gl) {
  const pos_buffer = init_position_buffer(gl);

  return {
    position: pos_buffer,
  };
}

export { init_buffers };
