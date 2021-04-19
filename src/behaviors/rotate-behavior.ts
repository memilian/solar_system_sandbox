import { Axis, Behavior, EventState, Mesh, Observer, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { Game } from '../game';
import { CelestialBody } from '../model/celestial-body';

export class RotateBehavior implements Behavior<Mesh> {
	name: string = 'OrbitBehavior';
	target: TransformNode;
	scene: Scene;
	observer: Observer<Scene>;
	up = new Vector3();

	constructor(private readonly body: CelestialBody) {}

	init(): void {}

	attach(target: TransformNode): void {
		this.target = target;
		this.scene = target.getScene();
		this.observer = this.scene.onBeforeRenderObservable.add(this.update)!;
		this.observer.scope = this;
		target.rotation.z = this.body.axialTilt;
	}

	detach(): void {
		this.observer.unregisterOnNextCall = true;
	}

	update(evtData: Scene, evtState: EventState) {
		this.target.rotate(Axis.Y, (Game.simDeltaTime / this.body.revolutionPeriod) * Math.PI * 2);
	}
}
