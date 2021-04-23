import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

import { MultiOrbitController } from './scripts/MultiOrbitController.js';
import { CameraRaycaster } from './scripts/CameraRaycaster.js';
import { InteractionManager } from './scripts/InteractionManager.js';
import { OrbitGui } from './scripts/OrbitGui.js';

let canvas, stats, gui;
let clock, deltaTime, totalTime; 
let camera, scene, renderer, composer;
let renderScene, gammaPass, SMAApass;
let mainLight;

var interactionManager;

let objects = [];

var params = {
    renderQuality: 1,
} 

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
    var gui = new GUI();
    document.body.appendChild( stats.domElement );
    return gui;
}

function updateClock() {
    deltaTime = clock.getDelta();
    totalTime = clock.getElapsedTime();
}

function init() {
    /////////////////////////////////////////////////////////////////////
    //                        THREEJS INIT                             //
    /////////////////////////////////////////////////////////////////////
    {
        stats = createStats();
        gui = createGUI();
        clock = new THREE.Clock();

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
        scene.add(camera);

        // sun setep
        mainLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        mainLight.position.y = 2;
        mainLight.position.z = 0;
        mainLight.position.x = 2;
        scene.add(mainLight);

        // ambient light setup
        const ambLight = new THREE.AmbientLight( 0x555555 );
        ambLight.color.convertSRGBToLinear();
        scene.add(ambLight);

        composer = new EffectComposer( renderer );

        renderScene = new RenderPass( scene, camera );
        composer.addPass( renderScene );

        gammaPass = new ShaderPass( GammaCorrectionShader );
        composer.addPass( gammaPass );

        SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        composer.addPass( SMAApass );

        onWindowResize();
        window.addEventListener( 'resize', onWindowResize );

        gui.add(params, 'renderQuality', { '100%': 1, '75%': 0.75, '50%': 0.5 } ).onChange(function (value) {
            onWindowResize();
        });
    }   

    /////////////////////////////////////////////////////////////////////
    //                          SCENE INIT                             //
    /////////////////////////////////////////////////////////////////////
    {
        var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', 'aqua', 'chocolate', 'deeppink', 'moccasin', 'palevioletred'];

        for (let i = 0; i < 20; i++) {
            const geometry = new THREE.IcosahedronBufferGeometry(Math.random()/20+0.04,7);
            var index = Math.floor(Math.random() * 12);
            const material = new THREE.MeshLambertMaterial({color: colors[index]});
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.y = Math.random()-0.5;
            sphere.position.z = Math.random()-0.5;
            sphere.position.x = Math.random()-0.5;
            sphere.name = colors[index];
            scene.add( sphere );
            objects.push( sphere );
        }

        let controls = new OrbitControls( camera, renderer.domElement );
        controls.enablePan = false;
        //controls.enableZoom = false;
        controls.maxDistance = 0.75;
        controls.minDistance = 0.25;

        controls.enableDamping = true;

        var orbitGui = new OrbitGui(camera, renderer, scene);
        var multiController = new MultiOrbitController(camera, controls);
        var raycaster = new CameraRaycaster(camera, objects);
        interactionManager = new InteractionManager(multiController, raycaster, orbitGui);
    }
}

function onWindowResize() {

    var newWidth = window.innerWidth * window.devicePixelRatio * params.renderQuality;
    var newHeight = window.innerHeight * window.devicePixelRatio * params.renderQuality;
  
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );

}

function animate() {
    
    stats.begin();

    // game loop
    updateClock();
    update();
    render();

    stats.end();

    requestAnimationFrame( animate );
}

function update() {
    interactionManager.update(deltaTime);
}

function render() {
    composer.render();
}