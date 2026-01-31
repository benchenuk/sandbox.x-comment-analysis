<template>
  <div 
    class="sidebar-panel"
    :style="{ width: `${sidebarWidth}px` }"
  >
    <!-- Resize Handle -->
    <div 
      class="resize-handle"
      @mousedown="startResize"
      title="Drag to resize"
    ></div>
    
    <div class="sidebar-header">
      <h2>Comment Analysis</h2>
      <div class="header-actions">
        <button class="close-button" @click="emit('close')" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6L18 18"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="sidebar-content">
      <!-- Loading State with Progress -->
      <div v-if="isLoading" class="loading-container">
        <LoadingState />
        <div v-if="progress > 0" class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
        </div>
        <p class="progress-text">{{ getProgressText(progress) }}</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f4212e" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3>Analysis Failed</h3>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <button class="retry-button" @click="emit('retry')" :disabled="isLoading">
            {{ isLoading ? 'Retrying...' : 'Try Again' }}
          </button>
        </div>
      </div>
      
      <!-- Results -->
      <AnalysisResults v-else-if="results" :results="results" />
      
      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--x-text-secondary, #536471)" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p>Ready to analyze</p>
        <p class="empty-subtext">Click the button below to start analyzing this thread</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingState from './LoadingState.vue'
import AnalysisResults from './AnalysisResults.vue'
import type { AnalysisResult } from '../../types'

const props = defineProps<{
  results: AnalysisResult | null
  isLoading: boolean
  error: string | null
  progress: number
  sidebarWidth: number
}>()

const emit = defineEmits<{
  close: []
  retry: []
  updateWidth: [width: number]
}>()

const isResizing = ref(false)

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = props.sidebarWidth
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    const delta = startX - e.clientX
    const newWidth = Math.max(350, Math.min(700, startWidth + delta))
    emit('updateWidth', newWidth)
  }
  
  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const getProgressText = (progress: number): string => {
  if (progress < 20) return 'Scraping comments...'
  if (progress < 40) return 'Preparing data...'
  if (progress < 80) return 'Analyzing with AI...'
  if (progress < 100) return 'Processing results...'
  return 'Complete!'
}
</script>

<style scoped>
.sidebar-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 450px;
  height: 100vh;
  background: var(--x-bg-primary, #ffffff);
  border-left: 1px solid var(--x-border, #eff3f4);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  left: -4px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 9999;
  background: transparent;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: var(--x-primary, #1d9bf0);
  opacity: 0.3;
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

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 16px;
  border-radius: 6px;
  transition: background 0.2s;
  color: var(--x-text-secondary, #536471);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: var(--x-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--x-text-primary, #0f1419);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Loading State with Progress */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar-container {
  width: 100%;
  height: 4px;
  background: var(--x-border, #eff3f4);
  border-radius: 2px;
  margin-top: 20px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1d9bf0, #1a8cd8);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 12px;
  font-size: 14px;
  color: var(--x-text-secondary, #536471);
}

/* Error State */
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--x-text-primary, #0f1419);
}

.error-message {
  font-size: 14px;
  color: var(--x-text-secondary, #536471);
  line-height: 1.5;
  margin-bottom: 24px;
  padding: 12px;
  background: rgba(244, 33, 46, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(244, 33, 46, 0.2);
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retry-button,
.settings-button {
  padding: 12px 20px;
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}

.retry-button {
  background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
  color: white;
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(29, 155, 240, 0.4);
}

.settings-button {
  background: var(--x-bg-primary, #ffffff);
  border: 1px solid var(--x-border, #cfd9de);
  color: var(--x-text-primary, #0f1419);
}

.settings-button:hover {
  background: var(--x-bg-secondary, #f7f9f9);
  border-color: var(--x-text-secondary, #536471);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--x-text-primary, #0f1419);
}

.empty-subtext {
  margin-top: 8px !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: var(--x-text-secondary, #536471) !important;
}
</style>
