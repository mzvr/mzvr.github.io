import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { createGeometry, loadFont, Shader } from './bmfont-text.js';

const maxAngle = 25 * Math.PI / 180;

class OrbitGui {
    constructor(camera, renderer) {
        this.pivotObject = new THREE.Object3D();

        this.textParams = {
            textField: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam mattis lacus lorem. Nullam non justo odio. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ipsum sem, venenatis sed pellentesque ut, pretium vitae turpis. Proin ullamcorper felis eu felis tincidunt, ac convallis lorem dignissim. Morbi a tempus turpis. Sed vulputate odio a eros interdum, ac consectetur odio vestibulum. Donec eu egestas dui.',
            align: 'left',
            width: 300,
            letterSpacing: 0,
            lineHeight: 30
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
                lineHeight: thisObj.textParams.lineHeight });

            
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

                thisObj.textObject.translateX(-center.x);
                thisObj.textObject.translateY(center.y);

                thisObj.pivotObject.position.z = -1;
                thisObj.pivotObject.add(thisObj.textObject)
            });
        });
    }

    updateText() {
        this.textObject.geometry.update({ 
            text: this.textParams.textField, 
            align: this.textParams.align, 
            width: this.textParams.width, 
            letterSpacing: this.textParams.letterSpacing, 
            lineHeight: this.textParams.lineHeight });
    }

    update() {
        var frameRotation = this.savedRotation.multiply(this.camera.quaternion.clone().invert());

        frameRotation.x *= 1;
        frameRotation.y *= 1;
        frameRotation.z *= 1;
        frameRotation.w *= 1;
        
        const target = new THREE.Quaternion(0,0,0,1);

        var currentAngle = this.pivotObject.quaternion.angleTo(target);

        this.pivotObject.quaternion.multiply(frameRotation);

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