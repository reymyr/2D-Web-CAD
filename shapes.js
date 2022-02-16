class Shape {
  vertexArray;
  color;

  constructor(vertexArray, color) {
    this.vertexArray = [...vertexArray];
    this.color = [...color];
  }

  setColor(color) {
    this.color = color
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
}

class Square extends Shape {

}

class Rectangle extends Shape {

}

class Polygon extends Shape {
  draw(gl, program) {
    let positionLoc = gl.getAttribLocation(program, "a_position");
    let colorLoc = gl.getUniformLocation(program, "u_color");

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW );
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniform4fv(colorLoc, this.color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertexArray.length / 2);
  }
}