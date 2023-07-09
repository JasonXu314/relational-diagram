<script lang="ts">
	import { SvelteUIProvider } from '@svelteuidev/core';
</script>

<svelte:head>
	<title>Relational Diagram</title>
</svelte:head>

<SvelteUIProvider withNormalizeCSS withGlobalStyles>
	<slot />
</SvelteUIProvider>
