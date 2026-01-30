<template>
  <div :class="['x-analyzer-container', theme]">
    <AnalyzerButton 
      v-if="!showSidebar"
      @click="startAnalysis"
      :is-analyzing="isAnalyzing"
    />
    <SidebarPanel
      v-if="showSidebar"
      :results="analysisResults"
      :is-loading="isAnalyzing"
      @close="showSidebar = false"
      @pin="handlePin"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AnalyzerButton from './components/AnalyzerButton.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import { useXTheme } from './composables/useXTheme'
import { useThreadAnalyzer } from './composables/useThreadAnalyzer'
import type { AnalysisResult } from '../types'

const { theme } = useXTheme()
const { analyzeThread, isAnalyzing } = useThreadAnalyzer()

const showSidebar = ref(false)
const analysisResults = ref<AnalysisResult | null>(null)

const startAnalysis = async () => {
  showSidebar.value = true
  try {
    analysisResults.value = await analyzeThread()
  } catch (error) {
    console.error('Analysis failed:', error)
  }
}

const handlePin = (pinned: boolean) => {
  console.log('Sidebar pinned:', pinned)
}

onMounted(() => {
  console.log('X Thread Analyzer mounted')
})
</script>