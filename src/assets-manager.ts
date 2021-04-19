import { Assets } from './Assets';

const NORMAL_TYPE = 'normal';
export class AssetsManager {
	static findTexture(name: string) {
		for (let tex of Assets.byName.values()) {
			const path = tex.split('.');
			path.pop();
			const textName = path.pop();
			if (textName!.toLowerCase().endsWith(name.toLowerCase())) {
				return tex;
			}
		}
		return null;
	}

	static findNormalTexture(name: string) {
		for (let tex of Assets.byName.values()) {
			const path = tex.split('.');
			path.pop();
			const type = path.pop();
			if (type !== NORMAL_TYPE) continue;
			const textName = path.pop();
			if (textName!.toLowerCase().endsWith(name.toLowerCase())) {
				return tex;
			}
		}
		return null;
	}
}
