import './style.css';
import * as THREE from "three";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls"
// @ts-ignore
import Stats from 'three/addons/libs/stats.module.js';
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

const shape = {
    triangle: 0,
    square: 1,
    parallelogram: 2,
    circle: 3,
    kite: 4,
    trapeze: 5
}

const canvas = document.getElementById("canvas") as HTMLElement;

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

const gui = new GUI();
const debugObject = {
    speed: 1,
    pointsPerTick: 10,
    apply3d: false,
    shape: shape.triangle,
    maxParticles: 3000,
    pointSize: 5,
    stop: false,
    reset: () => {
        init();
    },
    setStop: () => {
        debugObject.stop = true;
    },
    continue: () => {
        debugObject.stop = false;
    },
    step: () => {
        draw();
    }
}
gui.add(debugObject, "apply3d").onChange(init);
gui.add(debugObject, "shape").options(shape).onChange(init);
gui.add(debugObject, "pointsPerTick").min(0).max(500).step(1);
gui.add(debugObject, "maxParticles").min(0).max(500_000).step(1).onFinishChange(init);
gui.add(debugObject, "pointSize").min(1).max(50).step(1).onFinishChange(init);
gui.add(debugObject, "reset").name("Reset")
gui.add(debugObject, "setStop").name("Stop")
gui.add(debugObject, "continue").name("Continue")
gui.add(debugObject, "step").name("Step")

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let orbitControls: OrbitControls;

let particles: THREE.Points;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

function render() {
    renderer.render(scene, camera);
}

let geometry: THREE.BufferGeometry;

let corners: number[] = [];
let drawCount = 3;

let lastX = Math.random();
let lastY = Math.random();
let lastZ = 1;

let n = (corner: number, last: number): number => {
    return (corner + last) / 2;
}

function addPoints() {
    const cornerCount = corners.length / 3;
    const randCorner = Math.round(Math.random() * (cornerCount - 1)) * 3;
    const nx = n(corners[randCorner], lastX);
    lastX = nx;
    const ny = n(corners[randCorner + 1], lastY);
    lastY = ny;
    const nz = n(corners[randCorner + 2], lastZ);
    lastZ = nz;

    const i3 = drawCount * 3;
    const positions = particles.geometry.attributes.position.array;
    // @ts-ignore
    positions[i3] = nx;
    // @ts-ignore
    positions[i3 + 1] = ny;
    // @ts-ignore
    positions[i3 + 2] = nz;
}

function initCorners() {
    switch (debugObject.shape) {
        case shape.triangle:
            drawCount = debugObject.apply3d ? 4 : 3;
            initCornersTriangle();
            break;
        case shape.square:
            drawCount = debugObject.apply3d ? 8 : 4;
            initCornersSquare();
            break;
        case shape.parallelogram:
            drawCount = debugObject.apply3d ? 8 : 4;
            initCornersParallelogram();
            break;
        case shape.circle:
            drawCount = 32;
            initCornersCircle();
            break;
        case shape.kite:
            drawCount = 8;
            initCornersKite();
            break;
        case shape.trapeze:
            drawCount = debugObject.apply3d ? 8 : 4;
            initCornersTrapeze();
            break;

    }
}

function initCornersTriangle() {
    corners = [];
    corners[0] = 0;
    corners[0 + 1] = 0;
    corners[0 + 2] = 1;

    corners[3] = 0.5;
    corners[3 + 1] = 1;
    corners[3 + 2] = debugObject.apply3d ? 0.66 : 1;

    corners[6] = 1;
    corners[6 + 1] = 0;
    corners[6 + 2] = 1;

    lastX = Math.random();
    lastY = Math.random();
    lastZ = 1;

    if (debugObject.apply3d) {
        corners[9] = 0.5;
        corners[9 + 1] = 0;
        corners[9 + 2] = 0;
    }
}

function initCornersSquare() {
    corners = [];
    corners[0] = 0;
    corners[0 + 1] = 0;
    corners[0 + 2] = 1;

    corners[3] = 0;
    corners[3 + 1] = 1;
    corners[3 + 2] = 1;

    corners[6] = 1;
    corners[6 + 1] = 1;
    corners[6 + 2] = 1;

    corners[9] = 1;
    corners[9 + 1] = 0;
    corners[9 + 2] = 1;

    lastX = Math.random();
    lastY = Math.random();
    lastZ = 1;

    if (debugObject.apply3d) {
        corners[12] = 0;
        corners[12 + 1] = 0;
        corners[12 + 2] = 0;

        corners[15] = 0;
        corners[15 + 1] = 1;
        corners[15 + 2] = 0;

        corners[18] = 1;
        corners[18 + 1] = 1;
        corners[18 + 2] = 0;

        corners[21] = 1;
        corners[21 + 1] = 0;
        corners[21 + 2] = 0;
        lastZ = Math.random();
    }
}

function initCornersParallelogram() {
    initCornersSquare();

    corners[3] = 0.5;
    corners[6] = 1.5;

    if (debugObject.apply3d) {
        corners[15] = 0.5;
        corners[18] = 1.5;
    }
}

function initCornersTrapeze() {
    initCornersSquare();

    corners[3] = 0.25;
    corners[6] = 0.75;

    if (debugObject.apply3d) {
        corners[15] = 0.25;
        corners[18] = 0.75;
    }
}

function initCornersCircle() {
    corners = [];
    for (let i = 0; i <= 32; i++) {
        let i3 = i * 3;
        corners[i3] = Math.sin(i) / 2 + 0.5;
        corners[i3 + 1] = Math.cos(i) / 2 + 0.5;
        corners[i3 + 2] = 1.0;
    }
}

function initCornersKite() {
    corners = [];
    corners[0] = 0.5;
    corners[0 + 1] = 0;
    corners[0 + 2] = 1;

    corners[3] = 0;
    corners[3 + 1] = 0.75;
    corners[3 + 2] = 1;

    corners[6] = 0.5;
    corners[6 + 1] = 1;
    corners[6 + 2] = 1;

    corners[9] = 1;
    corners[9 + 1] = 0.75;
    corners[9 + 2] = 1;

    if (debugObject.apply3d) {
        corners[12] = 0.5;
        corners[12 + 1] = 0.75;
        corners[12 + 2] = 0.75;

        corners[15] = 0.5;
        corners[15 + 1] = 0.75;
        corners[15 + 2] = 1.25;
    }
}

function draw() {
    if (drawCount == debugObject.maxParticles) {
        return;
    }

    const geometry = particles.geometry;
    for (var i = 0; i <= debugObject.pointsPerTick; i++) {
        drawCount += 1;
        addPoints();
    }
    geometry.setDrawRange(0, drawCount);
    geometry.attributes.position.needsUpdate = true;
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 3)
    camera.position.set(0.5, 0.25, 1.75);
    orbitControls = new OrbitControls(camera, canvas);
    orbitControls.enableDamping = true;
    orbitControls.target = new THREE.Vector3(0.5, 0.5, 0.5)

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true
    })
    renderer.setSize(sizes.width, sizes.height);

    geometry = new THREE.BufferGeometry();

    initCorners();
    const points = new Float32Array(debugObject.maxParticles * 3);
    points.set(corners);
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    geometry.setDrawRange(0, drawCount);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uSize: { value: debugObject.pointSize },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    tick()
}

function tick() {
    if (!debugObject.stop) {
        draw();
    }

    if (orbitControls) {
        orbitControls.update();
    }

    render();
    stats.update();
    window.requestAnimationFrame(tick);
}

init();
