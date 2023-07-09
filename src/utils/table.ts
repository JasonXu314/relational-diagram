import { AddButton } from './addButton';
import { Column, type ColumnData } from './column';
import { Entity, type Metadata } from './entity';
import { Point } from './point';
import { REFERENCE_SPACING } from './reference';
import type { RenderEngine } from './renderEngine';

export interface TableData {
	name: string;
}

export interface DehydratedTable extends TableData {
	id: number;
	type: 'TABLE';
	position: [number, number];
}

export class Table extends Entity {
	public static showAddBtn = true;
	private static _instances: Table[] = [];

	public columns: Column[] = [];
	public width = 0;
	public addButton: AddButton;

	constructor(public name: string) {
		super();
		this.addButton = new AddButton(this);
		Table._instances.push(this);
	}

	public render(renderEngine: RenderEngine, metadata: Metadata): void {
		const height = 30,
			idx = Table._instances.indexOf(this);
		this.width = this.columns.reduce((total, col) => total + col.width, 0);
		const textMetrics = renderEngine.measure(this.name, { font: 'bold 15px sans-serif' });
		const labelWidth = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft;

		let refAdjustment = 0;
		for (const ref of metadata.references) {
			if (ref.recursive) {
				if (Table._instances.indexOf(ref.from.parent) < idx) {
					refAdjustment += REFERENCE_SPACING;
				}
			} else {
				if (Table._instances.indexOf(ref.from.parent) < idx) {
					refAdjustment += REFERENCE_SPACING;
				}
				if (Table._instances.indexOf(ref.to.parent) < idx) {
					refAdjustment += REFERENCE_SPACING;
				}
			}
		}

		this.position = new Point(
			-renderEngine.width / 2 +
				50 +
				this.width / 2 +
				metadata.references.reduce((count, ref) => (ref.recursive ? count : count + 1), 0) * REFERENCE_SPACING,
			renderEngine.height / 2 - 45 - idx * 60 - refAdjustment
		);

		renderEngine.fillRect(this.position, this.width, height, 'white');
		renderEngine.text(this.position.add(new Point(-this.width / 2 + labelWidth / 2, 30)), this.name, { font: 'bold 15px sans-serif' });

		this.columns.forEach((col) => col.render(renderEngine, metadata));
		if (Table.showAddBtn) {
			this.addButton.render(renderEngine, metadata);
		}
	}

	public addColumn(data: ColumnData): void {
		const column = new Column(this, data.label, data.key);

		this.columns.push(column);
	}

	public removeColumn(col: Column): void {
		this.columns.splice(this.columns.indexOf(col), 1);
	}

	public selectedBy(point: Point): boolean | Entity {
		return this.columns.find((col) => col.selectedBy(point)) || (this.addButton.selectedBy(point) ? this.addButton : false);
	}

	public serialize(id: number): DehydratedTable {
		return {
			id,
			type: 'TABLE',
			position: [this.position.x, this.position.y],
			name: this.name
		};
	}

	public static deserialize({ type, name, position }: DehydratedTable): Table {
		if (type !== 'TABLE') {
			throw new Error(`Attempting to deserialize ${type} as table`);
		}

		const entity = new Table(name);
		const [x, y] = position;
		entity.position = new Point(x, y);

		return entity;
	}
}

