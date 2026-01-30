// Type definitions for X Thread Analyzer

export interface XComment {
  id: string
  text: string
  author: string
  timestamp: string
  likes: number
  reposts: number
  views: number
  category?: string
}

export interface Category {
  name: string
  icon: string
  comments: XComment[]
}

export interface AnalysisStats {
  totalComments: number
  filteredComments: number
  analyzedComments: number
}

export interface AnalysisResult {
  summary: string
  categories: Category[]
  stats: AnalysisStats
}

export interface ExtensionSettings {
  apiEndpoint: string
  apiKey: string
  maxComments: number
  theme: 'auto' | 'light' | 'dark'
}

export interface APIRequest {
  comments: XComment[]
  task: string
  instructions: string
}

export interface APIResponse {
  summary: string
  categories: Array<{
    name: string
    icon: string
    comments: XComment[]
  }>
  filteredCount: number
  analyzedCount: number
}