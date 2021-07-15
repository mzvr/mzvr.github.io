import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { createGeometry, loadFont, Shader } from './bmfont-text.js';

const maxAngle = 25 * Math.PI / 180;

class OrbitGui {
    constructor(camera, renderer) {
        this.pivotObject = new THREE.Object3D();
        this.pivotObject.name = "pivotObject";

        this.textParams = {
            textField: '',
            titleField: '',
            align: 'left',
            width: 700,
            letterSpacing: -1,
            lineHeight: 37
        }

        this.titleParams = {
            textField: '',
            titleField: '',
            align: 'left',
            width: 700,
            letterSpacing: -0.3,
            lineHeight: 55
        }

        this.camera = camera;

        this.camera.add(this.pivotObject);

        this.pivotObject.position.z = -0.8;
        this.pivotObject.position.y = -0.15;

        this.textObject = new THREE.Object3D();
        this.titleObject = new THREE.Object3D();

        
        this.savedRotation = new THREE.Quaternion();
        //this.savedRotation.copy(this.camera.rotation);
        
        this.createText(renderer);

        this.box = new THREE.Box3();
    }

    createText(renderer) {
        const thisObj = this;
        const textScalar = 0.001;

        loadFont('../assets/fonts/opensansSBoldsz36.fnt', function(err, font) {
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
                lineHeight: thisObj.textParams.lineHeight
            });

            
            // the texture atlas containing our glyphs
            var textureLoader = new THREE.TextureLoader();
            textureLoader.load('../assets/fonts/opensansSBoldsz36.png', function (texture) {
    
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearMipmapLinearFilter
        
                const textMaterial = new THREE.RawShaderMaterial(Shader({
                    alphaTest: 0.46,
                    color: 'rgb(255, 255, 255)',
                    opacity: 1.0,
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
                thisObj.textObject.position.y = center.y * 0.5 - 0.3;
                
                thisObj.pivotObject.add(thisObj.textObject);
            });
        });

        loadFont('../assets/fonts/opensansEBoldsz50.fnt', function(err, font) {
            // create a geometry of packed bitmap glyphs, 
            // word wrapped to 300px and right-aligned
            var geometryTitle = createGeometry({
                width: 300,
                font: font
            })
            
            // change text and other options as desired
            // the options sepcified in constructor will
            // be used as defaults

            geometryTitle.update({ 
                text: thisObj.textParams.titleField, 
                align: thisObj.textParams.align, 
                width: thisObj.textParams.width,
                letterSpacing: thisObj.textParams.letterSpacing, 
                lineHeight: thisObj.textParams.lineHeight
            });

            
            // the texture atlas containing our glyphs
            var textureLoader = new THREE.TextureLoader();
            textureLoader.load('../assets/fonts/opensansEBoldsz50.png', function (texture) {
    
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearMipmapLinearFilter
        
                const textMaterial = new THREE.RawShaderMaterial(Shader({
                    alphaTest: 0.46,
                    color: 'rgb(255, 255, 255)',
                    opacity: 1.0,
                    depthTest: false,
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true
                }));

                thisObj.titleObject = new THREE.Mesh(geometryTitle, textMaterial);
                thisObj.titleObject.scale.set(textScalar, -textScalar, textScalar);

                // center text around pivot
                var centerTitle = new THREE.Vector3();
                geometryTitle.computeBoundingBox();
                geometryTitle.boundingBox.getCenter(centerTitle);

                centerTitle.multiplyScalar(textScalar);

                thisObj.titleObject.position.x = -centerTitle.x;
                thisObj.titleObject.position.y = centerTitle.y - 0.3;
                
                thisObj.pivotObject.add(thisObj.titleObject);
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
        this.textObject.position.y = center.y * 2;

        this.titleObject.geometry.update({ 
            text: this.titleParams.titleField, 
            align: this.titleParams.align, 
            width: this.titleParams.width, 
            letterSpacing: this.titleParams.letterSpacing, 
            lineHeight: this.titleParams.lineHeight 
        });

        // center text around pivot
        var centerTitle = new THREE.Vector3();
        this.titleObject.geometry.computeBoundingBox();
        this.titleObject.geometry.boundingBox.getCenter(centerTitle);

        centerTitle.multiplyScalar(textScalar);

        this.titleObject.position.x = center.x > 0.1 ? -center.x : -centerTitle.x;
        this.titleObject.position.y = 0.04;

    }

    changeText(desc="", title="") {
        this.textParams.textField = desc;
        this.titleParams.titleField = title;
        this.updateText();
    }

    update(totalTime) {
        //var frameRotation = this.savedRotation.multiply(this.camera.quaternion.clone().invert());

        //frameRotation.x *= 1;
        //frameRotation.y *= 1;
        //frameRotation.z *= 1;
        //frameRotation.w *= 1;
        
        //const target = new THREE.Quaternion(0,0,0,1);

        //var currentAngle = this.pivotObject.quaternion.angleTo(target);

        //this.pivotObject.quaternion.multiply(frameRotation);

        //var angle = this.pivotObject.quaternion.angleTo(target);

        //if ( angle > maxAngle )
        //{
        //    this.pivotObject.quaternion.copy(target.rotateTowards(this.pivotObject.quaternion, maxAngle));
        //}
        
        //this.savedRotation.copy(this.camera.quaternion);
    }

    setPivot(newPos) {
        //this.pivotObject.position.copy(newPos);
    }

    setRotation(euler) {
        //this.pivotObject.setRotationFromEuler(euler);
    }
}

export { OrbitGui };