function init_position_buffer(gl, vertices) {
  const pos_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return pos_buffer;
}

function init_color_buffer(gl, colors) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return buffer;
}

function init_buffers(gl, vertices, colors) {
  const pos_buffer = init_position_buffer(gl, vertices);
  const color_buffer = init_color_buffer(gl, colors);

  return {
    position: pos_buffer,
    color: color_buffer,
  };
}

export { init_buffers };
