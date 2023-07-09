import { Entity, type Metadata } from './entity';
import { Point } from './point';
import type { RenderEngine } from './renderEngine';
import type { Table } from './table';

export interface ColumnData {
	label: string;
	key: boolean;
}

export interface DehydratedColumn extends ColumnData {
	id: number;
	type: 'COLUMN';
	position: [number, number];
	parentId: number;
}

export class Column extends Entity {
	public width = 0;

	constructor(public parent: Table, public label: string, public key: boolean) {
		super();
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const labelMetrics = renderEngine.measure(this.label);
		const height = 30;
		this.width = labelMetrics.actualBoundingBoxLeft + labelMetrics.actualBoundingBoxRight + 26;

		this.position = this.parent.position.add(
			new Point(
				-this.parent.width / 2 +
					this.parent.columns.slice(0, this.parent.columns.indexOf(this)).reduce((total, col) => total + col.width, 0) +
					this.width / 2
			)
		);

		renderEngine.fillRect(this.position, this.width, height, 'white');

		if (metadata.selectedEntity === this) {
			renderEngine.fillRect(this.position, this.width, height, 'rgba(200, 200, 255, 0.5)');
		}

		renderEngine.rect(this.position, this.width, height);
		renderEngine.text(this.position, this.label, { underline: this.key });
	}

	public selectedBy(point: Point): boolean {
		const height = 30;

		return (
			point.x >= this.position.x - this.width / 2 &&
			point.x <= this.position.x + this.width / 2 &&
			point.y >= this.position.y - height / 2 &&
			point.y <= this.position.y + height / 2
		);
	}

	public serialize(id: number, getID: (entity: Entity) => number): DehydratedColumn {
		return {
			id,
			type: 'COLUMN',
			position: [this.position.x, this.position.y],
			label: this.label,
			key: this.key,
			parentId: getID(this.parent)
		};
	}

	public static deserialize({ type, label, position, key }: DehydratedColumn, table: Table): Column {
		if (type !== 'COLUMN') {
			throw new Error(`Attempting to deserialize ${type} as entity`);
		}

		const entity = new Column(table, label, key);
		const [x, y] = position;
		entity.position = new Point(x, y);

		return entity;
	}
}

