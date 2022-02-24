class Shape {
  vertexArray;
  color;
  id;
  isSelected;

  constructor(vertexArray, color, id) {
    this.vertexArray = [...vertexArray];
    this.color = [...color];
    this.id = id;
    this.isSelected = false;
    console.log(this.id)
  }

  drawSelectPoints(gl, program) {
    if (this.isSelected) {
      let positionLoc = gl.getAttribLocation(program, "a_position");
      let colorLoc = gl.getUniformLocation(program, "u_color");

      let vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW );
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(colorLoc, [0, 0.5, 1, 1]);
      gl.drawArrays(gl.POINTS, 0, this.vertexArray.length / 2);
    }
  }

  getSelectedPoint(x, y) {
    let minDist = 9999999999;
    let minIdx = -1;
    for (let i = 0; i < this.vertexArray.length; i += 2) {
      let curDist = Math.sqrt((this.vertexArray[i]-x)**2 + (this.vertexArray[i+1]-y)**2)
      if (curDist < minDist) {
        minDist = curDist;
        minIdx = i
      }
    }
    
    return minDist <= 7 ? minIdx : -1;
  }

  setColor(color) {
    this.color = color
  }

  toggleSelect() {
    this.isSelected = !this.isSelected;
  }
}

class Line extends Shape {
  draw(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let colorLoc = gl.getUniformLocation(program, "u_color");

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW );
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(colorLoc, this.color);

    gl.drawArrays(gl.LINES, 0, this.vertexArray.length / 2);
  }

  drawID(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let idLoc = gl.getUniformLocation(program, "u_id");

    const u_id = [
      ((this.id >>  0) & 0xFF) / 0xFF,
      ((this.id >>  8) & 0xFF) / 0xFF,
      ((this.id >> 16) & 0xFF) / 0xFF,
      ((this.id >> 24) & 0xFF) / 0xFF,
    ];

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW );
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(idLoc, u_id);

    gl.drawArrays(gl.LINES, 0, this.vertexArray.length / 2);
  }

  movePoint(idx, x, y) {
    this.vertexArray[idx] = x;
    this.vertexArray[idx+1] = y;
  }
}

class Square extends Shape {
  draw(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let colorLoc = gl.getUniformLocation(program, "u_color");
    
    // let x1 = this.vertexArray[0];
    // let y1 = this.vertexArray[1];
    // let x2 = this.vertexArray[2];
    // let y2 = this.vertexArray[3];

    // let eu = ((x2-x1)**2 + (y2-y1)**2)**0.5
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(colorLoc, this.color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  drawID(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let idLoc = gl.getUniformLocation(program, "u_id");
    
    const u_id = [
      ((this.id >>  0) & 0xFF) / 0xFF,
      ((this.id >>  8) & 0xFF) / 0xFF,
      ((this.id >> 16) & 0xFF) / 0xFF,
      ((this.id >> 24) & 0xFF) / 0xFF,
    ];

    // let x1 = this.vertexArray[0];
    // let y1 = this.vertexArray[1];
    // let x2 = this.vertexArray[2];
    // let y2 = this.vertexArray[3];
    // console.log(x1,x2,y1,y2);

    // let eu = ((x2-x1)**2 + (y2-y1)**2)**0.5
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(idLoc, u_id);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }
}

class Rectangle extends Shape {
  draw(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let colorLoc = gl.getUniformLocation(program, "u_color");

    // let x1 = this.vertexArray[0];
    // let y1 = this.vertexArray[1];
    // let x2 = this.vertexArray[2];
    // let y2 = this.vertexArray[3];

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(colorLoc, this.color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  drawID(gl, program) {
    gl.useProgram(program);
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let idLoc = gl.getUniformLocation(program, "u_id");

    const u_id = [
      ((this.id >>  0) & 0xFF) / 0xFF,
      ((this.id >>  8) & 0xFF) / 0xFF,
      ((this.id >> 16) & 0xFF) / 0xFF,
      ((this.id >> 24) & 0xFF) / 0xFF,
    ];

    let x1 = this.vertexArray[0];
    let y1 = this.vertexArray[1];
    let x2 = this.vertexArray[2];
    let y2 = this.vertexArray[3];

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(idLoc, u_id);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }
}

class Polygon extends Shape {
  draw(gl, program) {
    gl.useProgram(program);
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let colorLoc = gl.getUniformLocation(program, "u_color");

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW );
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(colorLoc, this.color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertexArray.length / 2);
  }

  drawID(gl, program) {
    gl.useProgram(program);
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let idLoc = gl.getUniformLocation(program, "u_id");

    const u_id = [
      ((this.id >>  0) & 0xFF) / 0xFF,
      ((this.id >>  8) & 0xFF) / 0xFF,
      ((this.id >> 16) & 0xFF) / 0xFF,
      ((this.id >> 24) & 0xFF) / 0xFF,
    ];

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform4fv(idLoc, u_id);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertexArray.length / 2);
  }

  movePoint(idx, x, y) {
    this.vertexArray[idx] = x;
    this.vertexArray[idx+1] = y;
  }
}