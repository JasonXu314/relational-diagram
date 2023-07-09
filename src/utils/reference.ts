import type { Column } from './column';
import { Entity, type Metadata } from './entity';
import { Point } from './point';
import type { RenderEngine } from './renderEngine';

export interface ReferenceData {
	type: 'REFERENCE';
	from: Column;
	to: Column;
}

export interface DehydratedReference {
	id: number;
	type: 'REFERENCE';
	from: number;
	to: number;
}

export const REFERENCE_SPACING = 10;

export class Reference extends Entity {
	private _path: Point[] = [];

	constructor(public from: Column, public to: Column) {
		super();
	}

	public get recursive(): boolean {
		return this.from.parent === this.to.parent;
	}

	public render(renderEngine: RenderEngine, { selected, references }: Metadata): void {
		let upSpacing = REFERENCE_SPACING;

		if (this.recursive) {
			for (const ref of references) {
				if (ref === this) {
					break;
				}

				if (ref.recursive && ref.from.parent === this.from.parent) {
					upSpacing += REFERENCE_SPACING;
				}
			}

			this._path = [
				this.from.position.subtract(new Point(0, 15)),
				this.from.position.subtract(new Point(0, 15 + upSpacing)),
				this.to.position.subtract(new Point(0, 15 + upSpacing)),
				this.to.position.subtract(new Point(0, 15))
			];
		} else {
			let past = false,
				leftSpacing = REFERENCE_SPACING,
				targetSpacing = REFERENCE_SPACING;

			for (const ref of references) {
				if (ref === this) {
					past = true;
				}

				if (ref.recursive && ref.from === this.from) {
					upSpacing += REFERENCE_SPACING;
				} else if (!past && ref.from.parent === this.from.parent) {
					upSpacing += REFERENCE_SPACING;
					leftSpacing += REFERENCE_SPACING;
				} else if (!past) {
					leftSpacing += REFERENCE_SPACING;
				}

				if (ref.recursive && ref.from === this.to) {
					targetSpacing += REFERENCE_SPACING;
				} else if (ref.from.parent === this.to.parent || (!past && ref.to.parent === this.to.parent)) {
					targetSpacing += REFERENCE_SPACING;
				}
			}

			this._path = [
				this.from.position.subtract(new Point(0, 15)),
				this.from.position.subtract(new Point(0, 15 + upSpacing)),
				new Point(
					-renderEngine.width / 2 + 50 + references.filter((ref) => !ref.recursive).length * REFERENCE_SPACING - leftSpacing,
					this.from.position.y - (15 + upSpacing)
				),
				new Point(
					-renderEngine.width / 2 + 50 + references.filter((ref) => !ref.recursive).length * REFERENCE_SPACING - leftSpacing,
					this.to.position.y - (15 + targetSpacing)
				),
				this.to.position.subtract(new Point(0, 15 + targetSpacing)),
				this.to.position.subtract(new Point(0, 15))
			];
		}

		if (selected) {
			renderEngine.path(this._path, 6, 'rgba(200, 200, 255, 0.5)');
		}

		renderEngine.path(this._path);

		const arrowTip = this._path.at(-1)!;
		renderEngine.fillPath([arrowTip, arrowTip.add(new Point(3.75, -6)), arrowTip.add(new Point(0, -4)), arrowTip.add(new Point(-3.75, -6)), arrowTip]);
	}

	public selectedBy(point: Point): boolean {
		const lines = this._path.slice(1).reduce<[Point, Point][]>((arr, pt, i) => [...arr, [this._path[i], pt]], []);

		for (const [fromPos, toPos] of lines) {
			const length = fromPos.distanceTo(toPos);

			if (length === 0 && fromPos.distanceTo(point) <= 5) {
				return true;
			}

			const projection = ((point.x - fromPos.x) * (toPos.x - fromPos.x) + (point.y - fromPos.y) * (toPos.y - fromPos.y)) / length ** 2;
			const clampedProjection = Math.max(0, Math.min(projection, 1));

			if (point.distanceTo(fromPos.add(toPos.subtract(fromPos).times(clampedProjection))) <= 5) {
				return true;
			}
		}

		return false;
	}

	public serialize(id: number, getID: (entity: Entity) => number): DehydratedReference {
		return {
			id,
			type: 'REFERENCE',
			from: getID(this.from),
			to: getID(this.to)
		};
	}

	public static deserialize({ type, from, to }: ReferenceData): Reference {
		if (type !== 'REFERENCE') {
			throw new Error(`Attempting to deserialize ${type} as line`);
		}

		return new Reference(from, to);
	}
}

