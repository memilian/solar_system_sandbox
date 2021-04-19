import {
	ArcRotateCameraPointersInput,
	Color3,
	DefaultRenderingPipeline,
	Engine,
	Mesh,
	MeshBuilder,
	PBRMaterial,
	PointLight,
	Scene,
	StandardMaterial,
	Texture,
	Vector3,
	VolumetricLightScatteringPostProcess,
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { DateTime } from 'luxon';
import { Assets } from './Assets';
import { SystemCamera } from './cameras/system-camera';
import { AU_TO_KM, G, SECOND_TO_DAY, SUN_MASS } from './constants';
import { Hud } from './hud';
import { ArcRotateCameraKeyboardInput } from './input/arc-rotate-camera-keyboard-input';
import { CelestialBody, ICelestialBody } from './model/celestial-body';
import { SelectionManager } from './selection-manager';

export class Game {
	static simTime = 0;
	static simDeltaTime = 0;
	simDateTime = DateTime.local(2097, 1, 1);
	simSpeed = 0.25;
	camera: SystemCamera;
	scene: Scene;
	engine: Engine;
	hud: Hud;
	selectionManager: SelectionManager;

	paused = false;

	planets: CelestialBody[] = [];
	sun: Mesh;
	sunlight: PointLight;
	skybox: Mesh;

	constructor() {
		// create the canvas html element and attach it to the webpage
		const canvas = document.createElement('canvas');
		canvas.style.width = '100vw';
		canvas.style.height = '100vh';
		canvas.style.outline = 'none';
		canvas.id = 'gameCanvas';
		document.body.appendChild(canvas);

		const infoPanel = document.createElement('div');
		infoPanel.style.position = 'absolute';
		infoPanel.style.top = '0';
		infoPanel.style.right = '0';
		infoPanel.style.zIndex = '100';
		infoPanel.style.width = '125px';
		infoPanel.style.color = 'white';
		infoPanel.style.paddingLeft = '8px';
		infoPanel.style.backgroundColor = 'rgba(255,255,255,0.1)';
		document.body.appendChild(infoPanel);

		this.engine = new Engine(canvas, true);
		this.engine.displayLoadingUI();
		this.scene = new Scene(this.engine);
		this.hud = new Hud(this.scene);
		this.selectionManager = new SelectionManager(this.scene, this);

		this.scene.ambientColor = new Color3(0.2, 0.2, 0.2);
		this.camera = new SystemCamera('Camera', Math.PI / 2, Math.PI / 2, 25, Vector3.Zero(), this.scene, this);
		this.camera.minZ = 0.1;
		this.camera.maxZ = 100000;
		this.camera.panningInertia = 0.5;
		this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
		const keyboardInputs = new ArcRotateCameraKeyboardInput();
		this.camera.inputs.add(keyboardInputs);
		(this.camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput).panningSensibility = 100;
		(this.camera.inputs.attached['mousewheel'] as ArcRotateCameraPointersInput).panningSensibility = 100;
		this.camera.attachControl(canvas, true);

		this.createEnv(this.scene);
		this.createSun();

		const bodies: ICelestialBody[] = (window as any).electron.gameData.getSystemBodies().bodies;
		for (let body of bodies) {
			this.fixOrbitals(body, bodies);
			this.createBody(body, this.scene);
		}

		// hide/show the Inspector
		window.addEventListener('keydown', (ev: KeyboardEvent) => {
			// Shift+Ctrl+Alt+I
			if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'I') {
				if (this.scene.debugLayer.isVisible()) {
					this.scene.debugLayer.hide();
				} else {
					this.scene.debugLayer.show();
				}
			}

			let step = 0.05;
			if (ev.shiftKey) step = 1.0;
			if (ev.altKey) step = 0.01;
			if (ev.key === ' ') {
				this.paused = !this.paused;
			}

			if (ev.key === '+') {
				this.simSpeed += step;
			}

			if (ev.key === '-') {
				this.simSpeed -= step;
			}
		});

		let pipeline = new DefaultRenderingPipeline('DefaultPipeline', true, this.scene, [this.camera]);
		pipeline.samples = 4;
		pipeline.fxaaEnabled = true;
		pipeline.bloomEnabled = true;
		// pipeline.glowLayerEnabled = true;
		// pipeline.glowLayer?.addExcludedMesh(this.skybox);
		let vol = new VolumetricLightScatteringPostProcess(
			'SunGodRays',
			1.0,
			this.camera,
			this.sun,
			100,
			Texture.BILINEAR_SAMPLINGMODE,
			this.engine,
			false,
			this.scene
		);
		vol.exposure = 0.91;
		vol.decay = 0.92815;
		vol.weight = 0.68767;
		vol.density = 0.8;

		this.scene.onReadyObservable.addOnce(() => {
			this.engine.hideLoadingUI();
			const jupiter = this.planets.find((p) => p.name === 'Jupiter');
			this.camera.goToTarget(jupiter!.mesh, 3, true);
		});

		// run the main render loop
		this.engine.runRenderLoop(() => {
			if (!this.paused) {
				Game.simDeltaTime = this.engine.getDeltaTime() / 1000;
				Game.simDeltaTime *= this.simSpeed;
				Game.simTime += Game.simDeltaTime;
				this.simDateTime = this.simDateTime.plus({ days: Game.simDeltaTime });
			} else {
				Game.simDeltaTime = 0;
			}

			this.scene.render();

			infoPanel.innerHTML = `
			<div>fps : ${Math.round(this.engine.getFps())}</div>
			<div>${this.simDateTime.toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>sim speed : ${this.simSpeed.toFixed(2)}</div>
			`;
		});
	}

	fixOrbitals(body: ICelestialBody, bodies: ICelestialBody[]) {
		if (!body.orbit.period) {
			const parent = bodies.find((b) => b.name === body.orbit.orbitingBody);
			const parentMass = parent ? parent.mass : SUN_MASS;
			body.orbit.period =
				Math.PI *
				2 *
				Math.sqrt(Math.pow(body.orbit.semiMajorAxis * AU_TO_KM, 3) / (G * parentMass)) *
				SECOND_TO_DAY;
		}
		if (!body.revolutionPeriod) {
			body.revolutionPeriod = 0.5;
		}
		body.moons.forEach((moon) => this.fixOrbitals(moon, bodies));
	}

	createSun() {
		this.sunlight = new PointLight('Sun', new Vector3(0, 0, 0), this.scene);
		this.sunlight.intensity = 2;
		// this.sunlight.radius = 10;

		this.sun = MeshBuilder.CreateSphere('Sun', { diameter: 25 }, this.scene);
		const sunMaterial = new PBRMaterial('Sun', this.scene);
		sunMaterial.emissiveColor.set(1, 0.8, 0.3);
		// sunMaterial.ambientColor.set(1, 1, 1);
		// sunMaterial.diffuseColor.set(1, 1, 1);
		sunMaterial.useLogarithmicDepth = false;
		this.sun.material = sunMaterial;
		this.sun.checkCollisions = true;
	}

	createEnv(scene: Scene) {
		const sphere = MeshBuilder.CreateSphere('skybox', { diameter: 298000 }, scene);
		const mat = new StandardMaterial('skybox', scene);
		mat.diffuseTexture = new Texture(Assets.MILKY_ESO2, scene);
		mat.emissiveColor = new Color3(1, 1, 1);
		mat.backFaceCulling = false;
		mat.useLogarithmicDepth = true;
		mat.disableLighting = true;
		sphere.material = mat;
		sphere.isPickable = false;
		this.skybox = sphere;
	}

	createBody(body: ICelestialBody, scene: Scene) {
		const cbody = new CelestialBody(body, scene, this, null);
		this.planets.push(cbody);
		return cbody;
	}
}

new Game();
