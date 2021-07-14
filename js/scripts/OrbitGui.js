import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { createGeometry, loadFont, Shader } from './bmfont-text.js';

const maxAngle = 25 * Math.PI / 180;

class OrbitGui {
    constructor(camera, renderer) {
        this.pivotObject = new THREE.Object3D();
        this.pivotObject.name = "pivotObject";

        this.textParams = {
            textField: '',
            //textField: 'Space shuttles and returning Boomerangs – both require a mastery of aerodynamics to fly. This Boomerang was flown with Dr Thomas aboard space shuttle Endeavour in 1996. It has been in South Australian Museum’s collection since FG Waterhouse, Dr Thomas’s great-great-grandfather, was the museum’s curator.  ',
            align: 'left',
            width: 550,
            letterSpacing: 0.5,
            lineHeight: 35
        }

        this.camera = camera;

        this.camera.add(this.pivotObject);

        this.textObject = new THREE.Object3D();

        
        this.savedRotation = new THREE.Quaternion();
        //this.savedRotation.copy(this.camera.rotation);
        
        this.createText(renderer);
    }

    createText(renderer) {
        const thisObj = this;
        const textScalar = 0.001;

        loadFont('../assets/fonts/Arial.fnt', function(err, font) {
            // create a geometry of packed bitmap glyphs, 
            // word wrapped to 300px and right-aligned
            var geometry = createGeometry({
                width: 300,
                font: font
            })
            
            // change text and other options as desired
            // the options sepcified in constructor will
            // be used as defaults
            geometry.update({ 
                text: thisObj.textParams.textField, 
                align: thisObj.textParams.align, 
                width: thisObj.textParams.width,
                letterSpacing: thisObj.textParams.letterSpacing, 
                lineHeight: thisObj.textParams.lineHeight});

            
            // the texture atlas containing our glyphs
            var textureLoader = new THREE.TextureLoader();
            textureLoader.load('../assets/fonts/Arial.png', function (texture) {
    
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearMipmapLinearFilter
        
                var textMaterial = new THREE.RawShaderMaterial(Shader({
                    alphaTest: 0.46,
                    color: 'rgb(255, 255, 255)',
                    depthTest: false,
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true
                }));
        
                // now do something with our mesh!
                thisObj.textObject = new THREE.Mesh(geometry, textMaterial);
                thisObj.textObject.scale.set(textScalar, -textScalar, textScalar);

                // center text around pivot
                var center = new THREE.Vector3();
                geometry.computeBoundingBox();
                geometry.boundingBox.getCenter(center);

                center.multiplyScalar(textScalar);

                thisObj.textObject.position.x = -center.x;
                thisObj.textObject.position.y = center.y - 0.3;

                thisObj.pivotObject.position.z = -0.8;
                
                thisObj.pivotObject.add(thisObj.textObject);
            });
        });
    }

    updateText() {
        const textScalar = 0.001;

        this.textObject.geometry.update({ 
            text: this.textParams.textField, 
            align: this.textParams.align, 
            width: this.textParams.width, 
            letterSpacing: this.textParams.letterSpacing, 
            lineHeight: this.textParams.lineHeight 
        });

        // center text around pivot
        var center = new THREE.Vector3();
        this.textObject.geometry.computeBoundingBox();
        this.textObject.geometry.boundingBox.getCenter(center);

        center.multiplyScalar(textScalar);

        this.textObject.position.x = -center.x;
        this.textObject.position.y = center.y - 0.3;
    }

    changeText(newString) {
        this.textParams.textField = newString;
        this.updateText();
    }

    update() {
        var frameRotation = this.savedRotation.multiply(this.camera.quaternion.clone().invert());

        frameRotation.x *= 1;
        frameRotation.y *= 1;
        frameRotation.z *= 1;
        frameRotation.w *= 1;
        
        const target = new THREE.Quaternion(0,0,0,1);

        var currentAngle = this.pivotObject.quaternion.angleTo(target);

        //this.pivotObject.quaternion.multiply(frameRotation);

        var angle = this.pivotObject.quaternion.angleTo(target);

        if ( angle > maxAngle )
        {
            this.pivotObject.quaternion.copy(target.rotateTowards(this.pivotObject.quaternion, maxAngle));
        }
        
        this.savedRotation.copy(this.camera.quaternion);
    }

    setPivot(newPos) {
        //this.pivotObject.position.copy(newPos);
    }

    setRotation(euler) {
        //this.pivotObject.setRotationFromEuler(euler);
    }
}

export { OrbitGui };