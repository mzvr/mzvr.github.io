import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { MathUtils } from 'https://unpkg.com/three@0.126.1/src/math/MathUtils.js'


const stepSize = 0.01;
const LengthTime = 1.0;
let totalTime = 0.0;

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

        this.tempObject = new THREE.Object3D();

        this.needsUpdate = false;
        this.zoomDistance = 0.5;
    }

    setNewTarget( newTarget ) {
        
        // pause orbit controls till camera is updated
        //this.orbitControls.enabled = false;
        this.tempObject.position.copy(this.orbitor.position);
        this.orbitControls.object = this.tempObject;
        this.orbitControls.enableZoom = false;

        // save orbit offset
        //const offsetVector = this.orbitControls.object.position.sub(this.orbitControls.target);
         
        // set new target
        this.orbitControls.target = newTarget;

        // reapply offset
        //this.orbitControls.object.position.copy(this.orbitControls.target.clone().add(offsetVector));

        // update orbit 
        //this.orbitControls.update();
        
        this.needsUpdate = true;
        totalTime = 0.0;
        this.savedRotation = this.orbitor.quaternion.clone();
        this.savedPosition = this.orbitor.position.clone();
        this.savedDistance = this.orbitor.position.distanceTo(newTarget);
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

        // to rotaion ***stored in object3D***
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
            totalTime += deltaTime;
            
            const alpha = MathUtils.smootherstep(totalTime, 0.0, LengthTime);
            var alpha2 = MathUtils.smoothstep(totalTime, 0.0, LengthTime);

            if (totalTime>LengthTime)
            {
                //this.orbitControls.enabled = true;
                this.orbitControls.object = this.orbitor;
                this.needsUpdate = false;
                this.orbitControls.enableZoom = true;
                return;
            }

            // direction from orbitor to target
            //const path = this.orbitControls.target.clone().sub(this.orbitor.position);
            //const direction = path.clone().normalize();
            // location of orbit
            //const orbitOffset = direction.clone().multiplyScalar(-this.zoomDistance);
            //const orbitPos = orbitOffset.clone().add(this.orbitControls.target);

            // direction from orbitor to target
            const path = this.orbitControls.object.position.clone().sub(this.orbitControls.target);
            const direction = path.clone().normalize();

            var length = MathUtils.lerp(this.savedDistance, this.zoomDistance, alpha);
            // location of orbit
            const orbitOffset = direction.clone().multiplyScalar(length);
            const orbitPos = orbitOffset.clone().add(this.orbitControls.target);

            this.orbitor.position.copy(orbitPos);

            //this.orbitor.lookAt(this.orbitControls.target);

            var objOffset = this.tempObject.position.clone().sub(this.orbitControls.target).add(this.tempObject.position);

            this.tempObject.lookAt(objOffset);
            var slerp = this.savedRotation.clone().slerp(this.tempObject.quaternion, 1-((1-alpha2)*(1-alpha2)));
            this.orbitor.setRotationFromQuaternion(slerp);

            /*const finishedTurn = this.updateLookAt(alpha);
            const finishedMove = this.updateZoom(alpha)

            const finished = finishedMove && finishedTurn;

            if (finished) {
                this.needsUpdate = false;
                this.orbitControls.enabled = true;
            }*/
        }

        //this.orbitControls.update();
    }
}

export { MultiOrbitController };