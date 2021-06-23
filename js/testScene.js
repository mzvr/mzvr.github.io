import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/EXRLoader.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';
import { FilmPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/FilmPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

import { MultiOrbitController } from './scripts/MultiOrbitController.js';
import { CameraRaycaster } from './scripts/CameraRaycaster.js';
import { InteractionManager } from './scripts/InteractionManager.js';
import { OrbitGui } from './scripts/OrbitGui.js';

import { GlassMaterial } from './scripts/GlassMaterial.js';

let canvas, stats, gui;
let clock, deltaTime, totalTime; 
let camera, scene, renderer, composer;
let renderScene, bloomPass, ACESPass, gammaPass, SMAApass;
let mainLight, sun;

var interactionManager;

let objects = [];

const params = {
    renderQuality: 1,
    brightness: 5,
    bloomStrength: 0.26,
    bloomThreshold: 0.04,
    bloomRadius: 0.0,
    sunRotation: -2.54,
    sunHeight: 2,
    ambientLight: 0x4d4d64,
    rotation: true
};

const sunDist = 5;

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
    stats = createStats();
    gui = createGUI();
    clock = new THREE.Clock();

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
    camera.position.z = 20;
    camera.position.x = 30;
    camera.position.y = 10;

    // sun setep
    mainLight = new THREE.DirectionalLight(0xFFFFE9, params.brightness);
    mainLight.position.y = params.sunHeight * 2;
    mainLight.position.z = sunDist*Math.sin(params.sunRotation) * 4;
    mainLight.position.x = sunDist*Math.cos(params.sunRotation) * 4;
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
    mainLight.shadow.camera.far = 40; // default
    mainLight.shadow.normalBias = 0.007;

    var setShadowSize=(light1, sz)=>{
        light1.shadow.camera.left = sz;
        light1.shadow.camera.bottom = sz;
        light1.shadow.camera.right = -sz;
        light1.shadow.camera.top = -sz;
    }
    setShadowSize(mainLight,15.0);
    mainLight.shadow.camera.updateProjectionMatrix();      

    // ambient light setup
    //const ambLight = new THREE.AmbientLight( params.ambientLight );
    //ambLight.color.convertSRGBToLinear();
    //scene.add(ambLight);

    composer = new EffectComposer( renderer );

    renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), params.bloomStrength, params.bloomThreshold, params.bloomRadius );
    composer.addPass( bloomPass );

    gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
	composer.addPass( SMAApass );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize );

    /*const filmPass = new FilmPass(
        0.06,   // noise intensity
        0.0,  // scanline intensity
        606,    // scanline count
        false,  // grayscale
    );
    composer.addPass( filmPass );*/

    // skybox setup
    {
        const texloader = new THREE.TextureLoader();
        const texture = texloader.load(
            './assets/textures/skybox/skybox7.png',
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
        sun.position.y = params.sunHeight;
        sun.position.z = sunDist*Math.sin(params.sunRotation);
        sun.position.x = sunDist*Math.cos(params.sunRotation);
        scene.add( sun );
    }

    const loader = new GLTFLoader();

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    var reflMap;
        var EXRLoad = new EXRLoader()
			.setDataType( THREE.UnsignedByteType )
			.load( './assets/textures/environment/skybox3K.exr', function ( texture ) {
                reflMap = texture;
                
                new EXRLoader()
                .setDataType( THREE.UnsignedByteType )
                .load( './assets/textures/environment/skyboxMipmap.exr', function ( texture ) {
                    
                    const hdrBackground = pmremGenerator.fromEquirectangular( texture ).texture;
                    pmremGenerator.dispose();
                    var GlassMat = new GlassMaterial(reflMap);
                    GlassMat.transparent = true;
                    texture.dispose();


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
                            gltf.scene.children[0].position.x -= 5;
                            gltf.scene.children[0].position.y += 3;
                            gltf.scene.children[0].position.z -= 20;
                            
                            var frame = gltf.scene.children[0];

                            objects.push(gltf.scene.children[0]);
                            scene.add(gltf.scene.children[0]);

                            // crest glass
                            loader.load(
                                './assets/models/crest/CrestGlass.glb',
                                // called when the resource is loaded
                                function ( gltf ) {

                                    //var glassmat = new THREE.MeshPhysicalMaterial({envMap: hdrBackground, metalness: 0, roughness: 0, transmission: 1, transparent: true});
                                    
                                    gltf.scene.children[0].material = GlassMat;
                                    gltf.scene.children[0].rotateX(-Math.PI/2.0);

                                    frame.add(gltf.scene.children[0]);

                                    //scene.add(gltf.scene.children[0]);
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

                            gltf.scene.children[0].position.x -= 30;
                            gltf.scene.children[0].position.z += 3;

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
                            gltf.scene.children[0].position.x -= 30;
                            gltf.scene.children[0].position.y -= 7;
                            gltf.scene.children[0].position.z -= 10;
                            
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
                            
                            gltf.scene.children[0].position.x -= 23;
                            gltf.scene.children[0].position.y -= 3;
                            gltf.scene.children[0].position.z -= 32;
                            
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
                            gltf.scene.children[0].position.x += 10;
                            gltf.scene.children[0].position.y += 10;
                            gltf.scene.children[0].position.z -= 10;
                            
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

                            gltf.scene.children[0].position.x -= 23;
                            gltf.scene.children[0].position.y -= 9;
                            gltf.scene.children[0].position.z += 12;
                            
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

                            gltf.scene.children[0].position.x -= 13;
                            gltf.scene.children[0].position.y += 9;
                            gltf.scene.children[0].position.z += 12;
                            
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

                    { // shuttle
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
                                gltf.scene.children[0].scale.set(1,1,1);
                                //gltf.scene.children[0].geometry.computeVertexNormals();
                                gltf.scene.children[0].castShadow = true;
                                gltf.scene.children[0].receiveShadow = true;
                                gltf.scene.children[0].rotateY(-2.0);
                
                                const albedo = new THREE.TextureLoader().load( './assets/models/shuttle/2kAlbedo.png');
                                albedo.encoding = THREE.sRGBEncoding;
                                const normal = new THREE.TextureLoader().load( './assets/models/shuttle/2kNormal.png');
                                normal.encoding = THREE.LinearEncoding;
                
                                albedo.flipY = false;
                                normal.flipY = false;
                
                                var lambert = new THREE.MeshStandardMaterial({ envMapIntensity: 2, envMap: hdrBackground, map: albedo, normalMap: normal, roughness: 1, vertexTangents: true});
                                gltf.scene.children[0].material = lambert;
                                
                                //objects.push(gltf.scene.children[0]);
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
        } );
    });

    
    gui.add(params, 'rotation').onChange(function (value) {
        
    });
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
        mainLight.position.z = sunDist*Math.sin(value)*4;
        mainLight.position.x = sunDist*Math.cos(value)*4;
        sun.position.z = sunDist*Math.sin(value)*4;
        sun.position.x = sunDist*Math.cos(value)*4;
    } );
    gui.add( params, 'sunHeight', -10.0, 10.0 ).onChange( function ( value ) {
        sun.position.y = value * 2;
        mainLight.position.y = value * 2;
    } );
    gui.addColor( params, 'ambientLight' )
        .onChange( function() { 
            ambLight.color.set( params.ambientLight);
            ambLight.color.convertSRGBToLinear();
    } );

    let controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = true;

    controls.enableDamping = true;

    var multiController = new MultiOrbitController(camera, controls, 20);
    var raycaster = new CameraRaycaster(camera, objects);
    interactionManager = new InteractionManager(multiController, raycaster);
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

    // game loop
    updateClock();
    update();
    render();

    stats.end();

    requestAnimationFrame( animate );
}

var axes;

function update() {
    interactionManager.update(deltaTime);

    if (params.rotation && objects != null) 
    {
        if (axes == null) axes = new Array();
        while (axes.length < objects.length)
        {
            axes.push(new THREE.Vector3(Math.random(),Math.random(),Math.random()).normalize());
        }

        for (var i=0; i<objects.length; i++)
        {
            objects[i].rotateOnAxis(axes[i], 0.01);
        }
    }
}

function render(time) {
    composer.render();
}