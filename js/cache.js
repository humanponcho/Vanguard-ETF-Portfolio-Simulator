function saveToCache() {
  localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify(readAllocations()));
}

function loadFromCache() {
  const cachedValues = JSON.parse(localStorage.getItem(ALLOCATION_STORAGE_KEY));

  if (cachedValues) {
    ASSETS.forEach(asset => {
      const cached = cachedValues[asset.key];
      // A holding added to ASSETS after this cache was written has no stored
      // value. Leave its default in place rather than writing undefined.
      if (typeof cached !== 'number') return;

      document.getElementById(valueId(asset.key)).value = cached;
      document.getElementById(sliderId(asset.key)).value = cached;
    });

    updateTotalAmount();
  }
}
