let gloria
let gloriaCopy
let poppins
let textlayer
let textIndices
let canvas

let horizontalSpeed = 0;
let prevMousePos = null

let BUFFER
let IMAGE_SIZE

const INCREMENTY = 60
const INCREMENTX = 429
const MAX_HORIZONTAL_SPEED = 15

function preload() {
    gloria = loadImage("./assets/portrait_cropped.png")
    poppins = loadFont('./assets/SpaceMono-Bold.ttf')
}

function setup() {
    gloria = gloria.get(0, 0, 1080, 1080)
    sketchSetup(init=true)
    textFont(poppins)
    background(255)
    prevMousePos = [mouseX, mouseY]
}

function draw() {
    background(0)
    textLayer.clear()
    textLayer.fill(255)
    textLayer.textStyle(BOLD)
    gloriaCopy.copy(gloria, 0, 0, gloria.width, gloria.height, 0, 0, gloriaCopy.width, gloriaCopy.height)

    let cursorDelta = Math.abs(mouseX - prevMousePos[0]) + Math.abs(mouseY - prevMousePos[1])
    prevMousePos = [mouseX, mouseY]
    horizontalSpeed = min(MAX_HORIZONTAL_SPEED, horizontalSpeed + cursorDelta)
    horizontalSpeed = max(0, horizontalSpeed - 1)
    let charIndex = 0
    let direction = 1

    for (let k = 0; k < textIndices.length; k++) {
        let i = textIndices[k][0]
        let j = textIndices[k][1]
        textStyle("bold")
        textLayer.textSize(70)
        textLayer.textAlign(CENTER, CENTER)
        textLayer.text("UDAYGOYAT", i, j)
        charIndex++

        if (k > 0 && textIndices[k - 1][1] < textIndices[k][1])
            direction *= -1
        textIndices[k][0] += horizontalSpeed * direction

        if (textIndices[k][0] > gloriaCopy.width + BUFFER)
            textIndices[k][0] = -BUFFER
        if (textIndices[k][0] < -BUFFER)
            textIndices[k][0] = gloriaCopy.width + BUFFER
    }

    gloriaCopy.mask(textLayer)
    image(gloriaCopy, 0, 0)
    filter(GRAY)
}

function windowResized() {
    sketchSetup();
}


function sketchSetup(init=false) {
    for (let i = 0; i < 1000000000; i++);

    const sketchHolder = document.getElementById("sketch-holder")
    const width = sketchHolder.offsetWidth
    IMAGE_SIZE = width

    if (IMAGE_SIZE == 0)
        return

    if (init)
        gloriaCopy = createImage(IMAGE_SIZE, IMAGE_SIZE)

    BUFFER = 0;
    while (BUFFER < 2 * IMAGE_SIZE)
        BUFFER += INCREMENTX
    BUFFER -= IMAGE_SIZE
    BUFFER /= 2

    gloriaCopy.resize(IMAGE_SIZE, IMAGE_SIZE)
    textLayer = createGraphics(IMAGE_SIZE, IMAGE_SIZE)
    textIndices = []
    for (let j = 0; j < gloriaCopy.height + BUFFER; j += INCREMENTY)
        for (let i = -BUFFER; i < gloriaCopy.width + BUFFER; i += INCREMENTX)
            textIndices.push([i, j])
    
    if (!init)
        canvas.remove()
    canvas = createCanvas(width, width)
    canvas.parent("sketch-holder")
    setTimeout(() => {
        canvas.elt.style.opacity = "1";
      }, 10);
}

// function windowResized() {
//     const sketchHolder = document.getElementById("sketch-holder")
//     const width = sketchHolder.offsetWidth
//     IMAGE_SIZE = width
//     // canvas.resize(width, width)
//     // resizeCanvas(width, width);
//     // canvas.parent('sketch-holder');

//     BUFFER = 0;
//     while (BUFFER < 2 * IMAGE_SIZE)
//         BUFFER += INCREMENTX
//     BUFFER -= IMAGE_SIZE
//     BUFFER /= 2

//     gloria = gloria.get(0, 0, 1080, 1080)
//     gloria.resize(IMAGE_SIZE, IMAGE_SIZE)
//     gloriaCopy = createImage(IMAGE_SIZE, IMAGE_SIZE)

//     textLayer = createGraphics(gloria.width, gloria.height)

//     for (let j = 0; j < gloria.height + BUFFER; j += INCREMENTY)
//         for (let i = -BUFFER; i < gloria.width + BUFFER; i += INCREMENTX)
//             textIndices.push([i, j])
// }