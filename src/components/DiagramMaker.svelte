<script lang="ts">
	import { goto } from '$app/navigation';
	import { hotkey } from '@svelteuidev/composables';
	import { Button, Checkbox, Group, Modal, Space, TextInput, Tooltip } from '@svelteuidev/core';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import type { RelationalDiagram } from '../app';
	import { AddButton } from '../utils/addButton';
	import { Column, type ColumnData } from '../utils/column';
	import { Engine, MouseButton } from '../utils/engine';
	import { Point } from '../utils/point';
	import { Reference } from '../utils/reference';
	import { Table, type TableData } from '../utils/table';
	import EditColumnMenu from './menus/EditColumnMenu.svelte';
	import EditReferenceMenu from './menus/EditReferenceMenu.svelte';
	import EditTableMenu from './menus/EditTableMenu.svelte';
	import CreateColumnModal from './modals/CreateColumnModal.svelte';
	import CreateTableModal from './modals/CreateTableModal.svelte';

	enum ModalState {
		NONE,
		CREATE_TABLE,
		CREATE_COLUMN,
		UPLOAD
	}

	enum MenuState {
		NONE,
		EDITING_TABLE,
		EDITING_COLUMN,
		EDITING_REFERENCE
	}

	export let dehydratedDiagram: RelationalDiagram | null = null;

	let name: string, author: string;

	let canvas: HTMLCanvasElement | undefined,
		engine: Engine | null,
		drawingLine = false,
		modalState: ModalState = ModalState.NONE,
		menuState: MenuState = MenuState.NONE,
		menuLocation: Point | null = null,
		editingTable: Table | null = null,
		editingColumn: Column | null = null,
		editingReference: Reference | null = null,
		addingTable: Table | null = null,
		cancelLine: () => void = () => {};

	onMount(() => {
		if (canvas) {
			engine = new Engine(canvas);

			if (dehydratedDiagram) {
				engine.load(JSON.parse(dehydratedDiagram.diagram));
			}

			engine.start();
			(window as any).engine = engine;

			engine.on('entityClicked', (entity, metadata) => {
				if (metadata.button === MouseButton.RIGHT) {
					if (entity instanceof Table) {
						menuState = MenuState.EDITING_TABLE;
						editingTable = entity;
						menuLocation = metadata.pagePos.add(new Point(-25, 12.5));
					} else if (entity instanceof Column) {
						menuState = MenuState.EDITING_COLUMN;
						editingColumn = entity;
						menuLocation = metadata.pagePos.add(new Point(-25, 12.5));
					} else if (entity instanceof Reference) {
						menuState = MenuState.EDITING_REFERENCE;
						editingReference = entity;
						menuLocation = metadata.pagePos.add(new Point(5, 0));
					}
				} else if (metadata.button === MouseButton.LEFT) {
					if (entity instanceof AddButton) {
						addingTable = entity.parent;
						modalState = ModalState.CREATE_COLUMN;
					}
				}
			});
		}
	});

	function inputTable() {
		modalState = ModalState.CREATE_TABLE;
	}

	function createTable({ name }: TableData) {
		if (engine) {
			engine.add(new Table(name));
			modalState = ModalState.NONE;
		}
	}

	function createColumn(data: ColumnData) {
		if (addingTable) {
			addingTable.addColumn(data);
			addingTable = null;
			modalState = ModalState.NONE;
		}
	}

	function showUpload(): void {
		modalState = ModalState.UPLOAD;
	}

	function createLine() {
		if (engine) {
			let from: Column | null = null,
				to: Column | null = null;

			const off = engine.on('entityClicked', (entity, metadata) => {
				if (metadata.button === MouseButton.LEFT && entity instanceof Column) {
					if (!from) {
						from = entity;
					} else {
						to = entity;

						const line = new Reference(from, to);

						engine!.add(line);

						drawingLine = false;
						off();
					}
				} else {
					drawingLine = false;
					off();
				}
			});

			drawingLine = true;
			cancelLine = () => {
				off();
				drawingLine = false;
			};
		}
	}

	function upload(): void {
		exportImage().then((blob) => {
			if (engine) {
				const data = new FormData();
				data.append('name', name);
				data.append('author', author);
				data.append('diagram', engine.export());
				data.append('preview', blob);

				axios
					.post<RelationalDiagram>('/rel/diagrams', data)
					.then((res) => {
						goto(`/${res.data._id}`, { replaceState: true });
					})
					.catch((err) => {
						console.error(err);
					});
			}
		});
	}

	function save(): void {
		exportImage().then((blob) => {
			if (engine && dehydratedDiagram) {
				const data = new FormData();
				data.append('diagram', engine.export());
				data.append('preview', blob);

				axios
					.patch(`/rel/diagrams/${dehydratedDiagram._id}`, data)
					.then((res) => {
						console.log(res.data);
					})
					.catch((err) => {
						console.error(err);
					});
			}
		});
	}

	function download(): void {
		exportImage().then((blob) => {
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = 'rel.png';
			anchor.click();
		});
	}

	async function exportImage(): Promise<Blob> {
		return new Promise((res, rej) => {
			if (canvas) {
				canvas.toBlob((blob) => {
					if (!blob) {
						rej('couldnt export to blob');
					} else {
						res(blob);
					}
				});
			} else {
				rej('No canvas');
			}
		});
	}
