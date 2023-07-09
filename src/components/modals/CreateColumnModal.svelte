<script lang="ts">
	import { Button, Checkbox, Modal, Stack, TextInput } from '@svelteuidev/core';
	import { createEventDispatcher } from 'svelte';
	import type { ColumnData } from '../../utils/column';

	export let opened: boolean;
	let label: string = '',
		key: boolean = false,
		element: HTMLInputElement;

	$: {
		if (opened && element) {
			setTimeout(() => {
				const input = element.querySelector('input');
				input!.focus();
			}, 0);
		}
	}

	const dispatcher = createEventDispatcher<{ submit: ColumnData; cancel: void }>();
</script>

<Modal {opened} on:close={() => dispatcher('cancel')} title="Add Column">
	<Stack>
		<TextInput label="Column Label" bind:element bind:value={label} />
		<Checkbox label="Key?" bind:checked={key} />
		<Button
			on:click={() => {
				dispatcher('submit', { label, key });
				label = '';
				key = false;
			}}>Ok</Button
		>
	</Stack>
</Modal>
