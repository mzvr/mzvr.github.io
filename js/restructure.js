import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

import { Lensflare, LensflareElement } from 'https://unpkg.com/three@0.126.1/examples/jsm/objects/Lensflare.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { ACESFilmicToneMappingShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/ACESFilmicToneMappingShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';
import { FilmPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/FilmPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { VertexTangentsHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/helpers/VertexTangentsHelper.js';

let canvas, stats;
let camera, scene, renderer, composer, controls;
let renderScene, bloomPass, ACESPass, gammaPass, SMAApass;
let mainLight, sun;

const params = {
    renderQuality: 1,
    brightness: 5,
    bloomStrength: 0.26,
    bloomThreshold: 0.04,
    bloomRadius: 0.0,
    sunRotation: -2.54,
    ambientLight: 0x4d4d64
};

const sunDist = 5;
const sunHeight = 2;

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

function init() {
    stats = createStats();
    const gui = new GUI();
    document.body.appendChild( stats.domElement );

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
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.x = 3;
    camera.position.y = 1;

    // camera controls setup
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    // sun setep
    mainLight = new THREE.DirectionalLight(0xFFFFFF, params.brightness);
    mainLight.position.y = sunHeight;
    mainLight.position.z = sunDist*Math.sin(params.sunRotation);
    mainLight.position.x = sunDist*Math.cos(params.sunRotation);
    scene.add(mainLight);

    // Lens flare
    /*const textureLoader = new THREE.TextureLoader();
    const textureFlare0 = textureLoader.load( "./assets/textures/sprites/FlareTest2.png" );
    textureFlare0.encoding = THREE.sRGBEncoding;
    const lensflare = new Lensflare();
    lensflare.addElement( new LensflareElement( textureFlare0, 256, 0 ) );
    lensflare.addElement( new LensflareElement( textureFlare0, 128, 0.1 ) );
    lensflare.addElement( new LensflareElement( textureFlare0, 80, 0.2 ) );
    lensflare.addElement( new LensflareElement( textureFlare0, 60, -0.25 ) );
    mainLight.add( lensflare );*/

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048*2; // default
    mainLight.shadow.mapSize.height = 2048*2; // default
    mainLight.shadow.camera.near = 0.5; // default
    mainLight.shadow.camera.far = 20; // default
    mainLight.shadow.normalBias = 0.007;

    // ambient light setup
    const ambLight = new THREE.AmbientLight( params.ambientLight );
    ambLight.color.convertSRGBToLinear();
    scene.add(ambLight);

    composer = new EffectComposer( renderer );

    renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), params.bloomStrength, params.bloomThreshold, params.bloomRadius );
    composer.addPass( bloomPass );

    //ACESPass = new ShaderPass( ACESFilmicToneMappingShader );
    //composer.addPass( ACESPass );

    gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
	composer.addPass( SMAApass );

    /*const filmPass = new FilmPass(
        0.06,   // noise intensity
        0.0,  // scanline intensity
        606,    // scanline count
        false,  // grayscale
    );
    composer.addPass( filmPass );*/

    // skybox setup
    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            './assets/textures/skybox/skybox.png',
            () => {
                texture.encoding = THREE.sRGBEncoding;
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt;
            });
    }
    

    {
        const geometry = new THREE.SphereGeometry(.1,32,32);
        const material = new THREE.MeshBasicMaterial(0xffffff);
        sun = new THREE.Mesh( geometry, material );
        sun.position.y = sunHeight;
        sun.position.z = sunDist*Math.sin(params.sunRotation);
        sun.position.x = sunDist*Math.cos(params.sunRotation);
        scene.add( sun );
    }

    {
        const loader = new GLTFLoader();
        loader.load(
            './assets/models/shuttle/shuttle.glb',
            // called when the resource is loaded
            function ( gltf ) {

                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Group
                gltf.scenes; // Array<THREE.Group>
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object

                gltf.scene.children[0].geometry.computeTangents();
                gltf.scene.children[0].scale.set(0.1,0.1,0.1);
                //gltf.scene.children[0].geometry.computeVertexNormals();
                gltf.scene.children[0].castShadow = true;
                gltf.scene.children[0].receiveShadow = true;
                gltf.scene.children[0].rotateY(-2.0);

                //const helper = new VertexTangentsHelper( gltf.scene.children[0], .1, 0x00ffff, 1 );
                //scene.add(helper);

                const albedo = new THREE.TextureLoader().load( './assets/models/shuttle/2kAlbedo.png');
                albedo.encoding = THREE.sRGBEncoding;
                const normal = new THREE.TextureLoader().load( './assets/models/shuttle/2kNormal.png');
                normal.encoding = THREE.LinearEncoding;
                //const AO = new THREE.TextureLoader().load( './assets/models/shuttle/2kAO.png');
                //AO.encoding = THREE.LinearEncoding;

                albedo.flipY = false;
                normal.flipY = false;
                //AO.flipY = false;

                var lambert = new THREE.MeshPhysicalMaterial({ map: albedo, normalMap: normal, roughness: 1, vertexTangents: true});
                //lambert.aoMapIntensity = 1;
                gltf.scene.children[0].material = lambert;
                

                scene.add(gltf.scene.children[0]);

            },
            // called while loading is progressing
            function ( xhr ) {

                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

            },
            // called when loading has errors
            function ( error ) {

                console.log( 'An error happened' );

            }
        );
    }

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize );

    gui.add(params, 'renderQuality', { '100%': 1, '75%': 0.75, '50%': 0.5 } ).onChange(function (value) {
        onWindowResize();
    });
    gui.add( params, 'brightness', 0.1, 10 ).onChange( function ( value ) {
        mainLight.intensity = value;
    } );
    gui.add( params, 'bloomThreshold', 0.0, 5.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
    } );
    gui.add( params, 'bloomStrength', 0.0, 2.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
    } );
    gui.add( params, 'bloomRadius', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
    } );
    gui.add( params, 'sunRotation', -3.1415, 3.1415 ).onChange( function ( value ) {
        mainLight.position.z = sunDist*Math.sin(value);
        mainLight.position.x = sunDist*Math.cos(value);
        sun.position.z = sunDist*Math.sin(value);
        sun.position.x = sunDist*Math.cos(value);
    } );
    gui.addColor( params, 'ambientLight' )
        .onChange( function() { 
            ambLight.color.set( params.ambientLight);
            ambLight.color.convertSRGBToLinear();
    } );
}

function onWindowResize() {

    var newWidth = window.innerWidth * window.devicePixelRatio * params.renderQuality;
    var newHeight = window.innerHeight * window.devicePixelRatio * params.renderQuality;
  
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );
  
  }

function animate(time) {
    
    
    stats.begin();

    //resizeRendererToDisplaySize(renderer);

    render(time);

    stats.end();

    requestAnimationFrame( animate );
}

function render(time) {
    composer.render();
}