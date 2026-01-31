<template>
  <div :class="['x-analyzer-container', theme]">
    <AnalyzerButton 
      v-if="isOnThreadPage && !showSidebar"
      @click="startAnalysis"
      :is-analyzing="isAnalyzing"
    />
    <SidebarPanel
      v-if="showSidebar"
      :key="sidebarKey"
      :results="analysisResults"
      :is-loading="isAnalyzing"
      :error="error"
      :progress="progress"
      @close="handleClose"
      @retry="startAnalysis"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import AnalyzerButton from './components/AnalyzerButton.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import { useXTheme } from './composables/useXTheme'
import { useThreadAnalyzer } from './composables/useThreadAnalyzer'
import type { AnalysisResult } from '../types'

const { theme } = useXTheme()
const { analyzeThread, cancelAnalysis, isAnalyzing, error, progress } = useThreadAnalyzer()

const showSidebar = ref(false)
const analysisResults = ref<AnalysisResult | null>(null)
const currentPath = ref(window.location.pathname)
const sidebarKey = ref(0)

const isOnThreadPage = computed(() => {
  // Match patterns like /username/status/123456
  return /\/[^/]+\/status\/\d+/.test(currentPath.value)
})

let pathObserver: MutationObserver | null = null

const startAnalysis = async () => {
  showSidebar.value = true
  analysisResults.value = null
  sidebarKey.value++ // Force sidebar re-render to clear error state
  
  try {
    analysisResults.value = await analyzeThread()
  } catch (err) {
    // Error is already set in the composable
    console.error('[X Thread Analyzer] Analysis failed:', err)
    // Ensure analysisResults stays null on error
    analysisResults.value = null
  }
}

const handleClose = async () => {
  // Cancel analysis if still running
  if (isAnalyzing.value) {
    await cancelAnalysis()
  }
  showSidebar.value = false
}

onMounted(() => {
  console.log('[X Thread Analyzer] Extension mounted successfully')
  
  // Watch for URL changes (X is a SPA)
  pathObserver = new MutationObserver(() => {
    const newPath = window.location.pathname
    if (newPath !== currentPath.value) {
      currentPath.value = newPath
      // Close sidebar when navigating away from thread
      if (!isOnThreadPage.value) {
        showSidebar.value = false
      }
    }
  })
  
  pathObserver.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  pathObserver?.disconnect()
})
</script>