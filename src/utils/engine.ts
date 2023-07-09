import { AddButton } from './addButton';
import type { Entity } from './entity';
import { Point } from './point';
import { Reference } from './reference';
import { RenderEngine } from './renderEngine';

interface EngineEvents {
	entityClicked: (entity: Entity, metadata: { button: MouseButton; spacePos: Point; pagePos: Point }) => void;
	entityDblClicked: (entity: Entity) => void;
	click: (evt: MouseEvent) => void;
}

export enum MouseButton {
	LEFT,
	MIDDLE,
	RIGHT,
	BACK,
	FORWARD
}

export class Engine {
	private readonly context: CanvasRenderingContext2D;
	private readonly entities: Entity[] = [];
	private readonly renderEngine: RenderEngine;
	private readonly references: Reference[] = [];

	private _selectedEntity: Entity | null = null;
	private _mousePos: Point | null = null;
	private _mouseDown = false;
	private _mouseDelta: Point | null = null;

	private _listeners: { [K in keyof EngineEvents]: EngineEvents[K][] };

	private mouseListener: (evt: MouseEvent) => void = (evt) => {
		if (this._mousePos) {
			this._mousePos = this.renderEngine.canvasToSpace(new Point(evt.offsetX, evt.offsetY));

			if (this._mouseDelta) {
				this._mouseDelta.x += evt.movementX;
				this._mouseDelta.y -= evt.movementY;
			}
		}
	};

	constructor(private readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');

		if (ctx) {
			this.context = ctx;
			this.renderEngine = new RenderEngine(ctx, canvas);

			this._listeners = { entityClicked: [], click: [], entityDblClicked: [] };

			canvas.addEventListener('mouseout', () => {
				this._mousePos = null;

				canvas.removeEventListener('mousemove', this.mouseListener);
			});

			canvas.addEventListener('mouseover', (evt) => {
				this._mousePos = new Point(evt.offsetX, evt.offsetY);

				canvas.addEventListener('mousemove', this.mouseListener);
			});

			canvas.addEventListener('mousedown', () => {
				this._mouseDown = true;
				this._mouseDelta = new Point();
			});

			canvas.addEventListener('mouseup', (evt: MouseEvent) => {
				this._mouseDown = false;
				this._mouseDelta = null;

				if (this._selectedEntity) {
					for (const listener of this._listeners.entityClicked) {
						listener(this._selectedEntity, {
							button: evt.button,
							spacePos: this._mousePos!,
							pagePos: this.renderEngine.spaceToCanvas(this._mousePos!).add(new Point(16, 52))
						});
					}
				} else {
					for (const listener of this._listeners.click) {
						listener(evt);
					}
				}
			});

			canvas.addEventListener('dblclick', () => {
				if (this._selectedEntity) {
					for (const listener of this._listeners.entityDblClicked) {
						listener(this._selectedEntity);
					}
				}
			});

			canvas.addEventListener('contextmenu', (evt: MouseEvent) => {
				if (this._selectedEntity) {
					evt.preventDefault();
				}
			});
		} else {
			throw new Error('Unable to get canvas context');
		}
	}

	public add(entity: Entity): void {
		this.entities.push(entity);

		if (entity instanceof Reference) {
			this.references.push(entity);
		}
	}

	public remove(entity: Entity): void {
		if (!this.entities.includes(entity)) {
			throw new Error(`Engine does not contain entity!`);
		} else {
			this.entities.splice(this.entities.indexOf(entity), 1);
		}

		if (!(entity instanceof Reference)) {
			const toRemove = this.entities.filter((e) => e instanceof Reference && (e.from === entity || e.to === entity));
			toRemove.forEach((line) => this.entities.splice(this.entities.indexOf(line), 1));
		}
	}

	public start(): void {
		this._tick();
	}

	public on<T extends keyof EngineEvents>(evt: T, listener: EngineEvents[T]): () => void {
		this._listeners[evt].push(listener);

		return () => {
			this._listeners[evt].splice(this._listeners[evt].indexOf(listener), 1);
		};
	}

	public export(): string {
		const entityToIndex: Map<Entity, number> = new Map();
		const entities: Entity[] = [];
		let idx = 0;

		const reversedEntities = this.entities.reduce<Entity[]>((arr, entity) => [entity, ...arr], []);

		for (const entity of reversedEntities) {
			if (!(entity instanceof AddButton)) {
				entities.push(entity);
				entityToIndex.set(entity, idx);
				idx++;
			}
		}

		return JSON.stringify(entities.map((entity) => entity.serialize(entityToIndex.get(entity)!, (entity) => entityToIndex.get(entity)!)));
	}

	public load(dehydratedEntities: { type: string }[]): void {
		// const entities: Entity[] = [];
		// dehydratedEntities.forEach((dehydratedEntity) => {
		// 	switch (dehydratedEntity.type) {
		// 		case 'ENTITY': {
		// 			const data = dehydratedEntity as DehydratedEREntity;
		// 			const entity = EREntity.deserialize(data);
		// 			entities[data.id] = entity;
		// 			this.add(entity, 1);
		// 			break;
		// 		}
		// 		case 'ATTRIBUTE': {
		// 			const data = dehydratedEntity as DehydratedERAttribute;
		// 			const entity = ERAttribute.deserialize(data);
		// 			entities[data.id] = entity;
		// 			this.add(entity, 1);
		// 			break;
		// 		}
		// 		case 'LABEL': {
		// 			const data = dehydratedEntity as DehydratedERLabel;
		// 			const entity = ERLabel.deserialize(data);
		// 			entities[data.id] = entity;
		// 			this.add(entity, 1);
		// 			break;
		// 		}
		// 		case 'RELATIONSHIP': {
		// 			const data = dehydratedEntity as DehydratedERRelationship;
		// 			const entity = ERRelationship.deserialize(data, () => this.renderEngine);
		// 			entities[data.id] = entity;
		// 			this.add(entity, 1);
		// 			break;
		// 		}
		// 		case 'LINE': {
		// 			const { derivation, double, from, id, recursionState, to, type } = dehydratedEntity as DehydratedERLine;
		// 			const entity = ERLine.deserialize({ derivation, double, from: entities[from], recursionState, to: entities[to], type });
		// 			entities[id] = entity;
		// 			this.add(entity, 0);
		// 			break;
		// 		}
		// 	}
		// });
	}

	private _tick(): void {
		requestAnimationFrame(() => this._tick());

		if (!this._mouseDown) {
			this._updateSelectedEntity();
		}

		if (this._selectedEntity) {
			this.canvas.style.cursor = 'pointer';
		} else {
			this.canvas.style.cursor = 'unset';
		}

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = 'white';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = 'black';
		this.entities.forEach((entity) => {
			entity.render(this.renderEngine, {
				selected: this._selectedEntity === entity,
				selectedEntity: this._selectedEntity,
				mouse: null,
				references: this.references
			});
		});

		if (this._mouseDelta) {
			this._mouseDelta = new Point();
		}
	}

	private _updateSelectedEntity(): void {
		if (this._mousePos) {
			const reversedEntities = this.entities.reduce<Entity[]>((arr, entity) => [entity, ...arr], []);

			for (const entity of reversedEntities) {
				const selected = entity.selectedBy(this._mousePos, (label: string) => this.renderEngine.measure(label));
				if (selected) {
					if (typeof selected === 'boolean') {
						this._selectedEntity = entity;
					} else {
						this._selectedEntity = selected;
					}
					return;
				}
			}
		}

		this._selectedEntity = null;
	}
}

