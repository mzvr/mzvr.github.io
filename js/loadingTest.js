import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/EXRLoader.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';

import { GlassMaterial } from './scripts/GlassMaterial.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { MultiOrbitController } from './scripts/MultiOrbitController.js';
import { OrbitGui } from './scripts/OrbitGui.js';
import { CameraRaycaster } from './scripts/CameraRaycaster.js';
import { InteractionManager } from './scripts/InteractionManager.js';


// useful constants
const PI = 3.14159;
const Rad2Deg = 180.0 / PI;
const Deg2Rad = PI / 180.0;

// list of keys that point to an external file
const textureKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'];

// global variables
let canvas, stats, gui;
let clock, deltaTime, totalTime; 
let camera, scene, renderer, composer;
let bloomPass, gammaPass, SMAApass;
let mainLight;
let reflectionMap, ambientLightMap;

let objects = [];
var interactionManager;

// rendering settings
const settings = {
    renderQuality: 1,
    bloomStrength: 0.26,
    bloomThreshold: 0.04,
    bloomRadius: 0.0
};

// game paramaters
const params = {
    brightness: 5.0,
    rotation: true
}

// essentially json of objects
const models = {
     shuttle: {
        geometry: {
            url: './assets/models/shuttle/shuttle.glb'
        },
        material: {
            map: './assets/models/shuttle/2kAlbedo.png',
            normalMap: './assets/models/shuttle/2kNormal.png',
            metalness: 0.0,
            roughness: 1.0
        },
        tags: {
            nameID: 'Shuttle',
            title: 'Discovery Space Shuttle',
            description: 'Space Shuttle'
        },
        transform: {
            position: [0, 0, 0],
            rotation: [0, -120, 0],
            scale: [1, 1, 1]
        },
        settings: {
            enableShadows: true
        }
    },
    crest: {
        geometry: {
            url: './assets/models/crest/Crest.glb'
        },
        material: {
            map: './assets/models/crest/CrestAlbedo.png',
            roughnessMap: './assets/models/crest/CrestRoughness.png',
            metalnessMap: './assets/models/crest/CrestMetallic.png',
            metalness: 1.0
        },
        tags: {
            nameID: 'Crest',
            title: 'Adelaide University Crest',
            description: 'crestcrestcrest'
        },
        transform: {
            position: [-5, 3, -20],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        }
    },
    torch: {
        geometry: {
            url: './assets/models/torch/TorchHP.glb'
        },
        material: {
            map: './assets/models/torch/TorchAlbedo.png',
            roughnessMap: './assets/models/torch/TorchRoughness.png',
            metalnessMap: './assets/models/torch/TorchMetal.png',
            metalness: 1.0
        },
        tags: {
            nameID: 'Torch',
            title: '2000 Sydney Olympic Torch',
            description: 'torchtorchtorch'
        },
        transform: {
            position: [-30, 0, 3],
            rotation: [0, 0, 0],
            scale: [.1, .1, .1]
        }
    },
    balaclava: {
        geometry: {
            url: './assets/models/balaclava/balaclava.glb'
        },
        material: {
            map: './assets/models/balaclava/Balaclava.jpg',
        },
        tags: {
            nameID: 'Balaclava',
            title: 'Sir Douglas Mawson\'s Artic Balaclava',
            description: 'balaclavabalaclavabalaclava'
        },
        transform: {
            position: [-30, -7, -10],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        }
    },
    glove: {
        geometry: {
            url: './assets/models/glove/glove.glb'
        },
        material: {
            map:  './assets/models/glove/Glove_Albedo.jpg',
        },
        tags: {
            nameID: 'Glove',
            title: 'Cosmonaut Glove',
            description: 'glovegloveglove'
        },
        transform: {
            position: [-23, -3, -32],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        }
    },
    kangaroo: {
        geometry: {
            url: './assets/models/kangaroo/kangaroo.glb'
        },
        material: {
            map:  './assets/models/kangaroo/Kangaroo.jpg',
        },
        tags: {
            nameID: 'Kangaroo',
            title: 'Plush Kangaroo',
            description: 'kangarookangarookangaroo'
        },
        transform: {
            position: [10, 10, -10],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        }
    },
    meteor: {
        geometry: {
            url: './assets/models/meteor/meteor.glb'
        },
        material: {
            map:  './assets/models/meteor/Meteor Big.jpg',
        },
        tags: {
            nameID: 'Meteor',
            title: 'Meteor',
            description: 'meteormeteormeteor'
        },
        transform: {
            position: [-23, -9, 12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        }
    },
    smlmeteor: {
        geometry: {
            url: './assets/models/meteor Small/meteorSmall.glb'
        },
        material: {
            map:  './assets/models/meteor Small/Meteor Little1.jpg',
        },
        tags: {
            nameID: 'smlMeteor',
            title: 'Small Meteor',
            description: 'smlmeteorsmlmeteorsmlmeteor'
        },
        transform: {
            position: [-13, 9, 12],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        }
    }
}

initialise();

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

    gui.add(params, 'rotation');
    gui.add( params, 'brightness', 0.1, 10 ).onChange( function ( value ) {
        mainLight.intensity = value;
    } );

    return gui;
}

