import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

let canvas, stats, gui;
let clock, deltaTime, totalTime; 
let camera, scene, renderer, composer;
let renderScene, gammaPass, SMAApass;
let mainLight;
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();

let controls;

let clickedObject = null;
let clickTime;

let objects = [];

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

        document.addEventListener( 'pointerdown', onPointerDown );
        
        document.addEventListener( 'pointerup', onPointerUp );
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

        //const controls = new OrbitControls( objects[0], renderer.domElement );
        controls = new OrbitControls( camera, renderer.domElement );
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        //controls.minZoom = 2;
    }
}



function onWindowResize() {

    var newWidth = window.innerWidth * window.devicePixelRatio;
    var newHeight = window.innerHeight * window.devicePixelRatio

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );

}

function onPointerDown( event ) {
    // screen pos of click
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // raycast from screen
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( objects );

    // set clicked object if exists
    if ( intersects.length > 0 ) {
        clickedObject = intersects[0].object;
        clickTime = totalTime;
    }
}

function onPointerUp( event ) {
    if (clickedObject == null)
    {
        return;
    }

    let mouse = new THREE.Vector2();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    let dist = pointer.distanceTo(mouse);

    // guess if intentional click
    if (totalTime-clickTime < 0.1 && dist < 0.05)
    {
        // save offset
        var offsetVector = controls.object.position.sub(controls.target);

        // set new target
        controls.target = clickedObject.position;

        // reapply offset
        controls.object.position.copy(controls.target.clone().add(offsetVector));

        // update orbit 
        controls.update();

        // set color
        scene.background = new THREE.Color(clickedObject.name);
        scene.background.convertSRGBToLinear();
    }

    clickedObject = null;
}

function animate() {
    
    stats.begin();

    updateClock();

    update();

    render();

    stats.end();

    requestAnimationFrame( animate );
}

function update() {
    controls.update();
}

function render(time) {
    renderer.render(scene, camera);
    //composer.render();
}