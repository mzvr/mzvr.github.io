import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/helpers/VertexTangentsHelper.js';


function createStats() {
    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    return stats;
}

function main() {
    var stats = createStats();
    document.body.appendChild( stats.domElement );

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const composer = new EffectComposer( renderer );

    const fov = 70;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 3;

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    mainLight.position.set(Math.cos(0), 2, Math.sin(0));

    //Set up shadow properties for the light
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048*2; // default
    mainLight.shadow.mapSize.height = 2048*2; // default
    mainLight.shadow.camera.near = 0.5; // default
    mainLight.shadow.camera.far = 50; // default
    mainLight.shadow.normalBias = 0.01;
    const ambLight = new THREE.AmbientLight( 0x43556e );

    const scene = new THREE.Scene();

    scene.add(mainLight);
    scene.add(ambLight);

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    const renderScene = new RenderPass( scene, camera );

    bloomPass.threshold = 0.6;
    bloomPass.strength = 3;
    bloomPass.radius = 1;

    composer.addPass( renderScene );
    composer.addPass( bloomPass );
    //composer.addPass( new ShaderPass( GammaCorrectionShader ) );

    scene.background = new THREE.Color('red');
    //renderer.toneMapping = THREE.NoToneMapping;

    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            './assets/textures/skybox/skybox.png',
            () => {
                //texture.encoding = THREE.sRGBEncoding;
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt;
            });
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

    var sun;
    {
       const geometry = new THREE.SphereGeometry(.1,32,32);
       const material = new THREE.MeshBasicMaterial(0xffffff);
       sun = new THREE.Mesh( geometry, material );
       sun.position.set(Math.cos(0), 2, Math.sin(0));
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

                //const helper = new VertexNormalsHelper( gltf.scene.children[0], 0.1, 0x00ff00, 1 );
                //scene.add(helper);
                //const helper2 = new VertexTangentsHelper( gltf.scene.children[0], .1, 0x00ffff, 1 );
                //scene.add( helper2 );




                //https://mzvr.github.io/assets/models/shuttle/
                //https://mzvr.github.io/assets/models/shuttle/2048xShuttleNormal.png
                //https://mzvr.github.io/assets/textures/octo/octotexture.png

                //console.log(gltf.scene.children[0]);
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

    renderer.physicallyCorrectLights = true;
    renderer.gammaFactor = 2.2;
    //renderer.outputEncoding = THREE.sRGBEncoding;

    function render(time) {
        stats.update();

        time *= 0.0003;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        mainLight.position.z = 2*Math.sin(time);
        mainLight.position.x = 2*Math.cos(time);

        sun.position.z = 2*Math.sin(time);
        sun.position.x = 2*Math.cos(time);

        renderer.render(scene, camera);
        //composer.render();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();