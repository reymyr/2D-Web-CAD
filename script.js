let vertexArray = [];
let mousePos = []
let state = {
  currentShape: "Line",
  mode: "Selecting",
  shapes: [],
  color: [1.0, 0.0, 0.0, 1.0]
}

function main() {
  const canvas = document.getElementById("canvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  let gl = canvas.getContext("webgl");
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
 
  let program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  initEventListeners(gl, canvas);

  let positionLoc = gl.getAttribLocation(program, "a_position");
  let colorLoc = gl.getUniformLocation(program, "u_color");
  let resolutionLoc = gl.getUniformLocation(program, "u_resolution");
 
  gl.enableVertexAttribArray(positionLoc);

  function render() {
    // console.log(vertexArray);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform4fv(colorLoc, [0.0, 0.0, 0.0, 1.0]);
    gl.uniform2f(resolutionLoc, canvas.clientWidth, canvas.clientHeight);

    if (state.mode === "Drawing") {
      let vBuffer = gl.createBuffer();
      switch (state.currentShape) {
        case "Line":
          // console.log(vertexArray)
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertexArray, mousePos[0], mousePos[1]]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.LINES, 0, vertexArray.length / 2 + 1);
          break;
        case "Square":
          let x1 = vertexArray[0];
          let y1 = vertexArray[1];
          let x2 = mousePos[0];
          let y2 = mousePos[1];
          let eu = ((x2-x1)**2 + (y2-y1)**2)**0.5
          // console.log(eu)
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertexArray, x1, y1-eu,x1-eu, y1-eu,x1-eu, y1]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
          break;
        case "Rectangle":
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([...vertexArray, vertexArray[0], mousePos[1], mousePos[0], mousePos[1], mousePos[0], vertexArray[0]]),
            gl.STATIC_DRAW
          );
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(state.currentShape === "Rectangle" ? gl.TRIANGLE_FAN : gl.LINE_LOOP, 0, 4);
        case "Polygon":
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertexArray, mousePos[0], mousePos[1]]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.LINE_LOOP, 0, vertexArray.length / 2 + 1);
          break;
          
      }
    }

    state.shapes.forEach(shape => shape.draw(gl, program));
  
    requestAnimationFrame(render)
  }

  render();
}

function initShaders(gl, vertexShaderId, fragmentShaderId) {
  let vertexShader;
  let fragmentShader;

  let vertElem = document.getElementById(vertexShaderId);
  if (!vertElem) { 
    alert("Unable to load vertex shader " + vertexShaderId);
    return -1;
  }
  else {
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertElem.text);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert("Vertex shader failed to compile.");
      return -1;
    }
  }

  let fragElem = document.getElementById(fragmentShaderId);
  if (!fragElem) { 
    alert("Unable to load vertex shader " + fragmentShaderId);
    return -1;
  }
  else {
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragElem.text);
    gl.compileShader(fragmentShader);

    if ( !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      alert("Fragment shader failed to compile.");
      return -1;
    }
  }

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program );
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert( "Shader program failed to link." );
    return -1;
  }

  return program;
}

function initEventListeners(gl, canvas) {
  canvas.addEventListener("click", (e) => {
    handleClick(gl, e, canvas)
  });

  canvas.addEventListener("mousemove", (e) => {
    mousePos = getMousePosition(gl, e, canvas);
  });

  document.getElementsByName("shape").forEach((rad) => {
    rad.addEventListener("change", (e) => {
      state.currentShape = e.target.value;
      state.mode = "Selecting";
      vertexArray.length = 0;
    })
  });

  window.addEventListener("keydown", handleKey);
}

function getMousePosition(gl, e, canvas) {
  const rect = canvas.getBoundingClientRect()
  const position = [
    e.clientX - rect.left,
    gl.drawingBufferHeight - (e.clientY - rect.top)
  ]

  return position;
}

function handleKey(e) {
  if (e.code === "Space" && state.mode === "Drawing" && state.currentShape === "Polygon") {
   
    state.shapes.push(new Polygon(vertexArray, state.color))

    state.mode = "Selecting";
    vertexArray.length = 0;
  }
}

function handleClick(gl, e, canvas) {
  const position = getMousePosition(gl, e, canvas)
  // console.log(state.shapes);

  if (state.mode === "Selecting") {
    if (state.currentShape != "Select") {
      vertexArray.push(position[0]);
      vertexArray.push(position[1]);

      state.mode = "Drawing";
    } else {

    }
  } else if (state.mode === "Drawing") {
    switch (state.currentShape) {
      case "Line":
        vertexArray.push(position[0]);
        vertexArray.push(position[1]);

        state.shapes.push(new Line(vertexArray, state.color))
        state.mode = "Selecting";

        vertexArray.length = 0;
        break;
      case "Square":
        vertexArray.push(position[0]);
        vertexArray.push(position[1]);
        state.shapes.push(new Square(vertexArray, state.color))

        state.mode = "Selecting";

        vertexArray.length = 0;
        break;
      case "Rectangle":
        vertexArray.push(position[0]);
        vertexArray.push(position[1]);
        state.shapes.push(new Rectangle(vertexArray, state.color));

        state.mode = "Selecting";

        vertexArray.length = 0;
        break;
      case "Polygon":
        vertexArray.push(position[0]);
        vertexArray.push(position[1]);
        break;
    }
  }
}

main();