</script>

<Group>
	<Tooltip label="Hotkey: t (Table)">
		<Button use={[[hotkey, modalState === ModalState.NONE ? [['t', inputTable]] : []]]} on:click={inputTable}>Table</Button>
	</Tooltip>
	{#if drawingLine}
		<Button color="red" on:click={cancelLine}>Cancel</Button>
	{:else}
		<Tooltip label="Hotkey: c (Connect)">
			<Button use={[[hotkey, modalState === ModalState.NONE ? [['c', createLine]] : []]]} on:click={createLine}>Line</Button>
		</Tooltip>
	{/if}
	<Checkbox label="Show Add Buttons" bind:checked={Table.showAddBtn} />
	<!-- <Button on:click={dehydratedDiagram ? save : showUpload}>{dehydratedDiagram ? 'Save' : 'Upload'}</Button> -->
	<Button on:click={download}>Download</Button>
</Group>
<canvas height={800} width={1200} bind:this={canvas} />
<CreateTableModal
	opened={modalState === ModalState.CREATE_TABLE}
	on:submit={(evt) => createTable(evt.detail)}
	on:cancel={() => (modalState = ModalState.NONE)}
/>
<CreateColumnModal
	opened={modalState === ModalState.CREATE_COLUMN}
	on:submit={(evt) => createColumn(evt.detail)}
	on:cancel={() => (modalState = ModalState.NONE)}
/>
<Modal
	title="Upload Your ER Diagram"
	opened={modalState === ModalState.UPLOAD}
	on:close={() => {
		modalState = ModalState.NONE;
		name = '';
		author = '';
	}}
>
	<TextInput label="Diagram Name" bind:value={name} />
	<TextInput label="Your Name" bind:value={author} />
	<Space h="lg" />
	<Button on:click={upload}>Upload</Button>
</Modal>
{#if menuState === MenuState.EDITING_TABLE && editingTable && menuLocation}
	<EditTableMenu
		{menuLocation}
		{editingTable}
		on:close={() => {
			menuState = MenuState.NONE;
			editingTable = null;
			menuLocation = null;
		}}
		on:delete={(evt) => {
			const entity = evt.detail;

			if (engine) {
				engine.remove(entity);
			}
		}}
	/>
{:else if menuState === MenuState.EDITING_COLUMN && editingColumn && menuLocation}
	<EditColumnMenu
		{menuLocation}
		{editingColumn}
		on:close={() => {
			menuState = MenuState.NONE;
			editingColumn = null;
			menuLocation = null;
		}}
		on:delete={(evt) => {
			const attribute = evt.detail;

			if (engine) {
				engine.remove(attribute);
			}
		}}
	/>
{:else if menuState === MenuState.EDITING_REFERENCE && editingReference && menuLocation}
	<EditReferenceMenu
		{menuLocation}
		{editingReference}
		on:close={() => {
			menuState = MenuState.NONE;
			editingColumn = null;
			menuLocation = null;
		}}
		on:delete={(evt) => {
			const line = evt.detail;

			if (engine) {
				engine.remove(line);
			}
		}}
	/>
{/if}

<style>
	canvas {
		margin-top: 1em;
		margin-left: 1em;
		border: 1px solid black;
	}
</style>
