import fs from 'fs';
import path from 'path';
import { Assets } from '../src/Assets';
import { DEG_TO_RAD, KM_TO_AU } from '../src/constants';
import { ICelestialBody } from '../src/model/celestial-body';

const data: Data = require('../data/solar-system-api.json');

const bodies: {
	bodies: ICelestialBody[];
} = {
	bodies: [],
};

for (let body of data.bodies) {
	if (!body.englishName) {
		body.englishName = body.name;
	}
}

const additionalData = {
	default: {
		texture: '',
		ascendingNode: 0,
		meanAnomalyAtEpoch: 0,
		periapsisArg: 0,
	},
	mercury: {
		texture: Assets.MERCURY_8K,
		ascendingNode: 48.331,
		meanAnomalyAtEpoch: 174.796,
		periapsisArg: 29.124,
	},
	venus: {
		texture: Assets.VENUS_SURFACE_8K,
		ascendingNode: 76.68,
		meanAnomalyAtEpoch: 50.115,
		periapsisArg: 54.884,
	},
	earth: {
		texture: Assets.EARTH_DAYMAP_8K,
		ascendingNode: -11.26064,
		meanAnomalyAtEpoch: 358.617,
		periapsisArg: 114.20783,
	},
	mars: {
		texture: Assets.MARS_8K,
		ascendingNode: 49.558,
		meanAnomalyAtEpoch: 19.412,
		periapsisArg: 286.502,
	},
	jupiter: {
		texture: Assets.JUPITER_8K,
		ascendingNode: 100.464,
		meanAnomalyAtEpoch: 20.02,
		periapsisArg: 273.867,
	},
	saturn: {
		texture: Assets.SATURN_8K,
		ascendingNode: 113.665,
		meanAnomalyAtEpoch: 317.02,
		periapsisArg: 339.392,
	},
	uranus: {
		texture: Assets.URANUS_2K,
		ascendingNode: 74.006,
		meanAnomalyAtEpoch: 142.2386,
		periapsisArg: 96.998857,
	},
	neptune: {
		texture: Assets.NEPTUNE_2K,
		ascendingNode: 131.784,
		meanAnomalyAtEpoch: 256.228,
		periapsisArg: 276.336,
	},
	pluto: {
		texture: '',
		ascendingNode: 110.299,
		meanAnomalyAtEpoch: 14.53,
		periapsisArg: 113.834,
	},
	moon: {
		texture: Assets.MOON_8K,
	},
};

function processMoons(body: Body) {
	if (!body.moons) return [];
	return body.moons.map((moons) => {
		const moon = data.bodies.find((p) => p.name === moons.moon);
		return processBody(moon!);
	});
}

function processBody(body: Body): ICelestialBody {
	return {
		name: body.englishName,
		axialTilt: DEG_TO_RAD * body.axialTilt,
		mass: parseFloat(body.mass ? body.mass.massValue + 'e' + body.mass.massExponent : '1e13'),
		radius: body.id === 'lune' ? body.equaRadius : body.meanRadius,
		texture: getPlanetProperty(body.englishName, 'texture'),
		revolutionPeriod: body.sideralRotation / 24,
		moons: processMoons(body),
		orbit: {
			ascendingNode: DEG_TO_RAD * getPlanetProperty(body.englishName, 'ascendingNode'),
			eccentricity: body.eccentricity,
			inclination: DEG_TO_RAD * body.inclination,
			meanAnomalyAtEpoch: DEG_TO_RAD * getPlanetProperty(body.englishName, 'meanAnomalyAtEpoch'),
			orbitingBody: body.aroundPlanet?.planet ?? 'Sun',
			periapsisArg: DEG_TO_RAD * getPlanetProperty(body.englishName, 'periapsisArg'),
			period: body.sideralOrbit,
			semiMajorAxis: body.semimajorAxis * KM_TO_AU,
			soiRadius: 0,
			trueAnomaly: 0,
		},
	};
}

function getPlanetProperty(name: string, property: string) {
	const body = additionalData[name.toLowerCase()] ?? additionalData.default;
	return body[property];
}

interface Body {
	id: string;
	name: string;
	englishName: string;
	isPlanet: boolean;
	moons: Moons[];
	semimajorAxis: number;
	perihelion: number;
	aphelion: number;
	eccentricity: number;
	inclination: number;
	mass: Mass;
	vol: Vol;
	density: number;
	gravity: number;
	escape: number;
	meanRadius: number;
	equaRadius: number;
	polarRadius: number;
	flattening: number;
	dimension: string;
	sideralOrbit: number;
	sideralRotation: number;
	aroundPlanet: AroundPlanet;
	discoveredBy: string;
	discoveryDate: string;
	alternativeName: string;
	axialTilt: number;
	rel: string;
}

interface Data {
	bodies: Body[];
}

interface Moons {
	moon: string;
	rel: string;
}

interface Mass {
	massValue: number;
	massExponent: number;
}

interface Vol {
	volValue: number;
	volExponent: number;
}

interface AroundPlanet {
	planet: string;
	rel: string;
}

const planets = data.bodies.filter((b) => b.isPlanet);
console.log('processing ' + planets.length + ' planets');
for (let body of planets) {
	bodies.bodies.push(processBody(body));
}

const muns = data.bodies.filter((b) => !b.isPlanet && b.aroundPlanet);
console.log('processing ' + muns.length + ' muns');
for (let body of muns) {
}

const asteroids = data.bodies.filter((b) => !b.isPlanet && !b.aroundPlanet);
console.log('processing ' + asteroids.length + ' asteroids');
for (let body of asteroids) {
}

fs.writeFileSync(path.join('public', 'gamedata', 'bodies.json'), JSON.stringify(bodies, null, '\t'), {
	encoding: 'utf-8',
	flag: 'w',
});
