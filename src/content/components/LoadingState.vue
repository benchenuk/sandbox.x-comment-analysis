<template>
  <div class="loading-state">
    <div class="spinner-large"></div>
    <p>Analyzing comments...</p>
    <p class="sub-text">This may take up a few minues, come back later.</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid var(--x-border, #eff3f4);
  border-top-color: var(--x-primary, #1d9bf0);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

p {
  margin: 0;
  color: var(--x-text-primary, #0f1419);
  font-weight: 600;
}

.sub-text {
  margin-top: 8px;
  font-size: 14px;
  color: var(--x-text-secondary, #536471);
  font-weight: 400;
}
</style>