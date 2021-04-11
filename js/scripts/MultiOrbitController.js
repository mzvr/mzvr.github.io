import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

const stepSize = 0.01;

class MultiOrbitController {

    constructor( object, orbitController ) {

        // setup 
        if (object == null)
        {
            console.error('Constructor must be passed an object')
        }
        this.orbitor = object;

        // setup orbit controller
        if (orbitController == null)
        {
            console.error('Constructor must be passed an orbit controller')
        }
        this.orbitControls = orbitController;

        this.needsUpdate = true;
        this.zoomDistance = 0.5;
    }

    setNewTarget( newTarget ) {
        
        // pause orbit controls till camera is updated
        this.orbitControls.enabled = false;

        // save orbit offset
        //const offsetVector = this.orbitControls.object.position.sub(this.orbitControls.target);
         
        // set new target
        this.orbitControls.target = newTarget;

        // reapply offset
        //this.orbitControls.object.position.copy(this.orbitControls.target.clone().add(offsetVector));

        // update orbit 
        //this.orbitControls.update();

        //console.log(newTarget);

        this.needsUpdate = true;
    }

    moveTowards( from, to, step ) {
    
        // vector between positions
        var path = to.clone().sub(from);
    
        // scale remaining distance to allowed step size
        path.normalize();
        path.multiplyScalar(step);
    
        return from.add(path);
    }

    updateLookAt() {
        // from rotation
        var rotation = this.orbitor.quaternion.clone();

        // to rotaion
        this.orbitor.lookAt(this.orbitControls.target);

        // estimate distance left to cover
        if (rotation.angleTo(this.orbitor.quaternion) < 0.0005) {
            return true
        }

        // partial change
        rotation.rotateTowards(this.orbitor.quaternion, 0.01);
        this.orbitor.setRotationFromQuaternion(rotation);

        return false;
    }

    updateZoom() {
        // direction from orbitor to target
        const path = this.orbitControls.target.clone().sub(this.orbitor.position);
        const direction = path.clone().normalize();

        // location of orbit
        const orbitOffset = direction.clone().multiplyScalar(-this.zoomDistance);
        const orbitPos = orbitOffset.clone().add(this.orbitControls.target);

        // if movement can be done in one step
        if (this.orbitor.position.distanceToSquared(orbitPos) < stepSize*stepSize)
        {
            this.orbitor.position.copy(orbitPos);
            return true;
        }

        // else do part of movement-
        this.moveTowards(this.orbitor.position, orbitPos, stepSize);

        return false;
    }

    update(deltaTime) {
        if (this.needsUpdate)
        {
            const finishedTurn = this.updateLookAt();
            const finishedMove = this.updateZoom()

            const finished = finishedMove && finishedTurn;

            if (finished) {
                this.needsUpdate = false;
                this.orbitControls.enabled = true;
            }
        }
    }
}

export { MultiOrbitController };