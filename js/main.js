import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';


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
    mainLight.shadow.camera.far = 200; // default

    const scene = new THREE.Scene();

    scene.add(mainLight);

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
        var albedo = new THREE.TextureLoader().load( 'assets/textures/octo/octotexture.png');
        //albedo.encoding = THREE.sRGBEncoding;
        const normal = new THREE.TextureLoader().load( 'assets/textures/octo/octonorm.png');
        const smoothness = new THREE.TextureLoader().load( 'assets/textures/octo/octorough.png');


        var lambert = new THREE.MeshStandardMaterial({color:0xffffff, map: albedo, normalMap: normal, roughnessMap: smoothness});

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

        octoMat.color.set( new THREE.Color(Math.cos(time*5) * 0.5 + 0.5,0,0) );
        octoMat.color.convertSRGBToLinear();

        //renderer.render(scene, camera);
        composer.render();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();