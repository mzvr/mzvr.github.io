import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
    
function createStats() {
    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';

    return stats;
}

const params = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 0
};

function main() {
    var stats = createStats();

    const gui = new GUI();

    document.body.appendChild( stats.domElement );

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    

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
    mainLight.shadow.camera.far = 100; // default

    const ambLight = new THREE.AmbientLight( 0x404040 );

    const scene = new THREE.Scene();

    scene.add(mainLight);
    scene.add(ambLight);

    scene.background = new THREE.Color('blue');
    scene.background.convertSRGBToLinear();
    



    var param = {
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        encoding: THREE.sRGBEncoding
    };

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85 );
    const renderScene = new RenderPass( scene, camera );

    let renderTarget1 = new THREE.WebGLRenderTarget( canvas.clientWidth * canvas.clientWidth / canvas.clientHeight, canvas.height * canvas.clientWidth / canvas.clientHeight, param );
    let renderTarget2 = new THREE.WebGLRenderTarget( canvas.clientWidth * canvas.clientWidth / canvas.clientHeight, canvas.height * canvas.clientWidth / canvas.clientHeight, param );
    let renderTarget3 = new THREE.WebGLRenderTarget( canvas.clientWidth * canvas.clientWidth / canvas.clientHeight, canvas.height * canvas.clientWidth / canvas.clientHeight, param );
    let renderTarget4 = new THREE.WebGLRenderTarget( canvas.clientWidth * canvas.clientWidth / canvas.clientHeight, canvas.height * canvas.clientWidth / canvas.clientHeight, param );


    const composer = new EffectComposer( renderer );

    composer.addPass( renderScene );
    
    composer.addPass( new ShaderPass( GammaCorrectionShader ) );
    composer.addPass( bloomPass );
    
    
    console.log(bloomPass);
    

    
    //renderer.toneMapping = THREE.NoToneMapping;
    {
        const planeGeometry = new THREE.PlaneBufferGeometry(5, 5, 1);
        const planeMaterial = new THREE.MeshStandardMaterial({color: 0x555555})
        planeGeometry.rotateX(-3.14 / 2);
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        scene.add(plane);
    }

    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            'https://upload.wikimedia.org/wikipedia/commons/6/60/ESO_-_Milky_Way.jpg',
            () => {
                texture.encoding = THREE.sRGBEncoding;
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
            //bloomPass.setSize(width, height);
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
        const albedo = new THREE.TextureLoader().load( 'assets/textures/octo/octotexture.png');
        albedo.encoding = THREE.sRGBEncoding;
        const normal = new THREE.TextureLoader().load( 'assets/textures/octo/octonorm.png');
        normal.encoding = THREE.LinearEncoding;
        const smoothness = new THREE.TextureLoader().load( 'assets/textures/octo/octorough.png');
        smoothness.encoding = THREE.LinearEncoding;


        var lambert = new THREE.MeshStandardMaterial({color:0xffffff, map: albedo, normalMap: normal, roughnessMap: smoothness});

        lambert.color.setHex( 0xffffff ).convertSRGBToLinear();

        // model
        const loader = new FBXLoader();
        loader.load('assets/models/octo2.fbx', function (object) {

            var geometry = [];

            object.traverse(function (child) {
                if (child.isMesh) {
                    geometry.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.geometry.scale(0.03, 0.03, 0.03);
                }
            });

            geometry[0].material = lambert;
            geometry[0].translateX(1);
            scene.add(geometry[0]);
        });
    }

    var octoColor = new THREE.Color("rgb(255,0,0)");
    var octoMat = new THREE.MeshStandardMaterial({color:octoColor, roughness: 0.2});

    {
        const loader = new FBXLoader();
        loader.load('assets/models/octo2.fbx', function (object) {

            var geometry = [];

            object.traverse(function (child) {
                if (child.isMesh) {
                    geometry.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.geometry.scale(0.03, 0.03, 0.03);
                }
            });

            geometry[0].material = octoMat;
            geometry[0].translateX(-1);
            scene.add(geometry[0]);
        });
    }

    renderer.physicallyCorrectLights = true;
    renderer.gammaFactor = 2.2;
    //renderer.outputEncoding = THREE.LinearEncoding ;

    gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

        renderer.gammaFactor = Math.pow( value, 4.0 );

    } );

    gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {

        bloomPass.threshold = Number( value );

    } );

    gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {

        bloomPass.strength = Number( value );

    } );

    gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

        bloomPass.radius = Number( value );

    } );

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

        octoMat.color.set( new THREE.Color(Math.cos(time*5) * 0.5 + 0.5,0,0) );
        octoMat.color.convertSRGBToLinear();

        //renderer.render(scene, camera);
        composer.render();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();