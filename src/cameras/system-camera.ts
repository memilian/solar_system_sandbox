import { AbstractMesh, ArcRotateCamera, Scalar, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { Game } from '../game';

export class SystemCamera extends ArcRotateCamera {
	cameraSmoothTime: number = 750;
	private interpolateTarget: (() => void) | null;
	private minRadius = 1.0;

	constructor(
		name: string,
		alpha: number,
		beta: number,
		radius: number,
		target: Vector3,
		scene: Scene,
		game: Game,
		setActiveOnSceneIfNoneActive?: boolean
	) {
		super(name, alpha, beta, radius, target, scene, setActiveOnSceneIfNoneActive);
		this.allowUpsideDown = false;
		this.noRotationConstraint = false;
		game.selectionManager.selectionChanged$.add((body) => {
			this.minRadius = Math.max(this.minZ * 1.2, body.gameRadius * 1.2);
		});
	}

	update() {
		if (this.interpolateTarget) this.interpolateTarget();
		if (this.radius < this.minRadius || this.radius - this.inertialRadiusOffset < this.minRadius) {
			this.radius = this.minRadius;
			this.inertialRadiusOffset = 0;
		}

		super.update();
	}

	goToTarget(target: AbstractMesh, radiusMultiplier: number, track = true) {
		const startTime = Date.now();
		const startingRadius = this.radius;
		const targetRadius = target.getBoundingInfo().boundingSphere.radius * radiusMultiplier;
		const globPos = this.globalPosition.clone();
		if (this.parent) {
			if (target.parent?.parent === this.parent) return;
			this.target.copyFrom((this.parent as TransformNode).absolutePosition);
			this.parent = null;
		}
		this.position.copyFrom(globPos);
		this.interpolateTarget = () => {
			const amount = (Date.now() - startTime) / this.cameraSmoothTime;
			Vector3.LerpToRef(this.target, target.absolutePosition, amount, this.target);
			this.radius = Scalar.Lerp(startingRadius, targetRadius, amount);
			if (amount > 1) {
				if (track) {
					const newPos = target.absolutePosition.subtract(this.position);
					this.parent = target.parent?.parent ?? null;
					this.position.copyFrom(newPos);
					this.radius = targetRadius;
					this.target.setAll(0);
				}
				this.interpolateTarget = null;
			}
		};
	}
}
