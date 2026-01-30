<template>
  <div class="comment-category">
    <div class="category-header" @click="isExpanded = !isExpanded">
      <span class="category-icon">{{ category.icon }}</span>
      <span class="category-name">{{ category.name }}</span>
      <span class="category-count">({{ category.comments.length }})</span>
      <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </div>
    
    <div v-if="isExpanded" class="category-comments">
      <div 
        v-for="comment in category.comments.slice(0, 3)" 
        :key="comment.id" 
        class="comment-card"
      >
        <div class="comment-header">
          <span class="comment-author">{{ comment.author }}</span>
          <span class="comment-time">{{ comment.timestamp }}</span>
        </div>
        <p class="comment-text">{{ comment.text }}</p>
        <div class="comment-stats">
          <span>❤️ {{ comment.likes }}</span>
          <span>🔄 {{ comment.reposts }}</span>
        </div>
      </div>
      
      <button v-if="category.comments.length > 3" class="show-more">
        Show {{ category.comments.length - 3 }} more
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Category } from '../../types'

defineProps<{
  category: Category
}>()

const isExpanded = ref(true)
</script>

<style scoped>
.comment-category {
  background: white;
  border: 1px solid var(--x-border, #eff3f4);
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  background: var(--x-bg-secondary, #f7f9f9);
  transition: background 0.2s;
}

.category-header:hover {
  background: var(--x-bg-hover, rgba(0, 0, 0, 0.05));
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-weight: 600;
  color: var(--x-text-primary, #0f1419);
  flex: 1;
}

.category-count {
  color: var(--x-text-secondary, #536471);
  font-size: 14px;
}

.expand-icon {
  font-size: 12px;
  color: var(--x-text-secondary, #536471);
}

.category-comments {
  padding: 12px;
}

.comment-card {
  padding: 12px;
  border-bottom: 1px solid var(--x-border, #eff3f4);
}

.comment-card:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: var(--x-text-primary, #0f1419);
}

.comment-time {
  font-size: 12px;
  color: var(--x-text-secondary, #536471);
}

.comment-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--x-text-primary, #0f1419);
}

.comment-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--x-text-secondary, #536471);
}

.show-more {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: none;
  border: 1px solid var(--x-border, #eff3f4);
  border-radius: 9999px;
  color: var(--x-primary, #1d9bf0);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.show-more:hover {
  background: var(--x-bg-hover, rgba(0, 0, 0, 0.05));
}
</style>