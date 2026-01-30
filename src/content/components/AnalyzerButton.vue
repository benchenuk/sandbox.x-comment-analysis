<template>
  <button 
    :class="['analyzer-button', { 'analyzing': isAnalyzing }]"
    @click="$emit('click')"
  >
    <span v-if="isAnalyzing" class="spinner"></span>
    <svg v-else class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="label">{{ isAnalyzing ? 'Analyzing...' : 'Comment Analysis' }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isAnalyzing: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.analyzer-button {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
  color: white;
  border: none;
  border-radius: 9999px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(29, 155, 240, 0.4);
  transition: all 0.2s ease;
}

.analyzer-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(29, 155, 240, 0.5);
}

.analyzer-button.analyzing {
  background: linear-gradient(135deg, #8b98a5 0%, #6b7b8a 100%);
  cursor: not-allowed;
}

.icon {
  font-size: 18px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>