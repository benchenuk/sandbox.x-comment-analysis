<template>
  <div :class="['x-analyzer-container', theme]">
    <AnalyzerButton 
      v-if="isOnThreadPage && !showSidebar"
      @click="handleButtonClick"
      :is-analyzing="isAnalyzing"
      :has-results="!!analysisResults"
    />
    <SidebarPanel
      v-if="showSidebar"
      :results="analysisResults"
      :is-loading="isAnalyzing"
      :error="error"
      :progress="progress"
      :sidebar-width="sidebarWidth"
      @close="handleClose"
      @retry="startAnalysis"
      @update-width="updateSidebarWidth"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import AnalyzerButton from './components/AnalyzerButton.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import { useXTheme } from './composables/useXTheme'
import { useThreadAnalyzer } from './composables/useThreadAnalyzer'
import type { AnalysisResult } from '../types'

const { theme } = useXTheme()
const { analyzeThread, cancelAnalysis, isAnalyzing, error, progress } = useThreadAnalyzer()

const showSidebar = ref(false)
const sidebarWidth = ref(450)
const analysisResults = ref<AnalysisResult | null>(null)
const currentPath = ref(window.location.pathname)

const isOnThreadPage = computed(() => {
  return /\/[^/]+\/status\/\d+/.test(currentPath.value)
})

let pathObserver: MutationObserver | null = null

// Reset state when landing on any thread page
const resetState = () => {
  if (isAnalyzing.value) {
    cancelAnalysis()
  }
  analysisResults.value = null
  showSidebar.value = false
}

const startAnalysis = async () => {
  if (analysisResults.value || isAnalyzing.value) {
    return
  }
  
  try {
    analysisResults.value = await analyzeThread()
  } catch (err) {
    console.error('[X Thread Analyzer] Analysis failed:', err)
    analysisResults.value = null
  }
}

const handleButtonClick = () => {
  showSidebar.value = true
  
  if (!analysisResults.value && !isAnalyzing.value) {
    startAnalysis()
  }
}

const handleClose = () => {
  // Just hide the sidebar - analysis continues in background
  showSidebar.value = false
}

const updateSidebarWidth = (width: number) => {
  sidebarWidth.value = width
}

// Watch for thread changes and reset
watch(currentPath, (newPath, oldPath) => {
  const newThreadId = newPath.match(/\/status\/(\d+)/)?.[1]
  const oldThreadId = oldPath.match(/\/status\/(\d+)/)?.[1]
  
  // Reset if we landed on a different thread
  if (newThreadId && newThreadId !== oldThreadId) {
    resetState()
  }
})

onMounted(() => {
  console.log('[X Thread Analyzer] Extension mounted successfully')
  
  // Reset on initial load if on a thread page
  if (isOnThreadPage.value) {
    resetState()
  }
  
  // Watch for URL changes (X is a SPA)
  pathObserver = new MutationObserver(() => {
    const newPath = window.location.pathname
    if (newPath !== currentPath.value) {
      currentPath.value = newPath
    }
  })
  
  pathObserver.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  pathObserver?.disconnect()
})
</script>
