import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/EXRLoader.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { FXAAShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/FXAAShader.js';

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
let camera, scene, textScene, renderer, composer;
let bloomPass, gammaPass, fxaaPass;
let mainLight, sun;
let reflectionMap, ambientLightMap;

const introcurve = new THREE.CubicBezierCurve3(
	new THREE.Vector3( 30.8277, 11.3447, 22.9208 ),
	new THREE.Vector3( 310.599, 59.6473, 184.447 ),
	new THREE.Vector3( 210.46, 455.478, 269.058 ),
	new THREE.Vector3( 191.354, 586.909, 302.973 )
);

let objects = [];
var interactionManager;

// rendering settings
const settings = {
    renderQuality: 1,
    bloomStrength: 0.26,
    bloomThreshold: 0.04,
    bloomRadius: 0.0,
    sunRotation: -2.3
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
            map: './assets/models/shuttle/2kAlbedoEndeavour.png',
            normalMap: './assets/models/shuttle/2kNormal.png',
            metalness: 0.0,
            roughness: 1.0
        },
        tags: {
            nameID: 'Shuttle',
            title: '',
            description: ''
        },
        transform: {
            position: [0, 0, 0],
            rotation: [0, -120, 0],
            scale: [1, 1, 1]
        },
        settings: {
            minDist: 21.052631578947278,
            maxDist: 181.5160232574907,
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
            title: 'Framed University of Adelaide crest',
            description: 'Many astronauts arrange for small mementos to travel as part of the Official Flight Kit. Upon return from space, they are often gifted to organisations as a token of support. Dr Andy Thomas gained a PhD in fluid mechanics at the University of Adelaide, and gifted this crest to University\'s Alumni Association.'
        },
        transform: {
            position: [-5, 3, -20],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        settings: {
            minDist: 4.078136514915769,
            maxDist: 13.268408625781221
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
            title: 'Sydney Olympic Torch',
            description: "It\'s the year 2000 and the stage is set for the greatest Olympics the world has ever seen. For months, engineers at the University of Adelaide have been designing the inter-workings of the Sydney Olympic torch. Subsequently Dr Thomas coordinated efforts for the torch to circle the earth aboard the International Space Station."
        },
        transform: {
            position: [-30, 0, 3],
            rotation: [200, 0, 0],
            scale: [.15, .15, .15]
        },
        settings: {
            minDist: 5.270401889314851,
            maxDist: 13.268408625781227
        }
    },
    balaklava: {
        geometry: {
            url: './assets/models/balaklava/balaklava.glb'
        },
        material: {
            map: './assets/models/balaklava/BalaklavaCol.png',
            normalMap: './assets/models/balaklava/BalaklavaNormal.png',
            roughnessMap: './assets/models/balaklava/BalaklavaRoughness.png',
        },
        tags: {
            nameID: 'Balaklava',
            title: 'Antarctic Explorer Balaclava',
            description: 'The early Antarctic explorers faced similar challenges to astronauts. You must carry everything you need for your survival. \nThis balaclava was part of the kit worn by Sir Douglas Mawson and his crew. A master of survival, Mawson proved himself to be one of the greatest explorers of the age.'
        },
        transform: {
            position: [-30, -6, -10],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        },
        settings: {
            minDist: 2.5702431313020475,
            maxDist: 15.475618749999972
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
            description: ''
        },
        transform: {
            position: [-23, -3, -32],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        },
        settings: {
            minDist: 5.270401889314851,
            maxDist: 13.268408625781397
        }
    },
    kangaroo: {
        geometry: {
            url: './assets/models/kangaroo/kangaroo.glb'
        },
        material: {
            map: './assets/models/kangaroo/kangaroo.png',
            roughnessMap: './assets/models/kangaroo/kangarooRoughness.png'
        },
        tags: {
            nameID: 'Kangaroo',
            title: 'Kangaroo Stuffed Toy',
            description: 'Did you know all NASA astronauts must be American citizens? \nDr Andrew Thomas grew up in Adelaide and became an American citizen after moving to the US for his career. Kangaroos are one of the most iconic Aussie symbols and this stuffed toy travelled with Andy on his four space missions.'
        },
        transform: {
            position: [10, 10, -10],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        },
        settings: {
            minDist: 2.997805080976326,
            maxDist: 14.701837812499928
        }
    },
    hat: {
        geometry: {
            url: './assets/models/hat/hat.glb'
        },
        material: {
            map: './assets/models/hat/hatCol.png',
            roughnessMap: './assets/models/hat/hatRoughness.png'
        },
        tags: {
            nameID: 'Hat',
            title: 'Australian Flag Cap',
            description: 'Australian flag cap worn by Dr Thomas aboard space shuttle Endeavour on the flight to Mir, as well as during his 130 days on the space station.'
        },
        transform: {
            position: [-21, -8, -23],
            rotation: [0, 0, 0],
            scale: [8, 8, 8]
        },
        settings: {
            minDist: 2.705519085581132,
            maxDist: 11.376001845529183
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
            description: ''
        },
        transform: {
            position: [-23, -9, 12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        settings: {
            minDist: 5.270401889314851,
            maxDist: 181.5160232574907
        }
    },
    smlmeteor: {
        geometry: {
            url: './assets/models/meteor Small/meteorSmall.glb'
        },
        material: {
            map:  './assets/models/meteor Small/meteorSmall.png',
        },
        tags: {
            nameID: 'smlMeteor',
            title: 'Small Meteor',
            description: ''
        },
        transform: {
            position: [-13, 9, 12],
            rotation: [0, 0, 0],
            scale: [7, 7, 7]
        },
        settings: {
            minDist: 5.270401889314851,
            maxDist: 181.5160232574907
        }
    },
    boomerang: {
        geometry: {
            url: './assets/models/boomerang/boomerang.glb'
        },
        material: {
            map: './assets/models/boomerang/boomerangAlbedo.png'
        },
        tags: {
            nameID: 'Boomerang',
            title: 'Returning Boomerang',
            description: 'Space shuttles and returning Boomerangs – both require a mastery of aerodynamics to fly. This Boomerang was flown with Dr Thomas aboard space shuttle Endeavour in 1996. It has been in South Australian Museum\'s collection since FG Waterhouse, Dr Thomas\'s great-great-grandfather, was the museum\'s curator.'
        },
        transform: {
            position: [-15, -3, 6],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        settings: {
            minDist: 4.078136514915769,
            maxDist: 13.268408625781221
        }
    },
    badge: {
        geometry: {
            url: './assets/models/badge/badge.glb'
        },
        material: {
            map: './assets/models/badge/badgeAlbedo.png',
            roughnessMap: './assets/models/badge/badgeRough.png',
            metalnessMap: './assets/models/badge/badgeMetal.png',
            normalMap: './assets/models/badge/badgeNorm.png',
            metalness: 1.0
        },
        tags: {
            nameID: 'Badge',
            title: 'South Australian Police Badge',
            description: 'This police badge was flown aboard the Space Shuttle Discovery that launched from the Kennedy Space Centre in 2005. It completed 219 orbits of the earth, travelled 5,796,419 miles at a maximum speed of 17,694 mph. Upon return to earth, Dr Thomas presented it to the South Australian Police Force.'
        },
        transform: {
            position: [-32, 3, -20],
            rotation: [0, 0, 0],
            scale: [0.22, 0.22, 0.22]
        },
        settings: {
            minDist: 4.078136514915769,
            maxDist: 13.268408625781221
        }
    }
}

// entry point
initialise();

function createStats() {
    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    document.body.appendChild( stats.domElement );

    return stats;
}

function createGUI() {
    var gui = new GUI();

    gui.close();
    
    gui.add(params, 'rotation');
    gui.add( params, 'brightness', 0.1, 10 ).onChange( function ( value ) {
        mainLight.intensity = value;
    } );
    gui.add( settings, 'bloomThreshold', 0.0, 5.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
    } );
    gui.add( settings, 'bloomStrength', 0.0, 2.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
    } );
    gui.add( settings, 'bloomRadius', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
    } );
    gui.add( settings, 'sunRotation', -3.1415, 3.1415 ).onChange( function ( value ) {
        mainLight.position.y = 4.3 * 2;
        mainLight.position.z = 5*Math.sin(value) * 4;
        mainLight.position.x = 5*Math.cos(value) * 4;
        sun.position.set(mainLight.position.x*200, mainLight.position.y*200, mainLight.position.z*200);
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

        renderer = new THREE.WebGLRenderer({canvas: canvas, powerPreference: "high-performance"});
        renderer.outputEncoding = THREE.LinearEncoding;
        renderer.physicallyCorrectLights = true;
        renderer.autoClearColor = false;

        scene = new THREE.Scene();
        textScene = new THREE.Scene();
        scene.background = new THREE.Color('blue');
        scene.background.convertSRGBToLinear();

        // camera setup
        const fov = 70;
        const aspect = 2;  
        const near = 0.1;
        const far = 10000;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(30*6, 10*6, 20*6);
        textScene.add(camera);
        
        // rendering order
        composer = new EffectComposer( renderer );
        composer.addPass( new RenderPass( scene, camera ) );
        
        fxaaPass = new ShaderPass( FXAAShader );
		fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / windowWidth();
		fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / windowHeight();
        composer.addPass( fxaaPass );

        bloomPass = new UnrealBloomPass( 
            new THREE.Vector2( windowWidth(), windowHeight() ), 
            settings.bloomStrength, 
            settings.bloomThreshold, 
            settings.bloomRadius 
            );
        composer.addPass( bloomPass );

        gammaPass = new ShaderPass( GammaCorrectionShader );
        composer.addPass( gammaPass );

        onWindowResize();
        window.addEventListener( 'resize', onWindowResize );

        resolve();
    });
}

