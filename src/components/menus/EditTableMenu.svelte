<script lang="ts">
	import { Menu } from '@svelteuidev/core';
	import { Trash } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Point } from '../../utils/point';
	import type { Table } from '../../utils/table';

	export let editingTable: Table, menuLocation: Point;

	const dispatch = createEventDispatcher<{ delete: Table }>();
</script>

<Menu style="position: absolute; left: {menuLocation.x}px; top: {menuLocation.y}px;" opened on:close>
	<div slot="control" />
	<Menu.Item icon={Trash} on:click={() => dispatch('delete', editingTable)}>Delete</Menu.Item>
</Menu>
