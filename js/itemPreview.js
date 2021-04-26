import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/RGBELoader.js';

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
} 

const USE_NORMAL = false;
const _VS = `
attribute vec3 tangent;

varying vec3 rayDir;
varying vec3 worldNorm;`
+
(USE_NORMAL ? `
varying mat3 TBN;
varying vec2 _uv;` : ``)
+ `
void main() {
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    worldNorm = (mat3(modelMatrix) * normal);` 
    +
    (USE_NORMAL ? 
    `vec3 worldTangent = (mat3(modelMatrix) * tangent);
    worldTangent = normalize(worldTangent- dot(worldTangent, worldNorm) * worldNorm);
    vec3 worldBinorm = cross(worldNorm, worldTangent);
    _uv = uv;
    TBN = mat3(worldTangent, worldBinorm, worldNorm);` : ``)
    + `
    rayDir = worldPos-cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const _FS = `
varying vec3 rayDir;
varying vec3 worldNorm;`
+
(USE_NORMAL ? `
varying mat3 TBN;
varying vec2 _uv;
uniform sampler2D normalMap;` : ``)
+ `
uniform sampler2D envMap;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 SampleEquirectMap(vec3 direction) {
    vec2 uv = vec2(atan(direction.z, direction.x), asin(direction.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

vec3 decodeRGBE( vec4 hdr ) {
    return hdr.rgb * exp2( (hdr.a*255.0)-128.0 );
    // return hdr.rgb * pow( 2.0, (hdr.a*255.0)-128.0 );
}`
+ `
const float MIN_ALPHA = 0.1;
void main() {
    vec3 ray = normalize(rayDir);`
    +
    (USE_NORMAL ? `
    vec3 norm = TBN * (texture(normalMap, _uv).xyz * 2.0 - 1.0);
    vec3 refl = reflect(ray, norm);
    vec4 rgbe = texture(envMap, SampleEquirectMap(refl));
    vec3 rgb = decodeRGBE(rgbe);
    float fresnel = 1.0 + dot(ray, norm);` 
    : `
    vec3 refl = reflect(ray, worldNorm);
    vec4 rgbe = texture(envMap, SampleEquirectMap(refl));
    vec3 rgb = decodeRGBE(rgbe);
    float fresnel = 1.0 + dot(ray, worldNorm);`)
    + `
    fresnel = max(fresnel * fresnel, MIN_ALPHA);

    gl_FragColor = vec4(rgb, fresnel);
}`;

var viewDir;
// custom shader material
{
    viewDir = new THREE.ShaderMaterial({
        uniforms: {
            envMap: { value: new THREE.Texture() },
            normalMap: { value: new THREE.Texture() }
        },
        vertexShader: _VS,
        fragmentShader: _FS,
        depthWrite: false
    });
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
        camera.position.z = 25;
        camera.position.x = 0;
        camera.position.y = 0;
        scene.add(camera);

        // sun setep
        mainLight = new THREE.DirectionalLight(0xFFFFFF, 2);
        mainLight.position.y = 2;
        mainLight.position.z = 2;
        mainLight.position.x = 2;
        //scene.add(mainLight);

        // ambient light setup
        const ambLight = new THREE.AmbientLight( 0x555555 );
        ambLight.color.convertSRGBToLinear();
        //scene.add(ambLight);

        composer = new EffectComposer( renderer );

        renderScene = new RenderPass( scene, camera );
        composer.addPass( renderScene );

        gammaPass = new ShaderPass( GammaCorrectionShader );
        composer.addPass( gammaPass );

        SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
        composer.addPass( SMAApass );

        onWindowResize();
        window.addEventListener( 'resize', onWindowResize );
    }   

    /////////////////////////////////////////////////////////////////////
    //                          SCENE INIT                             //
    /////////////////////////////////////////////////////////////////////
    {
        const loader = new GLTFLoader();

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        pmremGenerator.compileEquirectangularShader();

        const hdrEquirect = new RGBELoader()
        .setDataType( THREE.UnsignedByteType )
        .load( './assets/textures/environment/beach.hdr', function () {

            const hdrBackground = pmremGenerator.fromEquirectangular( hdrEquirect ).texture;
            //
            pmremGenerator.dispose();

            viewDir.uniforms.envMap.value = hdrEquirect;
            viewDir.transparent = true;
            hdrEquirect.dispose();

            // crest
            loader.load(
                './assets/models/crest/Crest.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/crest/CrestAlbedo.png');
                    albedo.encoding = THREE.sRGBEncoding;
                    const rough = new THREE.TextureLoader().load( './assets/models/crest/CrestRoughness.png');
                    rough.encoding = THREE.LinearEncoding;
                    const metal = new THREE.TextureLoader().load( './assets/models/crest/CrestMetallic.png');
                    metal.encoding = THREE.LinearEncoding;

                    albedo.flipY = false;
                    rough.flipY = false;
                    metal.flipY = false;

                    const crestmat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughnessMap: rough, metalnessMap: metal, metalness: 1});

                    gltf.scene.children[0].material = crestmat;

                    gltf.scene.children[0].position.x += 20;
                    
                    objects.push(gltf.scene.children[0]);
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
            
            // crest glass
            loader.load(
                './assets/models/crest/CrestGlass.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    //var glassmat = new THREE.MeshPhysicalMaterial({envMap: hdrBackground, metalness: 0, roughness: 0, transmission: 1, transparent: true});
                    
                    gltf.scene.children[0].material = viewDir;

                    gltf.scene.children[0].position.x += 20;

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

            // torch
            loader.load(
                './assets/models/torch/TorchHP.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/torch/TorchAlbedo.png');
                    albedo.encoding = THREE.sRGBEncoding;
                    const rough = new THREE.TextureLoader().load( './assets/models/torch/TorchRoughness.png');
                    rough.encoding = THREE.LinearEncoding;
                    const metal = new THREE.TextureLoader().load( './assets/models/torch/TorchMetal.png');
                    metal.encoding = THREE.LinearEncoding;

                    albedo.flipY = false;
                    rough.flipY = false;
                    metal.flipY = false;

                    const torchmat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1, roughnessMap: rough, metalnessMap: metal, metalness: 1});

                    gltf.scene.children[0].material = torchmat;

                    gltf.scene.children[0].position.x += 30;

                    gltf.scene.children[0].scale.set(0.1,0.1,0.1);
                    
                    objects.push(gltf.scene.children[0]);
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

            // balaclava
            loader.load(
                './assets/models/balaclava/balaclava.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/balaclava/Balaclava.jpg');
                    albedo.encoding = THREE.sRGBEncoding;
                    albedo.flipY = false;

                    const mat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1});

                    gltf.scene.children[0].geometry.scale(7,7,7);
                    gltf.scene.children[0].material = mat;
                    gltf.scene.children[0].position.x += 40;
                    
                    objects.push(gltf.scene.children[0]);
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

            // glove
            loader.load(
                './assets/models/glove/glove.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/glove/Glove_Albedo.jpg');
                    albedo.encoding = THREE.sRGBEncoding;
                    albedo.flipY = false;

                    const mat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1});

                    gltf.scene.children[0].geometry.scale(7,7,7);
                    gltf.scene.children[0].material = mat;
                    gltf.scene.children[0].position.x += 50;
                    
                    objects.push(gltf.scene.children[0]);
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

            // kangaroo
            loader.load(
                './assets/models/kangaroo/kangaroo.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/kangaroo/Kangaroo.jpg');
                    albedo.encoding = THREE.sRGBEncoding;
                    albedo.flipY = false;

                    const mat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1});

                    gltf.scene.children[0].geometry.scale(7,7,7);
                    gltf.scene.children[0].material = mat;
                    gltf.scene.children[0].position.x += 60;
                    
                    objects.push(gltf.scene.children[0]);
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

            // meteor
            loader.load(
                './assets/models/meteor/meteor.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/meteor/Meteor Big.jpg');
                    albedo.encoding = THREE.sRGBEncoding;
                    albedo.flipY = false;

                    const mat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1});

                    gltf.scene.children[0].material = mat;

                    gltf.scene.children[0].position.x += 70;
                    
                    objects.push(gltf.scene.children[0]);
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

            // meteor small
            loader.load(
                './assets/models/meteor Small/meteorSmall.glb',
                // called when the resource is loaded
                function ( gltf ) {

                    const albedo = new THREE.TextureLoader().load( './assets/models/meteor Small/Meteor Little1.jpg');
                    albedo.encoding = THREE.sRGBEncoding;
                    albedo.flipY = false;

                    const mat = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, roughness: 1});
                    gltf.scene.children[0].geometry.scale(7,7,7);
                    gltf.scene.children[0].material = mat;

                    gltf.scene.children[0].position.x += 80;
                    
                    objects.push(gltf.scene.children[0]);
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
        } );

        // shuttle
        {
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
                    gltf.scene.children[0].scale.set(1,1,1);
                    //gltf.scene.children[0].castShadow = true;
                    //gltf.scene.children[0].receiveShadow = true;
    
                    const albedo = new THREE.TextureLoader().load( './assets/models/shuttle/2kAlbedo.png');
                    albedo.encoding = THREE.sRGBEncoding;
                    const normal = new THREE.TextureLoader().load( './assets/models/shuttle/2kNormal.png');
                    normal.encoding = THREE.LinearEncoding;
                    //const AO = new THREE.TextureLoader().load( './assets/models/shuttle/2kAO.png');
                    //AO.encoding = THREE.LinearEncoding;
    
                    albedo.flipY = false;
                    normal.flipY = false;
                    //AO.flipY = false;

                    viewDir.uniforms.normalMap.value = normal;
    
                    var lambert = new THREE.MeshPhysicalMaterial({ map: albedo, normalMap: normal, roughness: 1, vertexTangents: true});
                    gltf.scene.children[0].material = viewDir;

                    objects.push(gltf.scene.children[0]);
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

        
        

        let controls = new OrbitControls( camera, renderer.domElement );
        controls.enablePan = true;
        //controls.enableZoom = false;
        //controls.maxDistance = 0.75;
        //controls.minDistance = 0.25;

        controls.enableDamping = true;

        //var orbitGui = new OrbitGui(camera, renderer, scene);
        var multiController = new MultiOrbitController(camera, controls, 20);
        var raycaster = new CameraRaycaster(camera, objects);
        interactionManager = new InteractionManager(multiController, raycaster);
    }
}

function onWindowResize() {

    var newWidth = window.innerWidth * window.devicePixelRatio;
    var newHeight = window.innerHeight * window.devicePixelRatio;
  
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