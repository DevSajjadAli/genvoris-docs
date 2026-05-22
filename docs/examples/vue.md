---
sidebar_position: 5
title: Vue 3 composable
description: useTryOn composable that works in Vue 3 and Nuxt.
---

# Vue 3: `useTryOn`

```ts title="composables/useTryOn.ts"
import { ref } from 'vue';

declare global {
  interface Window {
    Genvoris?: { openTryOn(o: { productImages: string[]; token: string }): void };
  }
}

export function useTryOn(mintTokenUrl = '/api/genvoris/session') {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function open(opts: { productImages: string[] }) {
    if (!window.Genvoris) {
      error.value = new Error('widget not loaded');
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(mintTokenUrl, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(`session mint failed: ${res.status}`);
      const { token } = await res.json();
      window.Genvoris.openTryOn({ ...opts, token });
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return { open, loading, error };
}
```

```vue title="components/TryOnButton.vue"
<script setup lang="ts">
import { useTryOn } from '~/composables/useTryOn';
const props = defineProps<{ image: string }>();
const { open, loading } = useTryOn();
</script>

<template>
  <button :disabled="loading" @click="open({ productImages: [props.image] })">
    {{ loading ? 'Loading…' : 'Try it on' }}
  </button>
</template>
```
