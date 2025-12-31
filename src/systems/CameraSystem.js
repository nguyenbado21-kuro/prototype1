/**
 * Isometric Camera System - Third-person hack-and-slash perspective
 */
export class CameraSystem {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        // Isometric camera configuration
        this.config = {
            // Camera offset from target
            offset: {
                x: 8,   // Behind and to the side
                y: 12,  // Above the target
                z: 8    // Behind the target
            },
            
            // Camera behavior
            followSpeed: 0.1,        // How quickly camera follows (0-1)
            lookAtOffset: 0.5,       // Look slightly above target center    // For manual camera rotation
            
            // Zoom settings
            minDistance: 6,
            maxDistance: 15,
            currentDistance: 10,
            zoomSpeed: 0.5,
            
            // Shake settings
            shakeIntensity: 0,
            shakeDuration: 0,
            shakeDecay: 0.25
        };
        
        // Camera state
        this.currentOffset = { ...this.config.offset };
        this.shakeOffset = { x: 0, y: 0, z: 0 };
        this.manualRotation = 0; // For optional camera rotation
        
        this.setupInitialPosition();
    }

    setupInitialPosition() {
        // Set initial camera position
        this.camera.position.set(
            this.config.offset.x,
            this.config.offset.y,
            this.config.offset.z
        );
        
        // Set initial look direction
        this.camera.lookAt(0, this.config.lookAtOffset, 0);
        
        // Configure camera for isometric view
        this.camera.fov = 45; // Narrower FOV for less distortion
        this.camera.updateProjectionMatrix();
    }

    update(deltaTime) {
        if (!this.target) return;
        
        // Update camera shake
        this.updateCameraShake(deltaTime);
        
        // Calculate target position with current offset and shake
        const targetPosition = this.calculateTargetPosition();
        
        // Smoothly move camera to target position
        this.camera.position.lerp(targetPosition, this.config.followSpeed);
        
        // Update look-at target
        this.updateLookAt();
    }

    calculateTargetPosition() {
        const rotatedOffset = this.rotateOffset(this.currentOffset, this.manualRotation);
        
        return new THREE.Vector3(
            this.target.position.x + rotatedOffset.x + this.shakeOffset.x,
            rotatedOffset.y + this.shakeOffset.y,
            this.target.position.z + rotatedOffset.z + this.shakeOffset.z
        );
    }

    rotateOffset(offset, rotation) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        return {
            x: offset.x * cos - offset.z * sin,
            y: offset.y,
            z: offset.x * sin + offset.z * cos
        };
    }

    updateLookAt() {
        const lookAtTarget = new THREE.Vector3(
            this.target.position.x,
            this.target.position.y + this.config.lookAtOffset,
            this.target.position.z
        );
        
        this.camera.lookAt(lookAtTarget);
    }

    updateCameraShake(deltaTime) {
        if (this.config.shakeDuration > 0) {
            // Generate random shake offset
            this.shakeOffset.x = (Math.random() - 0.5) * this.config.shakeIntensity;
            this.shakeOffset.y = (Math.random() - 0.5) * this.config.shakeIntensity;
            this.shakeOffset.z = (Math.random() - 0.5) * this.config.shakeIntensity;
            
            // Decay shake over time
            this.config.shakeDuration -= deltaTime;
            this.config.shakeIntensity *= this.config.shakeDecay;
            
            if (this.config.shakeDuration <= 0) {
                this.stopShake();
            }
        }
    }

    // Camera control methods
    shake(intensity = 0.5, duration = 300) {
        this.config.shakeIntensity = intensity;
        this.config.shakeDuration = duration;
    }

    zoom(delta) {
        const newDistance = this.config.currentDistance + delta * this.config.zoomSpeed;
        this.config.currentDistance = Math.max(
            this.config.minDistance,
            Math.min(this.config.maxDistance, newDistance)
        );
        
        // Adjust camera offset based on zoom
        const zoomFactor = this.config.currentDistance / 10; // 10 is base distance
        this.currentOffset = {
            x: this.config.offset.x * zoomFactor,
            y: this.config.offset.y * zoomFactor,
            z: this.config.offset.z * zoomFactor
        };
    }

    rotate(angle) {
        this.manualRotation += angle * this.config.rotationSpeed;
    }

    stopShake() {
        this.config.shakeIntensity = 0;
        this.config.shakeDuration = 0;
        this.shakeOffset = { x: 0, y: 0, z: 0 };
    }

    // Get camera-relative movement directions for input
    getCameraRelativeDirections() {
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Remove vertical component
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        cameraRight.normalize();
        
        return {
            forward: cameraDirection.clone().negate(), // Negate for correct direction
            right: cameraRight,
            back: cameraDirection,
            left: cameraRight.clone().negate()
        };
    }

    // Convert screen coordinates to world coordinates for mouse targeting
    screenToWorld(screenX, screenY, targetY = 0) {
        const mouse = new THREE.Vector2();
        mouse.x = (screenX / window.innerWidth) * 2 - 1;
        mouse.y = -(screenY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Create a plane at the target Y level
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -targetY);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            return intersection;
        }
        
        return null;
    }

    // Set camera target
    setTarget(newTarget) {
        this.target = newTarget;
    }

    // Reset camera to default position
    reset() {
        this.currentOffset = { ...this.config.offset };
        this.manualRotation = 0;
        this.config.currentDistance = 10;
        this.stopShake();
    }

    // Get current camera configuration for debugging
    getDebugInfo() {
        return {
            position: this.camera.position,
            target: this.target?.position,
            offset: this.currentOffset,
            rotation: this.manualRotation,
            distance: this.config.currentDistance,
            shaking: this.config.shakeDuration > 0
        };
    }
}