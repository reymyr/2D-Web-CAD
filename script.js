let vertexArray = [];
let mousePos = [];
let nextId = 1;
let state = {
  currentShape: "Line",
  mode: "Selecting",
  shapes: [],
  color: [0.0, 0.0, 0.0, 1.0],
  hoverId: 0,
  selectedId: 0,
  selectedShape: null,
  pointToMove: -1,
  isMoving: false,
}

function main() {
  const canvas = document.getElementById("canvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  let gl = canvas.getContext("webgl");
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
 
  let program = initShaders(gl, "vertex-shader", "fragment-shader");
  let selectProgram = initShaders(gl, "pick-vertex-shader", "pick-fragment-shader");
  gl.useProgram(program);

  initEventListeners(gl, canvas);

  let positionLoc = gl.getAttribLocation(program, "a_position");
  let colorLoc = gl.getUniformLocation(program, "u_color");
  let resolutionLoc = gl.getUniformLocation(program, "u_resolution");
  let resolutionSelectLoc = gl.getUniformLocation(selectProgram, "u_resolution");
 
  gl.enableVertexAttribArray(positionLoc);

  // Create a texture to render to
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // create a depth renderbuffer
  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  
  function setFramebufferAttachmentSizes(width, height) {
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border,
                  format, type, data);
  
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  }
  
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
  
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  function render() {
    gl.useProgram(selectProgram);

    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    gl.enable(gl.DEPTH_TEST);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform2f(resolutionSelectLoc, canvas.clientWidth, canvas.clientHeight);
    state.shapes.forEach(shape => shape.drawID(gl, selectProgram));

    const data = new Uint8Array(4);
    gl.readPixels(
        mousePos[0],        
        mousePos[1],        
        1,                 
        1,                 
        gl.RGBA,           
        gl.UNSIGNED_BYTE,  
        data);             

    state.hoverId = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.uniform4fv(colorLoc, state.color);
    gl.uniform2f(resolutionLoc, canvas.clientWidth, canvas.clientHeight);

    if (state.mode === "Drawing") {
      let vBuffer = gl.createBuffer();
      switch (state.currentShape) {
        case "Line":
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertexArray, mousePos[0], mousePos[1]]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.LINES, 0, vertexArray.length / 2 + 1);
          break;
        case "Square":
          let dx = mousePos[0] - vertexArray[0];
          let sign = Math.sign(mousePos[1] - vertexArray[1]) * Math.sign(dx);

          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([...vertexArray, mousePos[0], vertexArray[1], mousePos[0], vertexArray[1]+sign*dx, vertexArray[0], vertexArray[1]+sign*dx]),
            gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
          break;
        case "Rectangle":
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([...vertexArray, vertexArray[0], mousePos[1], mousePos[0], mousePos[1], mousePos[0], vertexArray[1]]),
            gl.STATIC_DRAW
          );
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
          break;
        case "Polygon":
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertexArray, mousePos[0], mousePos[1]]), gl.STATIC_DRAW);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.LINE_LOOP, 0, vertexArray.length / 2 + 1);
          break;
          
      }
    }

    if (state.selectedShape) {
      state.selectedShape.drawSelectPoints(gl, program);
    }

    state.shapes.forEach(shape => shape.draw(gl, program));
  
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render);
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
  document.getElementById("color-picker").addEventListener("input", (e) => {
    let rgb = hexToRgb(e.target.value);
    state.color = [...rgb, 1.0];
    if (state.selectedShape) {
      state.selectedShape.setColor(state.color);
    }
  });

  canvas.addEventListener("click", (e) => {
    handleClick(gl, e, canvas)
  });

  canvas.addEventListener("mousemove", (e) => {
    mousePos = getMousePosition(gl, e, canvas);
    if (state.currentShape === "Select") {
      if (state.selectedShape && state.isMoving) {
        state.selectedShape.movePoint(state.pointToMove, mousePos[0], mousePos[1]);
      }
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    if (state.currentShape === "Select") {
      if (state.selectedShape) {
        state.pointToMove = state.selectedShape.getSelectedPoint(mousePos[0], mousePos[1])
        if (state.pointToMove > -1) {
          state.isMoving = true;
        }
      }
    }
  })

  canvas.addEventListener("mouseup", (e) => {
    state.isMoving = false;
  })

  document.getElementsByName("shape").forEach((rad) => {
    rad.addEventListener("change", (e) => {
      state.currentShape = e.target.value;
      state.mode = "Selecting";
      vertexArray.length = 0;
    })
  });

  window.addEventListener("keydown", handleKey);

  document.getElementById("save-button").addEventListener("click", () => {
    download(state.shapes, "web-cad-canvas.json");
  })

  document.getElementById("load-button").addEventListener("click", () => {
    const loadFile = (e) => {
      const file = e.srcElement.files[0];
      if (!file) {
        return false;
      }
      state.shapes = [];
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const jsonString = e.target.result;
        const parsedJson  = JSON.parse(jsonString);
        parsedJson.shapes.forEach((shape) => {
          let newShape = null;
          switch (shape.type) {
            case "line":
              newShape = new Line(shape.vertexArray, shape.color, shape.id);
              break;
            case "square":
              newShape = new Square(shape.vertexArray, shape.color, shape.id);
              break;
            case "rectangle":
              newShape = new Rectangle(shape.vertexArray, shape.color, shape.id);
              break;
            case "polygon":
              newShape = new Polygon(shape.vertexArray, shape.color, shape.id);
              break;
            default:
              return;
          }
          state.shapes.push(newShape);
        })
      };
      fileReader.readAsText(file);
    }

    const inputFile = document.getElementById("file-input");
    inputFile.onchange = loadFile;
    inputFile.click();

  });
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : null;
}