function setupLighting() {
    return new Promise(resolve => {
        mainLight = new THREE.DirectionalLight(0xE9E9FFFF, params.brightness);

        mainLight.position.y = 4.3 * 2;
        mainLight.position.z = 5*Math.sin(-2.3) * 4;
        mainLight.position.x = 5*Math.cos(-2.3) * 4;

        const sungeometry = new THREE.SphereGeometry( 20, 32, 32 );
        const sunmaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        sun = new THREE.Mesh( sungeometry, sunmaterial );
        sun.position.set(mainLight.position.x*200, mainLight.position.y*200, mainLight.position.z*200);
        scene.add(sun);

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
        controls.dampingFactor = 0.015;

        var orbitGui = new OrbitGui(camera, renderer);
        
        var multiController = new MultiOrbitController(camera, controls, 20);
        var raycaster = new CameraRaycaster(camera, objects);
        interactionManager = new InteractionManager(multiController, raycaster, orbitGui);

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
                objects.unshift(result),
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
            loadMesh(models.boomerang).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.badge).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.balaklava).then(result => { 
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
            loadMesh(models.hat).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            loadMesh(models.torch).then(result => { 
                objects.push(result), 
                scene.add(result) 
            }),
            //loadMesh(models.meteor).then(result => { 
            //    objects.push(result), 
            //    scene.add(result) 
            //}),
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

// setup winow and load assets
function initialise() {
    //stats = createStats();
    gui = createGUI();
    clock = new THREE.Clock();

    setupRendering()
    .then(() => loadScene())
    .then(() => {

        const points = introcurve.getPoints( 50 );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

        // Create the final object to add to the scene
        const curveObject = new THREE.Line( geometry, material );
        //scene.add(curveObject);

        // need to call render once to finish setup
        render();

        // at this point scene is loaded onto user device
        // may not be ready to display though
        // seems to be loading from memory to gpu
        console.log("Finished loading");

        // start game
        animate();
    });
}

// main game loop
function animate() {

    // game loop
    updateClock();
    update();
    render();

    requestAnimationFrame( animate );
}

var axes;
var speeds;

// game logic
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
            axes.push(new THREE.Vector3(Math.random()-0.5,Math.random()*2-1,Math.random()-0.5).normalize());
            speeds.push((Math.random < 0.5 ? -1 : 1) * Math.random() * 0.005 + 0.0025);
        }

        for (var i=1; i<objects.length; i++)
        {
            objects[i].rotateOnAxis(axes[i], speeds[i]);
        }
    }
}

// rendering logic
function render() {
    composer.render();
    renderer.render(textScene, camera);
}

function windowWidth()
{
    return window.innerWidth *  (window.devicePixelRatio > 1 ? window.devicePixelRatio * 0.75 : window.devicePixelRatio) * settings.renderQuality;
}

function windowHeight()
{
    return window.innerHeight *  (window.devicePixelRatio > 1 ? window.devicePixelRatio * 0.75 : window.devicePixelRatio) * settings.renderQuality;
}

function onWindowResize() {
    var newWidth = windowWidth();
    var newHeight = windowHeight();
  
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize( newWidth, newHeight, false );
    composer.setSize( newWidth, newHeight );

    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / windowWidth();
	fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / windowHeight();
}