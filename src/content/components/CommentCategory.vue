<template>
  <div class="comment-category">
    <div class="category-header">
      <span class="category-name">{{ category.name }}</span>
      <span class="category-count">{{ category.comments.length }}</span>
    </div>
    
    <div class="category-comments">
      <div 
        v-for="comment in visibleComments" 
        :key="comment.id" 
        class="comment-item"
      >
        <div class="comment-meta">
          <span class="comment-author">{{ comment.author }}</span>
          <span class="comment-stats">{{ comment.likes }} likes · {{ comment.reposts }} reposts</span>
        </div>
        <p class="comment-text">{{ comment.text }}</p>
      </div>
      
      <button 
        v-if="category.comments.length > 3" 
        class="more-toggle"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Show less' : `+${category.comments.length - 3} more` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Category } from '../../types'

const props = defineProps<{
  category: Category
}>()

const isExpanded = ref(false)
const INITIAL_DISPLAY_COUNT = 3

const visibleComments = computed(() => {
  if (isExpanded.value) {
    return props.category.comments
  }
  return props.category.comments.slice(0, INITIAL_DISPLAY_COUNT)
})
</script>

<style scoped>
.comment-category {
  border-bottom: 1px solid var(--x-border, #eff3f4);
  padding: 12px 0;
}

.comment-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--x-text-primary, #0f1419);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.category-count {
  font-size: 12px;
  color: var(--x-text-secondary, #536471);
  background: var(--x-bg-secondary, #f7f9f9);
  padding: 2px 8px;
  border-radius: 12px;
}

.category-comments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item {
  padding: 8px 0;
  border-left: 2px solid var(--x-border, #eff3f4);
  padding-left: 12px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
  color: var(--x-text-primary, #0f1419);
}

.comment-stats {
  font-size: 11px;
  color: var(--x-text-secondary, #536471);
}

.comment-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--x-text-primary, #0f1419);
}

.more-toggle {
  font-size: 12px;
  color: var(--x-primary, #1d9bf0);
  padding: 4px 0 4px 12px;
  border-left: 2px solid var(--x-border, #eff3f4);
  background: none;
  border: none;
  border-left: 2px solid var(--x-border, #eff3f4);
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  transition: color 0.2s;
}

.more-toggle:hover {
  color: var(--x-primary-hover, #1a8cd8);
  text-decoration: underline;
}
</style>
