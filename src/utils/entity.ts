import { Point } from './point';
import type { Reference } from './reference';
import type { RenderEngine } from './renderEngine';

export interface Metadata {
	selected: boolean;
	selectedEntity: Entity | null;
	mouse: MouseData | null;
	references: Reference[];
}

export interface DSFunctions {
	getID: (entity: Entity) => number;
	getRenderEngine: () => RenderEngine;
}

export type MouseData = { position: Point | null } & ({ down: true; delta: Point } | { down: false; delta: null });

export abstract class Entity {
	public position: Point = new Point();

	public abstract render(renderEngine: RenderEngine, metadata: Metadata): void;
	public abstract selectedBy(point: Point, getMetrics: (label: string) => TextMetrics): boolean | Entity;

	public abstract serialize(id: number, getID: (entity: Entity) => number): { type: string };
}

