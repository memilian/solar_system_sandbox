import {
	Color3,
	Mesh,
	MeshBuilder,
	Nullable,
	PBRMaterial,
	Scene,
	StandardMaterial,
	Texture,
	TransformNode,
	Vector3,
} from '@babylonjs/core';
import { TextBlock } from '@babylonjs/gui';
import { OrbitBehavior } from '../behaviors/orbit-behavior';
import { RotateBehavior } from '../behaviors/rotate-behavior';
import { Game } from '../game';
import { AssetsManager } from './../assets-manager';
import { Orbit } from './orbit';

export interface ICelestialBody {
	name: string;
	texture: string;
	orbit: Orbit;
	/** in Earth mass */
	mass: number;
	/** in Earth radius */
	radius: number;
	/** in radian */
	axialTilt: number;
	/** Period of rotation in days (sideral rotation)*/
	revolutionPeriod: number;
	moons: ICelestialBody[];
}

const EARTH_RADIUS = 6300;
const MIN_RADIUS = 0.02;

export class CelestialBody extends TransformNode implements ICelestialBody {
	name: string;
	texture: string;
	orbit: Orbit;
	/** in Earth mass */
	mass: number;
	/** in Earth radius */
	radius: number;
	/** in radian */
	axialTilt: number;
	/** Period of rotation in days (sideral rotation)*/
	revolutionPeriod: number;
	moons: CelestialBody[];
	parentBody: Nullable<CelestialBody>;

	mesh: Mesh;
	anchorMesh: Mesh;
	orbitMesh: Mesh;
	orbitMeshHighRes: Mesh;
	rootNode: TransformNode;

	gameRadius: number;
	orbitBehaviour: OrbitBehavior;
	label: TextBlock;
	selected: boolean;

	constructor(body: ICelestialBody, private scene: Scene, private game: Game, parent: Nullable<CelestialBody>) {
		super(body.name + 'Body', scene, undefined);
		Object.assign(this, body);
		this.gameRadius = Math.max(MIN_RADIUS, body.radius / EARTH_RADIUS);
		this.mesh = MeshBuilder.CreateSphere(body.name + 'Mesh', { diameter: 2 * this.gameRadius }, scene);
		this.mesh.receiveShadows = true;

		this.anchorMesh = MeshBuilder.CreateLines(this.name + 'Anchor', {
			points: [Vector3.Zero(), Vector3.Up().scaleInPlace(this.gameRadius * 3.5)],
		});

		this.anchorMesh.visibility = 0;
		this.anchorMesh.parent = this;
		this.anchorMesh.isPickable = false;

		this.createMesh(body, scene);

		this.rootNode = new TransformNode(body.name + 'Root', scene);

		this.rootNode.parent = this;
		this.mesh.parent = this.rootNode;

		this.rootNode.addBehavior(new RotateBehavior(this));
		this.orbitBehaviour = new OrbitBehavior(this.orbit, parent);
		this.addBehavior(this.orbitBehaviour);

		if (parent) {
			this.parentBody = parent;
			this.parent = parent;
		}
		this.orbitMesh = this.createOrbit(this.orbitBehaviour, scene);
		this.createLabel();
		this.moons = this.moons.slice().map((moon) => new CelestialBody(moon, scene, game, this));
		this.setSystemLabelVisible(false);
		this.setSystemOrbitVisible(false);
	}

	createLabel() {
		this.label = new TextBlock(this.name + 'LabelText');
		this.game.hud.texture.addControl(this.label);
		this.label.height = '60px';
		this.label.width = '128px';
		this.label.linkOffsetYInPixels = this.gameRadius * 2.5;
		this.label.linkWithMesh(this.anchorMesh);
		this.label.text = this.name;
		this.label.color = 'white';
		this.label.isPointerBlocker = true;
		this.label.onPointerClickObservable.add(() => {
			if (this.label.isVisible) this.game.selectionManager.selectBody(this);
		});
	}

	createOrbit(orbit: OrbitBehavior, scene: Scene, steps = 128) {
		const points = orbit.getOrbitPoints(steps);
		const orbitMesh = MeshBuilder.CreateLines(this.name + 'Orbit' + steps, {
			points: points,
		});

		const mat = new StandardMaterial(orbitMesh.name + 'Mat', scene);
		mat.diffuseColor = Color3.White();
		mat.ambientColor = Color3.White();
		mat.emissiveColor = Color3.White();
		mat.alpha = 0.01;
		mat.disableLighting = true;
		orbitMesh.material = mat;
		orbitMesh.parent = this.parent;
		orbitMesh.isPickable = false;
		return orbitMesh;
	}

	createMesh(body: ICelestialBody, scene: Scene) {
		const mat = new PBRMaterial(body.name, scene);
		let albedoTex: string | null = body.texture;
		if (!albedoTex) albedoTex = AssetsManager.findTexture(body.name);
		if (albedoTex) {
			const tex = new Texture(albedoTex, scene);
			tex.uScale = -1;
			tex.vScale = -1;
			mat.albedoTexture = tex;
			mat.ambientTexture = tex;
		}
		let normalTex = AssetsManager.findNormalTexture(body.name);
		if (normalTex) {
			const tex = new Texture(normalTex, scene);
			tex.uScale = -1;
			tex.vScale = -1;
			mat.bumpTexture = tex;
		}
		mat.usePhysicalLightFalloff = false;
		mat.roughness = 1.0;
		mat.useLogarithmicDepth = true;

		this.mesh.material = mat;
		this.mesh.checkCollisions = true;
	}

	onSelected() {
		this.selected = true;
		if (!this.orbitMeshHighRes) {
			this.orbitMeshHighRes = this.createOrbit(this.orbitBehaviour, this.scene, 2048);
			this.orbitMeshHighRes.material!.alpha = 0.6;
		}
		const root = this.getSystemRootBody();
		root.setSystemLabelVisible(true);
		root.setSystemOrbitVisible(true);
	}

	onDeSelected() {
		this.selected = false;
		const root = this.getSystemRootBody();
		root.setSystemLabelVisible(false);
		root.setSystemOrbitVisible(false);
	}

	setSystemOrbitVisible(visible: boolean) {
		this.orbitMesh.isVisible = !this.selected;
		if (this.orbitMeshHighRes) this.orbitMeshHighRes.isVisible = this.selected;
		this.moons.forEach((m) => {
			m.orbitMesh.isVisible = visible && !m.selected;
			if (m.orbitMeshHighRes) {
				m.orbitMeshHighRes.isVisible = m.selected && visible;
			}
		});
	}

	setSystemLabelVisible(visible: boolean) {
		this.label.isVisible = visible;
		this.moons.forEach((m) => (m.label.isVisible = visible));
		if (!visible) {
			this.getSystemRootBody().label.isVisible = true;
		}
	}

	getSystemRootBody(): CelestialBody {
		return (this.parent as CelestialBody)?.getSystemRootBody() ?? this;
	}
}
