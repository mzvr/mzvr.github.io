import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';


class InteractionManager {
    constructor( MultiOrbitController, CameraRaycaster ) {

        this.multiOrbitController = MultiOrbitController;
        this.cameraRaycaster = CameraRaycaster;

        this.clickPos = new THREE.Vector2();

        document.addEventListener( 'pointerdown', this.onPointerDown );
        document.addEventListener( 'pointerup', this.onPointerUp );

    }
    
    onPointerDown = ( event ) => {
        
        // save screen pos of click
        this.clickPos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.clickPos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    }

    onPointerUp = ( event ) => {
    
        // find distance between click and release
        let releasePos = new THREE.Vector2();
        releasePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        releasePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        let dist = releasePos.distanceTo(this.clickPos);
    
        // guess if intentional click
        if ( dist < 0.05 )
        {
            const intersects = this.cameraRaycaster.doRaycast( releasePos );

            if ( intersects.length > 0 ) {

                const clickedObject = intersects[0].object;
            
                this.multiOrbitController.setNewTarget(clickedObject.position);
        
                // set color
                //scene.background = new THREE.Color(clickedObject.name);
                //scene.background.convertSRGBToLinear();
            }
        }
    }

    update(deltaTime) {
        this.multiOrbitController.update(deltaTime);
    }
}

export { InteractionManager };