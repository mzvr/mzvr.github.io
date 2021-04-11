import { Raycaster } from 'https://unpkg.com/three@0.126.1/build/three.module.js';

class CameraRaycaster {

    constructor( camera, objectsArray ) {

        // setup 
        if (camera == null)
        {
            console.error('Raycaster requires constructor be passed a camera')
        }

        this.camera = camera;

        this.objectsArray = objectsArray;

        this.raycaster = new Raycaster();

        document.addEventListener( 'pointerdown', this.onPointerDown );
        document.addEventListener( 'pointerup', this.onPointerUp );

    }

    // returns resulting intersections of a screen raycast
    doRaycast( screenPos ) {
        if (Array.isArray(this.objectsArray) && this.objectsArray.length) {
            this.raycaster.setFromCamera( screenPos, this.camera );
            return this.raycaster.intersectObjects( this.objectsArray );
        }
    }

}

export { CameraRaycaster };