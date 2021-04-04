import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

let canvas, stats, gui;
let camera, scene, renderer, composer;
let renderScene, gammaPass, SMAApass;
let mainLight;

init();
animate();

function createStats() {
    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    return stats;
}

function createGUI() {
    var newGui = new GUI();
    document.body.appendChild( stats.domElement );
    return newGui;
}

function init() {
    stats = createStats();
    gui = createGUI();

    canvas = document.querySelector('#c');

    renderer = new THREE.WebGLRenderer({canvas});
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.physicallyCorrectLights = true;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('grey');
    scene.background.convertSRGBToLinear();

    // camera setup
    const fov = 70;
    const aspect = 2;  
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.x = 0;
    camera.position.y = 0;

    // sun setep
    mainLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    mainLight.position.y = -2;
    mainLight.position.z = -2;
    mainLight.position.x = -2;
    scene.add(mainLight);

    // ambient light setup
    const ambLight = new THREE.AmbientLight( 0xAAAAAA );
    ambLight.color.convertSRGBToLinear();
    scene.add(ambLight);

    composer = new EffectComposer( renderer );

    renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
	composer.addPass( SMAApass );
    
    {
        const geometry = new THREE.SphereBufferGeometry(1,32,32);
        const material = new THREE.MeshLambertMaterial(0xFFFFFF);
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.y = 0;
        sphere.position.z = 0;
        sphere.position.x = 0;
        scene.add( sphere );
    }
}

function resizeRendererToDisplaySize(renderer)
{
    //const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function animate(time) {
    
    
    stats.begin();

    resizeRendererToDisplaySize(renderer);

    render(time);

    stats.end();

    requestAnimationFrame( animate );
}

function render(time) {
    composer.render();
}