function rgbToHex(r, g, b) {
  r *= 255;
  g *= 255;
  b *= 255;
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getMousePosition(gl, e, canvas) {
  const rect = canvas.getBoundingClientRect()
  const position = [
    e.clientX - rect.left,
    (e.clientY - rect.top)
  ]

  return position;
}

function handleKey(e) {
  if (e.code === "Space" && state.mode === "Drawing" && state.currentShape === "Polygon") {
    if (vertexArray.length > 4) {
      state.shapes = [new Polygon(vertexArray, state.color, nextId), ...state.shapes];
      nextId++;
    }
    state.mode = "Selecting";
    vertexArray.length = 0;
  }
}

function handleClick(gl, e, canvas) {
  const position = getMousePosition(gl, e, canvas);

  if (state.mode === "Selecting") {
    if (state.currentShape != "Select") {
  
      vertexArray.push(position[0]);
      vertexArray.push(position[1]);

      state.mode = "Drawing";
    } else {

      if (state.selectedShape) {
        state.selectedShape.toggleSelect();
      }

      state.selectedId = state.hoverId;

      state.selectedShape = state.shapes.find(s => s.id == state.selectedId);
      
      if (state.selectedShape) {
        state.selectedShape.toggleSelect();
        document.getElementById("color-picker").value = rgbToHex(state.color[0], state.color[1], state.color[2]);
      }
    }
  } else if (state.mode === "Drawing") {
    switch (state.currentShape) {
      case "Line":
        vertexArray.push(position[0]);
        vertexArray.push(position[1]);

        state.shapes = [new Line(vertexArray, state.color, nextId), ...state.shapes];
        nextId++;
        state.mode = "Selecting";

        vertexArray.length = 0;
        break;
      case "Square":
        let dx = mousePos[0] - vertexArray[0];
        let sign = Math.sign(mousePos[1] - vertexArray[1]) * Math.sign(dx);

        vertexArray = [...vertexArray, mousePos[0], vertexArray[1], mousePos[0], vertexArray[1]+sign*dx, vertexArray[0], vertexArray[1]+sign*dx];
        state.shapes = [new Square(vertexArray, state.color, nextId), ...state.shapes];
        nextId++;
        state.mode = "Selecting";

        vertexArray.length = 0;
        break;
      case "Rectangle":
        let minX = Math.min(vertexArray[0], position[0]);
        let minY = Math.min(vertexArray[1], position[1]);
        let maxX = Math.max(vertexArray[0], position[0]);
        let maxY = Math.max(vertexArray[1], position[1]);

        vertexArray = [minX, minY, minX, maxY, maxX, maxY, maxX, minY]

        state.shapes = [new Rectangle(vertexArray, state.color, nextId), ...state.shapes];
        nextId++;
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

function download(arrayData, filename) {
  let dataObj = {
    shapes: arrayData,
  };
  let jsonObj = JSON.stringify(dataObj, '', 2);
  let file = new Blob([jsonObj], { type: "application/json" });
  let a = document.createElement("a"),
    url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

main();