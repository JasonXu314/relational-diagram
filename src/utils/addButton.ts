import { Entity, type Metadata } from './entity';
import { Point } from './point';
import type { RenderEngine } from './renderEngine';
import type { Table } from './table';

const HEIGHT = 30,
	WIDTH = 50;

export class AddButton extends Entity {
	constructor(public parent: Table) {
		super();
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		this.position = this.parent.position.add(
			new Point(-this.parent.width / 2 + this.parent.columns.reduce((total, col) => total + col.width, 0) + WIDTH / 2)
		);

		renderEngine.fillRect(this.position, WIDTH, HEIGHT, 'white');

		if (metadata.selectedEntity === this) {
			renderEngine.fillRect(this.position, WIDTH, HEIGHT, 'rgba(200, 200, 255, 0.5)');
		}

		renderEngine.rect(this.position, WIDTH, HEIGHT);
		renderEngine.text(this.position, '+');
	}

	public selectedBy(point: Point): boolean {
		return (
			point.x >= this.position.x - WIDTH / 2 &&
			point.x <= this.position.x + WIDTH / 2 &&
			point.y >= this.position.y - HEIGHT / 2 &&
			point.y <= this.position.y + HEIGHT / 2
		);
	}

	public serialize(): { type: 'ADD_BUTTON' } {
		return { type: 'ADD_BUTTON' };
	}
}

