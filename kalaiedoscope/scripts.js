let symmetry = 6;
let angle = 360 / symmetry;
let saveButton;
let clearButton;
let slider;
let xoff = 0;

function setup() {
  createCanvas(600, 600);
  angleMode(DEGREES);
  background(127);
  saveButton = createButton('save');
  saveButton.mousePressed(saveSnowflake);
  clearButton = createButton('clear');
  clearButton.mousePressed(clearCanvas);
  slider = createSlider(1, 32, 10, 0.1);
  //colorMode(HSB);

  saveButton.style('font-size', '20px')
  saveButton.style('margin', '18px 14px 18px 18px')
  clearButton.style('font-size', '20px')
  clearButton.style('margin', '18px 14px 18px 0px')

}

function saveSnowflake() {
  save('snowflake.png');
}

function clearCanvas() {
  background(127);
}

function borderfill() {
  strokeWeight(4);
stroke(0,0,0);
rect(1,0,0,height);
rect(width-1,0,0,height);
rect(0,1,height,0);
rect(0,height-1,width,height);
}

function draw() {
  borderfill();
  translate(width / 2, height / 2);

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let pmx = pmouseX - width / 2;
    let pmy = pmouseY - height / 2;

    if (mouseIsPressed) {
      let hu = map(sin(xoff), -1, 1, 0, 255);
      xoff += 1;
      stroke(hu, 100);
      for (let i = 0; i < symmetry; i++) {
        rotate(angle);
        //let d = dist(mx, my, pmx, pmy);
        //let sw = map(d, 0, 16, 16, 2);
        let sw = slider.value();
        strokeWeight(sw);
        line(mx, my, pmx, pmy);
        push();
        scale(1, -1);
        line(mx, my, pmx, pmy);
        pop();
      }
    }
  }
}