function updateClock() {
    deltaTime = clock.getDelta();
    totalTime = clock.getElapsedTime();
}

function loadTexture(url) {
    return new Promise(resolve => {
        new THREE.TextureLoader().load(url, resolve);
    });
}

// wrapper for loading gltf files
function loadGeometry(url, calculateTangents = false) {
    return new Promise(resolve => {
        loadGLTF(url).then(result => {
            if (calculateTangents) {
                result.scene.children[0].geometry.computeTangents();
            }

            resolve(result.scene.children[0].geometry);
        })
    });
}

// use loadGeometry instead to get vertex data
function loadGLTF(url) {
    return new Promise(resolve => {
        const loader = new GLTFLoader().load(url, resolve);
    });
}

function loadEXR(url) {
    return new Promise(resolve => {
        const loader = new EXRLoader().setDataType( THREE.UnsignedByteType );
        loader.load(url, resolve);
    });
}

function loadEnvTextures() {
    return new Promise (resolve => {
        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        pmremGenerator.compileEquirectangularShader();

        Promise.all([
        loadEXR('./assets/textures/environment/skybox3K.exr').then(result => {
            reflectionMap = result;
        }),
        loadEXR('./assets/textures/environment/skyboxMipmap.exr').then(result => {
            ambientLightMap = pmremGenerator.fromEquirectangular( result ).texture;
            pmremGenerator.dispose();
            result.dispose();
        })])
        .then(() => resolve())
    });
}

function setupSkybox() {
    return new Promise (resolve => {
        loadTexture('./assets/textures/skybox/skybox7.png')
        .then(result => {
            result.encoding = THREE.sRGBEncoding;

            const rt = new THREE.WebGLCubeRenderTarget(result.image.height);
            rt.fromEquirectangularTexture(renderer, result);
            scene.background = rt;

            resolve();
        });
    });
}

function setupRendering() {
    return new Promise(resolve => {
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
        camera.position.set(30, 10, 20);
        
        // rendering order
        composer = new EffectComposer( renderer );
        composer.addPass( new RenderPass( scene, camera ) );

        bloomPass = new UnrealBloomPass( 
            new THREE.Vector2( windowWidth(), windowHeight() ), 
            settings.bloomStrength, 
            settings.bloomThreshold, 
            settings.bloomRadius 
            );
        composer.addPass( bloomPass );

        gammaPass = new ShaderPass( GammaCorrectionShader );
        composer.addPass( gammaPass );

        SMAApass = new SMAAPass( windowWidth(), windowHeight() );
        composer.addPass( SMAApass );

        onWindowResize();
        window.addEventListener( 'resize', onWindowResize );

        resolve();
    });
}

function setupLighting() {
    return new Promise(resolve => {
        mainLight = new THREE.DirectionalLight(0xFFFFE9, params.brightness);
        mainLight.position.y = 4.3 * 2;
        mainLight.position.z = 5*Math.sin(-2.3) * 4;
        mainLight.position.x = 5*Math.cos(-2.3) * 4;
        scene.add(mainLight);

        renderer.shadowMap.enabled = true;

        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048*2; // default
        mainLight.shadow.mapSize.height = 2048*2; // default
        mainLight.shadow.camera.near = 0.5; // default
        mainLight.shadow.camera.far = 40; // default
        mainLight.shadow.normalBias = 0.05;

        var setShadowSize=(light1, sz)=>{
            light1.shadow.camera.left = sz;
            light1.shadow.camera.bottom = sz;
            light1.shadow.camera.right = -sz;
            light1.shadow.camera.top = -sz;
        }
        setShadowSize(mainLight,15.0);
        mainLight.shadow.camera.updateProjectionMatrix();     

        resolve();
    });
}

