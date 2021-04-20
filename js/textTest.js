import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { SceneUtils } from 'https://unpkg.com/three@0.126.1/examples/jsm/utils/SceneUtils.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';

import { EffectComposer } from './ThreeJS/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/SMAAPass.js';

import { createGeometry, loadFont, Shader } from './scripts/bmfont-text.js';

let canvas, stats, gui;
let camera, scene, renderer, controls, composer;
let renderScene, gammaPass, SMAApass;
let mainLight, sun;

let textObject = new THREE.Object3D;

const params = {
  renderQuality: 1,
  textField: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam mattis lacus lorem. Nullam non justo odio. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ipsum sem, venenatis sed pellentesque ut, pretium vitae turpis. Proin ullamcorper felis eu felis tincidunt, ac convallis lorem dignissim. Morbi a tempus turpis. Sed vulputate odio a eros interdum, ac consectetur odio vestibulum. Donec eu egestas dui. ',
  align: 'left',
  width: 300,
  letterSpacing: 0,
  lineHeight: 30,
  wireframe: false,
  textMaterial: null,
  wireMaterial: null,
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

function init() {
    stats = createStats();
    gui = new GUI();
    document.body.appendChild( stats.domElement );

    canvas = document.querySelector('#c');

    renderer = new THREE.WebGLRenderer({canvas});
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.physicallyCorrectLights = true;

    scene = new THREE.Scene();

    // camera setup
    const fov = 70;
    const aspect = 2;  
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = -2;
    camera.position.x = 0;
    camera.position.y = 0;

    // camera controls setup
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    // sun setep
    mainLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    mainLight.position.y = 2;
    mainLight.position.z = 2;
    mainLight.position.x = 2;
    scene.add(mainLight);

    composer = new EffectComposer( renderer );

    renderScene = new RenderPass( scene, camera );
    composer.addPass( renderScene );

    gammaPass = new ShaderPass( GammaCorrectionShader );
    composer.addPass( gammaPass );

    SMAApass = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
    composer.addPass( SMAApass );

    // skybox setup
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

    {
        const geometry = new THREE.SphereGeometry(.1,32,32);
        const material = new THREE.MeshBasicMaterial(0xffffff);
        sun = new THREE.Mesh( geometry, material );
        sun.position.x = 10;
        scene.add( sun );
    }

    params.wireMaterial = new THREE.MeshBasicMaterial({
        wireframe: true
    });

    loadFont('../assets/fonts/Arial.fnt', function(err, font) {
        // create a geometry of packed bitmap glyphs, 
        // word wrapped to 300px and right-aligned
        var geometry = createGeometry({
            width: 300,
            align: params.align,
            font: font
        })

        // change text and other options as desired
        // the options sepcified in constructor will
        // be used as defaults
        geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
        
        var center = new THREE.Vector3();
        geometry.computeBoundingBox();
        geometry.boundingBox.getCenter(center);
        center.multiplyScalar(0.01);
        

        // the resulting layout has metrics and bounds
        //console.log(geometry.layout.height)
        //console.log(geometry.layout.descender)
            
        // the texture atlas containing our glyphs
        var textureLoader = new THREE.TextureLoader();
        textureLoader.load('../assets/fonts/Arial.png', function (texture) {
        // we can use a simple ThreeJS material

        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter

        params.textMaterial = new THREE.RawShaderMaterial(Shader({
            alphaTest: 0.4,
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            color: 'rgb(255, 255, 255)'
        }));


        // now do something with our mesh!
        textObject = new THREE.Mesh(geometry, params.textMaterial);
        textObject.scale.set(-0.01,-0.01,0.01);
        //textObject.position.sub(center);

        
        //textObject.position.x += 1;
        //textObject.position.y -= 5;
        //textObject.position.z += 2;

        const box = new THREE.BoxHelper( textObject, 0xffff00 );
        textObject.attach( box );
        textObject.translateX(center.x);
        textObject.translateY(center.y);
        textObject.translateZ(center.z);

        //const axesHelper = new THREE.AxesHelper( 5 );
        //axesHelper.position.copy(textObject.position);
        //textObject.attach(axesHelper);

        scene.add(textObject);
        //sun.attach(textObject);

        
        
        sun.rotateY(0.4);
        });
    });

    var textOptions = gui.addFolder('Text Options');

    gui.add(params, 'renderQuality', { '100%': 1, '75%': 0.75, '50%': 0.5 } ).onChange(function (value) {
      onWindowResize();
    });

    textOptions.add(params, 'textField').onFinishChange(function (value) {
        textObject.geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
    });

    textOptions.add(params, 'width').onFinishChange(function (value) {
        textObject.geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
    });

    textOptions.add(params, 'lineHeight').onFinishChange(function (value) {
        textObject.geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
    });

    textOptions.add(params, 'letterSpacing').onFinishChange(function (value) {
        textObject.geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
    });

    textOptions.add(params, 'align', { Left: 'left', Right: 'right', Center: 'center' } ).onChange(function (value) {
        textObject.geometry.update({ text: params.textField, align: params.align, width: params.width, letterSpacing: params.letterSpacing, lineHeight: params.lineHeight });
    });

    textOptions.add(params, 'wireframe').onChange(function (value) {
        if (params.wireframe) textObject.material = params.wireMaterial;
        else textObject.material = params.textMaterial;
    });

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize );
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

    //console.log(time*0.0003);
    //sun.position.x = time*0.0003;

    //textObject.setRotationFromQuaternion(camera.quaternion);

    render(time);

    stats.end();

    requestAnimationFrame( animate );

}

function render(time) {
    //renderer.render(scene, camera);
    composer.render();
}