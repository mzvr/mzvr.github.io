import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

class InteractionManager {
    constructor( refMultiOrbitController, refCameraRaycaster, refOrbitGui ) {

        this.multiOrbitController = refMultiOrbitController;
        this.cameraRaycaster = refCameraRaycaster;
        this.orbitGui = refOrbitGui;

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
    
        // guess if intentional click (small distance between click and release)
        if ( dist < 0.05 )
        {
            const intersects = this.cameraRaycaster.doRaycast( releasePos );

            // end early if possible
            if ( intersects.length == 0 ) return

            const clickedObject = intersects[0].object;
        
            this.multiOrbitController.setNewTarget(clickedObject.position);
            this.orbitGui.setPivot(clickedObject.position)
        }
    }

    update(deltaTime) {
        this.multiOrbitController.update(deltaTime);
        this.orbitGui.setRotation(this.multiOrbitController.orbitor.rotation);
    }
}

export { InteractionManager };