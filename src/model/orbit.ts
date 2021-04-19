import { Mesh } from "@babylonjs/core";

export interface Orbit {
	/** Orbit deviation from perfect circle */
	eccentricity: number;
	/** Largest ellipse radius (au) */
	semiMajorAxis: number;
	/** Angle to the reference plane (radian) */
	inclination: number;
	/** Angle to the point where the orbit intersect the reference plane (radian) */
	ascendingNode: number;
	/** Angle from the ascending node to the periapsis (radian) */
	periapsisArg: number;
	/** Starting angle from periapsis (radian) */
	meanAnomalyAtEpoch: number;
	/** Current angle from periapsis (radian) */
	trueAnomaly: number;
	/** Period of a full revolution (day) */
	period: number;
	/** Name of the orbited body */
	orbitingBody: string;
	/** Radius of the sphere of influence */
	soiRadius: number;
}
