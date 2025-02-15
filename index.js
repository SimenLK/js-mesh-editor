console.log("Hello from js");

const canvas = document.getElementById("mesh-editor");
console.log("We found the canvas: %o", canvas);

const ctx = canvas.getContext("2d");
ctx.fillStyle = "green";
ctx.fillRect(10, 10, 150, 100);
