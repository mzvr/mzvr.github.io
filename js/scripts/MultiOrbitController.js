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
        this.zoomDistance = 2;
    }

    setNewTarget( newTarget ) {
        
        // pause orbit controls till camera is updated
        this.orbitControls.active = false;

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
        var rotation = this.orbitor.quaternion.clone();

        this.orbitor.lookAt(this.orbitControls.target);

        const distance = rotation.angleTo(this.orbitor.quaternion);

        rotation.rotateTowards(this.orbitor.quaternion, 0.01);
        
        this.orbitor.setRotationFromQuaternion(rotation);

        return distance-0.0005<0;
    }

    updateZoom() {
        var orbitPos = this.orbitControls.target.clone().sub(this.orbitor.position);
        orbitPos.normalize();
        orbitPos.multiplyScalar(-this.zoomDistance);
        orbitPos.add(this.orbitControls.target);

        if (this.orbitor.position.distanceToSquared(orbitPos) < stepSize*stepSize)
        {
            this.orbitor.position.copy(orbitPos);
            return true;
        }

        this.moveTowards(this.orbitor.position, orbitPos, stepSize);

        return false;
    }

    update() {
        if (this.needsUpdate)
        {
            const finishedTurn = this.updateLookAt();
            const finishedMove = this.updateZoom()

            const finished = finishedMove && finishedTurn;

            if (finished) {
                this.needsUpdate = false;
                this.orbitControls.active = true;
            }
        }
    }
}

export { MultiOrbitController };