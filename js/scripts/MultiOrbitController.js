import { Object3D } from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { MathUtils } from 'https://unpkg.com/three@0.126.1/src/math/MathUtils.js'

const LengthTime = 0.7;

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

    setNewTarget( newTarget ) {
        if (newTarget.equals( this.orbitControls.target ) ) return;

        // set new target
        this.orbitControls.target = newTarget.clone();
        
        // orbit temporary object and track camera to that
        this.tempObject.position.copy(this.orbitor.position);
        this.orbitControls.object = this.tempObject;

        // setup variables for movement
        this.orbitControls.enableZoom = false;
        this.needsUpdate = true;
        this.totalTime = 0.0;
        this.savedRotation = this.orbitor.quaternion.clone();
        this.savedDistance = this.orbitor.position.distanceTo(newTarget);
    }

    update(deltaTime) {

        if (this.needsUpdate)
        {
            this.totalTime += deltaTime;

            const alpha = MathUtils.smoothstep(this.totalTime, 0.0, LengthTime);

            // check if transformation is complete
            if ( this.totalTime>LengthTime )
            {
                // restore variables
                this.orbitControls.object = this.orbitor;
                this.needsUpdate = false;
                this.orbitControls.enableZoom = true;
                return;
            }

            // direction from orbitor to target
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

            // convert linear range to inverse power
            const invAlpha = 1 - alpha;

            // set rotation
            var slerp = this.savedRotation.clone().slerp( this.tempObject.quaternion, 1-(invAlpha*invAlpha) );
            this.orbitor.setRotationFromQuaternion(slerp);
        }

        this.orbitControls.update();
    }
}

export { MultiOrbitController };