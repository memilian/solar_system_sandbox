import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture } from '@babylonjs/gui';

export class Hud {
	texture: AdvancedDynamicTexture;

	constructor(private readonly scene: Scene) {
		this.texture = AdvancedDynamicTexture.CreateFullscreenUI('hudTexture', undefined, scene);
	}
}
