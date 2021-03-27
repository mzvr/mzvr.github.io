import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './ThreeJS/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';
import { FilmPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/FilmPass.js';

import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

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
    const gui = new GUI();
    
    const canvas = document.querySelector('#c');

    const renderer = new THREE.WebGLRenderer({canvas});
    renderer.physicallyCorrectLights = true;
    renderer.gammaFactor = 2.2;
    renderer.outputEncoding = THREE.LinearEncoding;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('blue');
    scene.background.convertSRGBToLinear();

    // camera setup
    const fov = 70;
    const aspect = 2;  
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 3;

    // camera controls setup
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    // sun setep
    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    mainLight.position.set(Math.cos(0), 2, Math.sin(0));
    scene.add(mainLight);

    // ambient light setup
    const ambLight = new THREE.AmbientLight( 0x404040 );
    scene.add(ambLight);

    const composer = new EffectComposer( renderer );

    const renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85 );
    composer.addPass( bloomPass );

    const gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    const SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
	composer.addPass( SMAApass );

    const filmPass = new FilmPass(
        0.3,   // noise intensity
        0.0,  // scanline intensity
        606,    // scanline count
        false,  // grayscale
    );
    //filmPass.renderToScreen = true;
    //composer.addPass(filmPass);

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
        const planeGeometry = new THREE.PlaneBufferGeometry(5, 5, 1);
        const planeMaterial = new THREE.MeshStandardMaterial({color: 0x555555});
        planeMaterial.dithering = true;
        planeGeometry.rotateX(-3.1415 / 2);
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(plane);
    }

    var sun;
    {
       const geometry = new THREE.SphereGeometry(.1,32,32);
       const material = new THREE.MeshBasicMaterial(0xffffff);
       sun = new THREE.Mesh( geometry, material );
       sun.position.set(Math.cos(0), 2, Math.sin(0));
       scene.add( sun );
    }

    var octoColor = new THREE.Color("rgb(255,0,0)");
    {
        var octoMat = new THREE.MeshPhysicalMaterial({color: octoColor, roughness: 0.7});

        const loader = new FBXLoader();
        loader.load('assets/models/octo2.fbx', function (object) {

            var geometry = [];

            object.traverse(function (child) {
                if (child.isMesh) {
                    geometry.push(child);
                }
            });

            geometry[0].geometry.scale(0.03, 0.03, 0.03);
            geometry[0].material = octoMat;
            scene.add(geometry[0]);
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