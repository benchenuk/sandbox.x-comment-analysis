<template>
  <div :class="['sidebar-panel', { 'pinned': isPinned }]">
    <div class="sidebar-header">
      <h2>Thread Analysis</h2>
      <div class="header-actions">
        <button 
          class="pin-button"
          @click="togglePin"
          :title="isPinned ? 'Unpin' : 'Pin'"
        >
          <span v-if="isPinned">📌</span>
          <span v-else>📍</span>
        </button>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>
    </div>
    
    <div class="sidebar-content">
      <LoadingState v-if="isLoading" />
      <AnalysisResults v-else-if="results" :results="results" />
      <div v-else class="empty-state">
        <p>Click analyze to start</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingState from './LoadingState.vue'
import AnalysisResults from './AnalysisResults.vue'
import type { AnalysisResult } from '../../types'

defineProps<{
  results: AnalysisResult | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  close: []
  pin: [pinned: boolean]
}>()

const isPinned = ref(true)

const togglePin = () => {
  isPinned.value = !isPinned.value
  emit('pin', isPinned.value)
}
</script>

<style scoped>
.sidebar-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: var(--x-bg-primary, #ffffff);
  border-left: 1px solid var(--x-border, #eff3f4);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--x-border, #eff3f4);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--x-text-primary, #0f1419);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.pin-button,
.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s;
}

.pin-button:hover,
.close-button:hover {
  background: var(--x-bg-hover, rgba(0, 0, 0, 0.05));
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--x-text-secondary, #536471);
}
</style>