(() => {
  'use strict';

  const state = {
    manifest: null,
    manifestTried: false
  };

  function base64url(value) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function safeExternal(url) {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin === location.origin) return parsed.pathname + parsed.search;
      if (parsed.protocol !== 'https:') return '';
      return `/api/image?u=${base64url(parsed.toString())}`;
    } catch (_) {
      return '';
    }
  }

  async function getManifest() {
    if (state.manifestTried) return state.manifest;
    state.manifestTried = true;
    try {
      const response = await fetch('/assets/persona/manifest.json', { cache: 'no-store' });
      if (response.ok) state.manifest = await response.json();
    } catch (_) {}
    return state.manifest;
  }

  function explicitMap() {
    const result = {};
    if (window.FOOD_PICKER_PERSONA_ART && typeof window.FOOD_PICKER_PERSONA_ART === 'object') {
      Object.assign(result, window.FOOD_PICKER_PERSONA_ART);
    }
    try {
      const local = JSON.parse(localStorage.getItem('foodpicker.persona-art') || '{}');
      if (local && typeof local === 'object') Object.assign(result, local);
    } catch (_) {}
    return result;
  }

  async function candidates(profile, meal) {
    const archetypeId = profile?.archetype?.id || profile?.archetypeId || '';
    const title = profile?.title || '';
    const map = explicitMap();
    const manifest = await getManifest();
    const values = [];

    [title, archetypeId, meal?.name].forEach(key => {
      if (key && map[key]) values.push(map[key]);
      if (key && manifest?.[key]) values.push(manifest[key]);
    });

    if (archetypeId) {
      values.push(
        `/assets/persona/${archetypeId}.webp`,
        `/assets/persona/${archetypeId}.png`,
        `/assets/persona/${archetypeId}.jpg`
      );
    }

    return [...new Set(values.map(safeExternal).filter(Boolean))];
  }

  async function load(profile, meal) {
    const list = await candidates(profile, meal);
    for (const url of list) {
      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = url;
        });
        return { url, image };
      } catch (_) {}
    }
    return null;
  }

  window.FoodPickerPersonaArt = Object.freeze({ load, candidates });
})();
