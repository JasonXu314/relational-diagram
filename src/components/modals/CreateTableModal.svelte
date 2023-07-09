<script lang="ts">
	import { Button, Modal, Stack, TextInput } from '@svelteuidev/core';
	import { createEventDispatcher } from 'svelte';
	import type { TableData } from '../../utils/table';

	export let opened: boolean;
	let name: string = '',
		element: HTMLInputElement;

	$: {
		if (opened && element) {
			setTimeout(() => {
				const input = element.querySelector('input');
				input!.focus();
			}, 0);
		}
	}

	const dispatcher = createEventDispatcher<{ submit: TableData; cancel: void }>();
</script>

<Modal {opened} on:close={() => dispatcher('cancel')} title="Create Table">
	<Stack>
		<TextInput label="Table Name" bind:element bind:value={name} />
		<Button
			on:click={() => {
				dispatcher('submit', { name });
				name = '';
			}}>Ok</Button
		>
	</Stack>
</Modal>