function setupInteraction()
{
    return new Promise (resolve => {
        const controls = new OrbitControls( camera, renderer.domElement );
        controls.enablePan = true;
        controls.enableDamping = true;

        var multiController = new MultiOrbitController(camera, controls, 20);
        var raycaster = new CameraRaycaster(camera, objects);
        interactionManager = new InteractionManager(multiController, raycaster);

        resolve();
    });
}

function loadMesh(model) {
    const promises = [
        loadGeometry(model.geometry.url, 'normalMap' in model.material),
        loadMaterial(model.material)
    ];

    return Promise.all(promises).then(result => {
        // create object3D
        var newMesh = new THREE.Mesh(result[0], result[1]);

        // set transform
        newMesh.position.set(model.transform.position[0], model.transform.position[1], model.transform.position[2]);
        newMesh.rotation.set(model.transform.rotation[0] * Deg2Rad, model.transform.rotation[1] * Deg2Rad, model.transform.rotation[2] * Deg2Rad)
        newMesh.scale.set(model.transform.scale[0], model.transform.scale[1], model.transform.scale[2]);

        if ('tags' in model) { 
            // attatch text
            newMesh.name = model.tags.name;
            newMesh.title = model.tags.title;
            newMesh.desc = model.tags.description;
        }

        if ('settings' in model)
        {
            if ('enableShadows' in model.settings)
            {
                newMesh.castShadow = model.settings.enableShadows;
                newMesh.receiveShadow = model.settings.enableShadows;
            }
        }

        return newMesh;
    });
}

function loadMaterial(model) {

    // default params
    const params = { 
        envMapIntensity: 2, 
        envMap: ambientLightMap 
    };

    const promises = Object.keys(model).map(key => {
        // load textures for supported keys
        if (textureKeys.indexOf(key) !== -1) {
            return loadTexture(model[key]).then(texture => {

            if (key=='map') {
                texture.encoding = THREE.sRGBEncoding;
            }
            else {
                texture.encoding = THREE.LinearEncoding;
            }

            texture.flipY = false;

            params[key] = texture;
        });
        // just copy the value otherwise  
        } else {
            params[key] = model[key];
        }
    });
    
    return Promise.all(promises).then(() => {
      return new THREE.MeshStandardMaterial(params);
    });
}

function loadModels() {
    return new Promise (resolve => {
        Promise.all([
            loadMesh(models.shuttle).then(result => { 
                scene.add(result) 
            }),
            loadMesh(models.crest).then(result => {
                var frame = result;
                loadGLTF('./assets/models/crest/CrestGlass.glb').then(result2 => {
                    var glassPlane = result2.scene.children[0];

                    var GlassMat = new GlassMaterial(reflectionMap);
                    GlassMat.transparent = true;

                    glassPlane.material = GlassMat;
                    glassPlane.rotateX(-Math.PI/2.0);
                    frame.add(glassPlane);

                    objects.push(frame), 
                    scene.add(frame) 
                }) 
            }),
            loadMesh(models.balaclava).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.glove).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.kangaroo).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.torch).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.meteor).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.smlmeteor).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
        ])
        .then(() => {
            resolve();
        })
    });
}

function loadScene() {
    return new Promise (resolve => {

        Promise.all([
            setupSkybox(),
            setupLighting(),
            loadEnvTextures()
        ])
        .then(() => loadModels())
        .then(() => setupInteraction())
        .then(() => resolve());
    });
}

function initialise() {
    stats = createStats();
    gui = createGUI();
    clock = new THREE.Clock();

    setupRendering()
    .then(() => loadScene())
    .then(() => {
        // need to call render once to finish setup
        render();

        // at this point scene is ready to be shown
        console.log("Finished loading");

        // start main loop
        animate();
    });
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

var axes;
var speeds;

// do game logic
function update() {
    interactionManager.update(deltaTime);

    if (params.rotation) 
    {
        if (axes == null) {
            axes = new Array();
            speeds = new Array();
        }

        while (axes.length < objects.length)
        {
            axes.push(new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize());
            speeds.push((Math.random < 0.5)?-1:1 * Math.random() * 0.01 + 0.005);
        }

        for (var i=0; i<objects.length; i++)
        {
            objects[i].rotateOnAxis(axes[i], speeds[i]);
        }
    }
}

// do rendering logic
function render() {
    composer.render();
}

function windowWidth()
{
    return window.innerWidth * window.devicePixelRatio * settings.renderQuality;
}

function windowHeight()
{
    return window.innerHeight * window.devicePixelRatio * settings.renderQuality;
}

function onWindowResize() {

    var newWidth = windowWidth();
    var newHeight = windowHeight();
  
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );
  
}