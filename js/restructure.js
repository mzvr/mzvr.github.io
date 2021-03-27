import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from './ThreeJS/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';
import { FilmPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/FilmPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

let canvas, stats;
let camera, scene, renderer, composer, controls;
let renderScene, bloomPass, gammaPass, SMAApass;
let mainLight, sun;

const params = {
    exposure: 2.2,
    bloomStrength: 0.7,
    bloomThreshold: 0.5,
    bloomRadius: 1.0
};

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
    camera.position.z = 3;

    // camera controls setup
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    // sun setep
    mainLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    mainLight.position.set(Math.cos(0), 1, Math.sin(0));
    scene.add(mainLight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048*2; // default
    mainLight.shadow.mapSize.height = 2048*2; // default
    mainLight.shadow.camera.near = 0.5; // default
    mainLight.shadow.camera.far = 20; // default
    mainLight.shadow.normalBias = 0.01;

    // ambient light setup
    const ambLight = new THREE.AmbientLight( 0x020210 );
    scene.add(ambLight);

    composer = new EffectComposer( renderer );

    renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85 );
    composer.addPass( bloomPass );

    gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
	composer.addPass( SMAApass );

    const filmPass = new FilmPass(
        0.3,   // noise intensity
        0.0,  // scanline intensity
        606,    // scanline count
        false,  // grayscale
    );

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
                //scene.background.convertSRGBToLinear();
            });
    }

    {
       const geometry = new THREE.SphereGeometry(.1,32,32);
       const material = new THREE.MeshBasicMaterial(0xffffff);
       sun = new THREE.Mesh( geometry, material );
       sun.position.set(Math.cos(0), 1, Math.sin(0));
       scene.add( sun );
    }

    {
        const albedo = new THREE.TextureLoader().load( './assets/models/shuttle/2048xShuttleAlbedo.png');
        const normal = new THREE.TextureLoader().load( './assets/models/shuttle/2048xShuttleNormal.png');
        //normal.encoding = THREE.LinearEncoding;
        const AO = new THREE.TextureLoader().load( './assets/models/shuttle/2048xShuttleAO.png');

        albedo.flipY = false;
        normal.flipY = false;
        //AO.flipY = false;

        var lambert = new THREE.MeshStandardMaterial({map: albedo, color:0xffffff, normalMap: normal, roughness: 0.6});
        lambert.normalMapType = THREE.TangentSpaceNormalMap;
        lambert.vertexTangents = true;

        const loader = new GLTFLoader();
        loader.load(
            './assets/models/shuttle/shuttle.glb',
            // called when the resource is loaded
            function ( gltf ) {

                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Group
                gltf.scenes; // Array<THREE.Group>
                gltf.scene.children[0].material = lambert;
                gltf.scene.children[0].scale.set(0.1,0.1,0.1);
                //gltf.scene.children[0].geometry.computeVertexNormals();

                gltf.scene.children[0].castShadow = true;
                gltf.scene.children[0].receiveShadow = true;
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object

                gltf.scene.children[0].geometry.computeTangents();

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

    gui.add( params, 'exposure', 0.1, 5 ).onChange( function ( value ) {
        gammaPass.uniforms.gamma.value = value;
    } );
    gui.add( params, 'bloomThreshold', 0.0, 5.0 ).onChange( function ( value ) {

        bloomPass.threshold = Number( value );

    } );
    gui.add( params, 'bloomStrength', 0.0, 2.0 ).onChange( function ( value ) {

        bloomPass.strength = Number( value );

    } );
    gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

        bloomPass.radius = Number( value );
    } );
}

function resizeRendererToDisplaySize(renderer)
    {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
        }
        return needResize;
    }

function animate(time) {
    
    
    stats.begin();

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    render(time);

    stats.end();

    requestAnimationFrame( animate );
}

function render(time) {
    time *= 0.0003;
    mainLight.position.z = 2*Math.sin(time);
    mainLight.position.x = 2*Math.cos(time);
    sun.position.z = 2*Math.sin(time);
    sun.position.x = 2*Math.cos(time);

    composer.render();
}