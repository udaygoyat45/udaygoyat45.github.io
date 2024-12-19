let gloria
let gloriaCopy
let poppins
let textlayer
let textIndices = []

const INCREMENTY = 60
const INCREMENTX = 430
const HORIZONTAL_SPEED = 10
let BUFFER;
let IMAGE_SIZE

function preload() {
    gloria = loadImage("./assets/portrait_cropped.png")
    poppins = loadFont('./assets/SpaceMono-Bold.ttf')
}

function setup() {
    const sketchHolder = document.getElementById("sketch-holder")
    const width = sketchHolder.offsetWidth
    let canvas = createCanvas(width, width)
    canvas.parent('sketch-holder')
    IMAGE_SIZE = width
    
    BUFFER = 0;
    while (BUFFER < 2 * IMAGE_SIZE)
        BUFFER += INCREMENTX
    BUFFER -= IMAGE_SIZE
    BUFFER /= 2

    gloria = gloria.get(0, 0, 1080, 1080)
    gloria.resize(IMAGE_SIZE, IMAGE_SIZE)
    gloriaCopy = createImage(IMAGE_SIZE, IMAGE_SIZE)

    textFont(poppins)
    background(255)
    textLayer = createGraphics(gloria.width, gloria.height)

    for (let j = 0; j < gloria.height + BUFFER; j += INCREMENTY)
        for (let i = -BUFFER; i < gloria.width + BUFFER; i += INCREMENTX)
            textIndices.push([i, j])
}

function draw() {
    background(0)
    textLayer.clear()
    textLayer.fill(255)
    textLayer.textStyle(BOLD)
    gloriaCopy.copy(gloria, 0, 0, gloria.width, gloria.height, 0, 0, gloriaCopy.width, gloriaCopy.height)

    let horizontalSpeed = map(mouseY, 0, windowHeight, 0, HORIZONTAL_SPEED)
    let charIndex = 0

    for (let k = 0; k < textIndices.length; k++) {
        let i = textIndices[k][0]
        let j = textIndices[k][1]
        textStyle("bold")
        textLayer.textSize(70)
        textLayer.textAlign(CENTER, CENTER)
        textLayer.text("UDAYGOYAT", i, j)
        charIndex++

        if (k > 0 && textIndices[k - 1][1] < textIndices[k][1])
            horizontalSpeed *= -1
        textIndices[k][0] += horizontalSpeed

        if (textIndices[k][0] > gloria.width + BUFFER)
            textIndices[k][0] = -BUFFER
        if (textIndices[k][0] < -BUFFER)
            textIndices[k][0] = gloria.width + BUFFER
    }

    gloriaCopy.mask(textLayer)
    image(gloriaCopy, 0, 0)
    filter(GRAY)
}

function windowResized() {
    const sketchHolder = document.getElementById("sketch-holder")
    const width = sketchHolder.offsetWidth
    IMAGE_SIZE = width

    BUFFER = 0;
    while (BUFFER < 2 * IMAGE_SIZE)
        BUFFER += INCREMENTX
    BUFFER -= IMAGE_SIZE
    BUFFER /= 2

    gloria.resize(IMAGE_SIZE, IMAGE_SIZE)
    gloriaCopy.resize(IMAGE_SIZE, IMAGE_SIZE)
    textLayer.resize(IMAGE_SIZE, IMAGE_SIZE)
    for (let j = 0; j < gloria.height + BUFFER; j += INCREMENTY)
        for (let i = -BUFFER; i < gloria.width + BUFFER; i += INCREMENTX)
            textIndices.push([i, j])
    
    canvas.parent('sketch-holder')
    console.log(width)
    resizeCanvas(width, width)
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