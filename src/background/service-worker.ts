import type { XComment, AnalysisResult } from '../types'

interface AnalyzeRequest {
  type: 'ANALYZE_COMMENTS'
  payload: {
    comments: XComment[]
  }
}

// Get settings from storage
const getSettings = async () => {
  const result = await chrome.storage.sync.get({
    apiEndpoint: '',
    apiKey: '',
    maxComments: 50
  })
  return result
}

// Call external API
const analyzeComments = async (comments: XComment[]): Promise<AnalysisResult> => {
  const settings = await getSettings()
  
  if (!settings.apiEndpoint) {
    throw new Error('API endpoint not configured. Please set it in extension options.')
  }
  
  try {
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': settings.apiKey ? `Bearer ${settings.apiKey}` : ''
      },
      body: JSON.stringify({
        comments: comments.slice(0, settings.maxComments),
        task: 'analyze_thread',
        instructions: 'Summarize and categorize these X/Twitter thread comments. Identify bots/trolls and filter them out. Highlight key insights and sentiment.'
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform API response to our format
    return {
      summary: data.summary || 'Analysis completed',
      categories: data.categories || [
        {
          name: 'General Discussion',
          icon: '💬',
          comments: comments.slice(0, 5).map(c => ({ ...c, category: 'general' }))
        }
      ],
      stats: {
        totalComments: comments.length,
        filteredComments: data.filteredCount || 0,
        analyzedComments: data.analyzedCount || comments.length
      }
    }
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request: AnalyzeRequest, _sender, sendResponse) => {
  if (request.type === 'ANALYZE_COMMENTS') {
    analyzeComments(request.payload.comments)
      .then(result => {
        sendResponse({ data: result })
      })
      .catch(error => {
        sendResponse({ error: error.message })
      })
    
    return true // Keep message channel open for async
  }
})

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('X Thread Analyzer installed')
})