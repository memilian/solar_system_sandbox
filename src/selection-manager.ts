import { Node, Nullable, Observable, PointerEventTypes, Scene } from '@babylonjs/core';
import { Game } from './game';
import { CelestialBody } from './model/celestial-body';

export class SelectionManager {
	selection: Nullable<CelestialBody>;
	selectionChanged$ = new Observable<CelestialBody>();

	constructor(private readonly scene: Scene, private readonly game: Game) {
		this.scene.onPointerObservable.add((data, _) => {
			switch (data.type) {
				case PointerEventTypes.POINTERPICK:
					if (data.pickInfo?.hit && data.pickInfo.pickedMesh) {
						let pickedMesh = data.pickInfo.pickedMesh;
						let node: Node = pickedMesh;
						while (node.parent) {
							if (node instanceof CelestialBody) break;
							node = node.parent;
						}
						if (node instanceof CelestialBody) {
							console.log('Selected ' + pickedMesh.name);
							this.selectBody(node);
						}
					}
					break;
				default:
					break;
			}
		});
	}

	selectBody(body: CelestialBody) {
		if (this.selection) {
			this.selection.onDeSelected();
		}
		this.selection = body;
		this.selection.onSelected();
		this.selectionChanged$.notifyObservers(this.selection);
		this.game.camera.goToTarget(body.mesh, 3);
	}
}
