import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';


function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});


    const fov = 70;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 3;

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 1);


    //Set up shadow properties for the light
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048*2; // default
    mainLight.shadow.mapSize.height = 2048*2; // default
    mainLight.shadow.camera.near = 0.5; // default
    mainLight.shadow.camera.far = 200; // default

    const scene = new THREE.Scene();
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        mainLight.position.set(Math.cos(0), 2, Math.sin(0));
        scene.add(mainLight);
    }

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({color});

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;

        return cube;
    }

    const planeGeometry = new THREE.PlaneGeometry( 5, 5, );
    const planeMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } )
    planeGeometry.rotateX(-3.14/2);
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.receiveShadow = true;
    scene.add( plane );

    const cubes = [
        //makeInstance(geometry, 0x44aa88,  0),
        //makeInstance(geometry, 0x8844aa, -2),
        //makeInstance(geometry, 0xaa8844,  2),
    ];

    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            'https://upload.wikimedia.org/wikipedia/commons/6/60/ESO_-_Milky_Way.jpg',
            () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt;
            });
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
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

            geometry[0].material = new THREE.MeshStandardMaterial({color:0xffffff});
            geometry[0].translateX(-1);
            scene.add(geometry[0]);
        });
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        mainLight.position.z = 2*Math.sin(time);
        mainLight.position.x = 2*Math.cos(time);

        sun.position.z = 2*Math.sin(time);
        sun.position.x = 2*Math.cos(time);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();