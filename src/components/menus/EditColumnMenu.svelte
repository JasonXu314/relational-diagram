<script lang="ts">
	import { Menu } from '@svelteuidev/core';
	import { Check, Trash } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Column } from '../../utils/column';
	import type { Point } from '../../utils/point';

	export let editingColumn: Column, menuLocation: Point;
	let key: boolean = editingColumn.key;

	const dispatch = createEventDispatcher<{ delete: Column }>();
</script>

<Menu style="position: absolute; left: {menuLocation.x}px; top: {menuLocation.y}px;" opened on:close>
	<div slot="control" />
	<Menu.Item icon={Trash} on:click={() => dispatch('delete', editingColumn)}>Delete</Menu.Item>
	<Menu.Item
		icon={key ? Check : undefined}
		on:click={() => {
			editingColumn.key = !key;
			key = !key;
		}}
	>
		Key
	</Menu.Item>
</Menu>
