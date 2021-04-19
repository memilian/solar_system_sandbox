import { Behavior, EventState, Mesh, Nullable, Observer, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { ORBIT_SCALE } from '../constants';
import { Game } from '../game';
import { CelestialBody } from '../model/celestial-body';
import { Orbit } from '../model/orbit';

const sin = Math.sin;
const cos = Math.cos;
const abs = Math.abs;
const atan2 = Math.atan2;
const sqrt = Math.sqrt;

export class OrbitBehavior implements Behavior<Mesh> {
	name: string = 'OrbitBehavior';
	target: TransformNode;
	scene: Scene;
	observer: Observer<Scene>;
	scale = 1.0;

	constructor(private readonly orbit: Orbit, private readonly parent: Nullable<CelestialBody>) {}

	init(): void {
		if (this.parent) {
			this.scale = this.parent.gameRadius * 1.5 + 10 * this.orbit.semiMajorAxis * ORBIT_SCALE;
		}
	}

	attach(target: TransformNode): void {
		this.target = target;
		this.scene = target.getScene();
		this.observer = this.scene.onBeforeRenderObservable.add(this.update)!;
		this.observer.scope = this;

		//TODO compute true anomaly
	}

	detach(): void {
		this.observer.unregisterOnNextCall = true;
	}

	update(evtData: Scene, evtState: EventState) {
		this.computePosition(this.orbit, Game.simTime, this.target.position);
		if (this.parent) {
			this.target.position.normalize().scaleInPlace(this.scale);
		}
	}

	getOrbitPoints(stepCount: number): Vector3[] {
		if (!stepCount) throw new Error('illegal argument: stepCount');
		const points: Vector3[] = [];
		const dt = this.orbit.period / stepCount;
		for (let i = 0; i <= stepCount; i++) {
			if (this.parent) {
				points.push(
					this.computePosition(this.orbit, dt * i)
						.normalize()
						.scaleInPlace(this.scale)
				);
			} else {
				points.push(this.computePosition(this.orbit, dt * i));
			}
		}
		return points;
	}

	/**
	 * Resources :
	 * https://stjarnhimlen.se/comp/ppcomp.html#6
	 */
	solveEccentricAnomaly(ecc: number, M: number): number {
		if (ecc >= 0.98) {
			console.error('Cannot solve eccentric anomaly for eccentricity >= 0.98');
			// If needed implement https://stjarnhimlen.se/comp/ppcomp.html#19
			return 0;
		}
		var e1 = M + ecc * sin(M) * (1.0 + ecc * cos(M));
		if (ecc < 0.05) {
			return e1;
		}
		var e0: number;
		do {
			e0 = e1;
			e1 = e0 - (e0 - ecc * sin(e0) - M) / (1 - ecc * cos(e0));
		} while (abs(e0 - e1) > 0.001);
		return e0;
	}

	computeDistanceAndTrueAnomaly(orbit: Orbit, meanAnomaly: number): [number, number] {
		let eccentricAnomaly = this.solveEccentricAnomaly(orbit.eccentricity, meanAnomaly);
		let xv = orbit.semiMajorAxis * (cos(eccentricAnomaly) - orbit.eccentricity);
		let yv = orbit.semiMajorAxis * (sqrt(1 - orbit.eccentricity * orbit.eccentricity) * sin(eccentricAnomaly));

		let trueAnomaly = atan2(yv, xv);
		let distance = sqrt(xv * xv + yv * yv);
		return [trueAnomaly, distance];
	}

	computePosition(orbit: Orbit, time: number, targetRef?: Vector3) {
		let meanAnomaly =
			Math.floor(1000000 * (orbit.meanAnomalyAtEpoch + (2 * Math.PI * time) / orbit.period)) / 1000000;
		let [trueAnomaly, distance] = this.computeDistanceAndTrueAnomaly(orbit, meanAnomaly);
		targetRef = targetRef ?? new Vector3();
		targetRef.x =
			distance *
			(cos(orbit.ascendingNode) * cos(trueAnomaly + orbit.periapsisArg) -
				sin(orbit.ascendingNode) * sin(trueAnomaly + orbit.periapsisArg) * cos(orbit.inclination));
		targetRef.z =
			distance *
			(sin(orbit.ascendingNode) * cos(trueAnomaly + orbit.periapsisArg) +
				cos(orbit.ascendingNode) * sin(trueAnomaly + orbit.periapsisArg) * cos(orbit.inclination));
		targetRef.y = distance * (sin(trueAnomaly + orbit.periapsisArg) * sin(orbit.inclination));

		return targetRef.scaleInPlace(ORBIT_SCALE);
	}
}
