import { Object3D } from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { MathUtils } from 'https://unpkg.com/three@0.126.1/src/math/MathUtils.js'

const LengthTime = 1.7;

class MultiOrbitController {

    constructor( object, orbitController, zoom=0.5 ) {

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

        // variables
        this.tempObject = new Object3D();
        this.needsUpdate = false;
        this.zoomDistance = zoom;
    }

    // sets new position in world space to orbit around
    setNewTarget( newTarget, zoom=this.zoomDistance ) 
    {
        if (newTarget.equals(this.orbitControls.target)) return;

        // set new target
        this.orbitControls.target = newTarget.clone();
        
        var path = this.orbitor.position.clone().sub(this.orbitControls.target);
        var direction = path.clone().normalize();
        var targetPos = direction.multiplyScalar(this.zoomDistance).add(this.orbitControls.target);

        // orbit temporary object and track camera to that
        this.tempObject.position.copy(targetPos);
        this.orbitControls.object = this.tempObject;

        // setup variables for movement
        this.orbitControls.enableZoom = false;
        this.orbitControls.enablePan = false;
        this.orbitControls.enableRotate = false;
        

        this.needsUpdate = true;
        this.totalTime = 0.0;
        this.savedRotation = this.orbitor.quaternion.clone();
        this.savedDistance = this.orbitor.position.distanceTo(newTarget);
    }

    update(deltaTime) 
    {
        this.orbitControls.update();

        if (this.needsUpdate)
        {
            this.totalTime += deltaTime;

            // check if transformation is complete
            var complete = this.totalTime > LengthTime;
            var percentageComplete = complete ? 1.0 : this.totalTime / LengthTime;

            const alpha = MathUtils.smoothstep(percentageComplete, 0.0, 1.0);
            const alpha2 = MathUtils.smoothstep(1 - ((1-percentageComplete) * (1-percentageComplete)), 0.0, 1.0);

            //this.orbitControls.dampingFactor = 1-alpha2;

            // direction from target to orbitor
            const path = this.orbitControls.object.position.clone().sub(this.orbitControls.target);
            const direction = path.clone().normalize();

            // distance from target changes over time
            var length = MathUtils.lerp(this.savedDistance, this.zoomDistance, alpha);

            // set location of orbit
            const orbitOffset = direction.clone().multiplyScalar(length);
            const orbitPos = orbitOffset.add(this.orbitControls.target);
            this.orbitor.position.copy(orbitPos);

            // inverted position of lookat object
            // for some reason its set backwards
            var invObj = this.tempObject.position.clone().sub(this.orbitControls.target).add(this.tempObject.position);
            this.tempObject.lookAt(invObj);

            // set rotation
            var slerp = this.savedRotation.clone().slerp(this.orbitControls.object.quaternion, alpha2);
            this.orbitor.setRotationFromQuaternion(slerp);

            // restore orbit controls and stop further updates
            if ( complete )
            {
                this.needsUpdate = false;

                // restore variables
                this.orbitControls.object = this.orbitor;
                this.orbitControls.enableZoom = true;
                this.orbitControls.enablePan = true;
                this.orbitControls.enableRotate = true;
            }
        }
    }
}

export { MultiOrbitController };