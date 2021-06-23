import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

let canvas, stats, gui;
let clock, deltaTime, totalTime; 
let camera, scene, renderer, composer;

const settings = {
    renderQuality: 1
};

const sunDist = 5;
const sunHeight = 2;

init();

function createStats() {
    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    return stats;
}

function createGUI() {
    var gui = new GUI();
    document.body.appendChild( stats.domElement );
    return gui;
}

function updateClock() {
    deltaTime = clock.getDelta();
    totalTime = clock.getElapsedTime();
}

function setupRendering()
{
    canvas = document.querySelector('#c');

    renderer = new THREE.WebGLRenderer({canvas});
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.physicallyCorrectLights = true;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('blue');
    scene.background.convertSRGBToLinear();

    // camera setup
    const fov = 70;
    const aspect = 2;  
    const near = 0.1;
    const far = 300;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // rendering order
    composer = new EffectComposer( renderer );
    composer.addPass( new RenderPass( scene, camera ) );        // render objects
}

function loadPNG(url) {
    return new Promise(resolve => {
        new THREE.TextureLoader().load(url, resolve);
    });
}

function setupSkybox() {
    console.log("start");
    const texture = loadPNG('./assets/textures/skybox/skybox7.png').then(result => {
        result.encoding = THREE.sRGBEncoding;
        const rt = new THREE.WebGLCubeRenderTarget(result.image.height);
        rt.fromEquirectangularTexture(renderer, result);
        scene.background = rt;
    });
    console.log("end");
}

function init() {
    stats = createStats();
    gui = createGUI();
    clock = new THREE.Clock();

    setupRendering();
    
    console.log("before");

    setupSkybox();

    console.log("after");

    // setup auto resizing
    onWindowResize();
    window.addEventListener( 'resize', onWindowResize );

    // start game loop
    animate();
}

// main game loop
function animate() {
    
    stats.begin();

    // game loop
    updateClock();
    update();
    render();

    stats.end();

    requestAnimationFrame( animate );
}

// do game logic
function update() {
}

// do rendering logic
function render(time) {
    composer.render();
}

function onWindowResize() {

    var newWidth = window.innerWidth * window.devicePixelRatio * settings.renderQuality;
    var newHeight = window.innerHeight * window.devicePixelRatio * settings.renderQuality;
  
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );
  
}