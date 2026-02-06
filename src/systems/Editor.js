import * as THREE from 'three';

export class Editor {
    constructor(scene, camera, renderer, playerControls, museum) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.playerControls = playerControls;
        this.museum = museum;

        this.enabled = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObject = null;

        // Dragging state
        this.isDragging = false;
        this.dragAxis = null;
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
        this.dragIntersection = new THREE.Vector3();

        this.setupCustomGizmo();
        this.setupInput();
    }

    setupCustomGizmo() {
        this.gizmo = new THREE.Group();
        this.gizmo.visible = false;

        const arrowLength = 2;
        const arrowColor = {
            x: 0xff0000,
            y: 0x00ff00,
            z: 0x0000ff
        };

        this.arrows = {
            x: new THREE.ArrowHelper(
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 0, 0),
                arrowLength,
                arrowColor.x,
                0.5,
                0.3
            ),
            y: new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 0),
                arrowLength,
                arrowColor.y,
                0.5,
                0.3
            ),
            z: new THREE.ArrowHelper(
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, 0),
                arrowLength,
                arrowColor.z,
                0.5,
                0.3
            )
        };

        this.arrows.x.userData.axis = 'x';
        this.arrows.y.userData.axis = 'y';
        this.arrows.z.userData.axis = 'z';

        this.gizmo.add(this.arrows.x);
        this.gizmo.add(this.arrows.y);
        this.gizmo.add(this.arrows.z);

        this.gizmo.traverse((child) => {
            if (child.material) {
                child.material.depthTest = false;
                child.renderOrder = 999;
            }
        });

        this.scene.add(this.gizmo);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onKeyDown(e) {
        if (e.code === 'Backquote') {
            this.toggle();
        }

        if (!this.enabled) return;

        if (e.key === 'e' && e.shiftKey) {
            this.exportConfig();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        console.log(`Dev Mode: ${this.enabled ? 'ON' : 'OFF'}`);

        if (this.enabled) {
            document.exitPointerLock();
            this.playerControls.enabled = false;
        } else {
            document.body.requestPointerLock();
            this.playerControls.enabled = true;
            this.deselectObject();
        }
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onPointerDown(e) {
        if (!this.enabled) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // First check if clicking on an arrow
        if (this.selectedObject && this.gizmo.visible) {
            const arrowObjects = [];
            this.gizmo.traverse((child) => {
                if (child.isMesh || child.isLine) {
                    arrowObjects.push(child);
                }
            });

            const arrowIntersects = this.raycaster.intersectObjects(arrowObjects, false);
            if (arrowIntersects.length > 0) {
                let clickedArrow = arrowIntersects[0].object;
                while (clickedArrow.parent && !clickedArrow.userData.axis) {
                    clickedArrow = clickedArrow.parent;
                }

                if (clickedArrow.userData.axis) {
                    this.startDrag(clickedArrow.userData.axis);
                    return;
                }
            }
        }

        // Otherwise check for object selection
        const displayMeshes = [];
        this.museum.displays.forEach(display => {
            if (display.mesh) displayMeshes.push(display.mesh);
        });

        const intersects = this.raycaster.intersectObjects(displayMeshes, false);

        if (intersects.length > 0) {
            this.selectObject(intersects[0].object);
        } else {
            this.deselectObject();
        }
    }

    startDrag(axis) {
        this.isDragging = true;
        this.dragAxis = axis;

        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        this.dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, this.selectedObject.position);

        console.log(`Dragging along ${axis} axis`);
    }

    onPointerMove(e) {
        if (!this.isDragging || !this.selectedObject) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
            const delta = this.dragIntersection.clone().sub(this.selectedObject.position);

            if (this.dragAxis === 'x') {
                this.selectedObject.position.x += delta.x;
            } else if (this.dragAxis === 'y') {
                this.selectedObject.position.y += delta.y;
            } else if (this.dragAxis === 'z') {
                this.selectedObject.position.z += delta.z;
            }
        }
    }

    onPointerUp(e) {
        if (this.isDragging) {
            console.log('Drag ended. New position:', this.selectedObject.position);
        }
        this.isDragging = false;
        this.dragAxis = null;
    }

    selectObject(object) {
        this.selectedObject = object;
        this.gizmo.position.copy(object.position);
        this.gizmo.visible = true;

        console.log('Selected:', object);
    }

    deselectObject() {
        this.selectedObject = null;
        this.gizmo.visible = false;
        this.isDragging = false;
    }

    exportConfig() {
        const config = [];
        this.museum.displays.forEach((display, id) => {
            const { x, y, z } = display.mesh.position;

            config.push({
                id: id,
                x: parseFloat(x.toFixed(2)),
                z: parseFloat(z.toFixed(2)),
            });
        });

        const exportString = `export const DISPLAYS = ${JSON.stringify(config, null, 2)};`;
        console.log('%c Exported Config:', 'color: #00ff00; font-weight: bold;', exportString);
        alert('Config exported to Console! (Press F12)');
    }

    update() {
        if (this.selectedObject && this.gizmo.visible && !this.isDragging) {
            this.gizmo.position.copy(this.selectedObject.position);
        }
    }
}
