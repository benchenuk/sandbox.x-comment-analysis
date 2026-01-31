import type { XComment, AnalysisResult } from '../types'

interface AnalyzeRequest {
  type: 'ANALYZE_COMMENTS'
  payload: {
    comments: XComment[]
    signal?: AbortSignal
  }
}

interface CancelRequest {
  type: 'CANCEL_ANALYSIS'
}

// Track active abort controllers
const activeControllers = new Map<string, AbortController>()

// Get settings from storage
const getSettings = async () => {
  const result = await chrome.storage.sync.get({
    apiEndpoint: '',
    apiKey: '',
    model: 'gpt-4',
    maxComments: 50,
    requestTimeout: 300000 // 5 minutes default (300 seconds)
  })
  return result
}

/**
 * Build full API URL from base endpoint
 * Auto-appends /chat/completions if not present
 */
const buildApiUrl = (baseEndpoint: string): string => {
  // Remove trailing slash if present
  let url = baseEndpoint.trim().replace(/\/$/, '')
  
  // If URL doesn't end with /chat/completions, append it
  if (!url.endsWith('/chat/completions')) {
    // Check if it ends with /v1, if so append /chat/completions
    if (url.endsWith('/v1')) {
      url = `${url}/chat/completions`
    } else {
      // Assume it's a base URL and append the full path
      url = `${url}/v1/chat/completions`
    }
  }
  
  return url
}

/**
 * Call external API (single attempt, no retry)
 */
const analyzeComments = async (
  comments: XComment[],
  externalSignal?: AbortSignal
): Promise<AnalysisResult> => {
  const settings = await getSettings()
  
  if (!settings.apiEndpoint) {
    throw new Error('API endpoint not configured. Please set it in extension options.')
  }
  
  // Validate URL format
  try {
    new URL(settings.apiEndpoint)
  } catch {
    throw new Error('Invalid API endpoint URL. Please check your settings.')
  }
  
  console.log(`[X Thread Analyzer] Starting API call with ${comments.length} comments`)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`
  }
  
  const requestBody = {
    model: settings.model || 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing social media comments. Analyze the provided X/Twitter thread comments and provide:
1. A concise summary (2-3 sentences)
2. Categories of comments (e.g., "Support", "Questions", "Criticism", "Off-topic", "Bot/Spam")
3. Identification of potential bots/trolls
4. Key insights and sentiment

IMPORTANT: For each comment in categories, include the comment ID to match back to the original data.

Return JSON format only with these fields:
- summary: string
- categories: array of {name, icon, comments} where comments have: {id, text, author}
- filteredCount: number (bots/trolls filtered)
- analyzedCount: number (total analyzed)`
      },
      {
        role: 'user',
        content: `Analyze these ${comments.length} comments from an X/Twitter thread:\n\n${
          comments.map((c) => 
            `ID:${c.id} | ${c.author}: "${c.text}" (Likes: ${c.likes}, Reposts: ${c.reposts})`
          ).join('\n')
        }`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }
  
  // Build full API URL
  const apiUrl = buildApiUrl(settings.apiEndpoint)
  console.log(`[X Thread Analyzer] Using API URL: ${apiUrl}`)
  console.log(`[X Thread Analyzer] Timeout: ${settings.requestTimeout}ms (${settings.requestTimeout / 1000}s)`)
  
  // Create abort controller for timeout
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => {
    timeoutController.abort()
  }, settings.requestTimeout)
  
  // Combine timeout signal with external signal (for cancellation)
  const abortHandler = () => {
    clearTimeout(timeoutId)
  }
  
  timeoutController.signal.addEventListener('abort', abortHandler)
  
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      timeoutController.abort()
    })
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: timeoutController.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      let errorMessage = `API error: ${response.status} ${response.statusText}`
      
      // Provide user-friendly error messages
      if (response.status === 401) {
        errorMessage = 'API authentication failed. Please check your API key.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (response.status >= 500) {
        errorMessage = 'API server error. Please try again later.'
      }
      
      throw new Error(`${errorMessage}${errorText ? ` - ${errorText}` : ''}`)
    }
    
    const data = await response.json()
    
    // Parse OpenAI-style response
    let analysisData: AnalysisResult
    
    if (data.choices && data.choices[0]?.message?.content) {
      // OpenAI/compatible API format
      const content = data.choices[0].message.content
      
      // Try to parse JSON from content
      try {
        const parsed = JSON.parse(content)
        
        // Process categories - ensure comments have full data
        const processedCategories = (parsed.categories || []).map((cat: any) => ({
          name: cat.name || 'Uncategorized',
          icon: cat.icon || '',
          comments: (cat.comments || []).map((comment: any) => {
            // If comment has an id, try to find the original comment data
            if (comment.id) {
              const originalComment = comments.find(c => c.id === comment.id)
              if (originalComment) {
                return { ...originalComment, category: cat.name }
              }
            }
            // Otherwise use the comment data as-is if it has text
            if (comment.text) {
              return comment
            }
            // Fallback: return a placeholder
            return null
          }).filter(Boolean)
        })).filter((cat: any) => cat.comments.length > 0)
        
        // If no valid categories, create a default one with all comments
        if (processedCategories.length === 0) {
          processedCategories.push({
            name: 'All Comments',
            icon: '',
            comments: comments.slice(0, 10)
          })
        }
        
        analysisData = {
          summary: parsed.summary || 'Analysis completed',
          categories: processedCategories,
          stats: {
            totalComments: comments.length,
            filteredComments: parsed.filteredCount || 0,
            analyzedComments: parsed.analyzedCount || comments.length
          }
        }
      } catch {
        // If not JSON, use content as summary
        analysisData = {
          summary: content,
          categories: [{
            name: 'All Comments',
            icon: '',
            comments: comments.slice(0, 10)
          }],
          stats: {
            totalComments: comments.length,
            filteredComments: 0,
            analyzedComments: comments.length
          }
        }
      }
    } else {
      // Direct API response format
      const processedCategories = (data.categories || []).map((cat: any) => ({
        name: cat.name || 'Uncategorized',
        icon: cat.icon || '',
        comments: (cat.comments || []).map((comment: any) => {
          if (comment.id) {
            const originalComment = comments.find(c => c.id === comment.id)
            if (originalComment) {
              return { ...originalComment, category: cat.name }
            }
          }
          if (comment.text) {
            return comment
          }
          return null
        }).filter(Boolean)
      })).filter((cat: any) => cat.comments.length > 0)
      
      if (processedCategories.length === 0) {
        processedCategories.push({
          name: 'All Comments',
          icon: '',
          comments: comments.slice(0, 10)
        })
      }
      
      analysisData = {
        summary: data.summary || 'Analysis completed',
        categories: processedCategories,
        stats: {
          totalComments: comments.length,
          filteredComments: data.filteredCount || 0,
          analyzedComments: data.analyzedCount || comments.length
        }
      }
    }
    
    // Log detailed results
    const totalInCategories = analysisData.categories.reduce((sum, cat) => sum + cat.comments.length, 0)
    console.log('[X Thread Analyzer] API call successful:')
    console.log(`  - Input: ${comments.length} comments`)
    console.log(`  - Categories: ${analysisData.categories.length}`)
    console.log(`  - Comments in categories: ${totalInCategories}`)
    console.log(`  - Filtered: ${analysisData.stats.filteredComments}`)
    
    return analysisData
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new Error('Analysis cancelled by user')
        }
        throw new Error(`Request timed out after ${settings.requestTimeout / 1000} seconds. The LLM may be overloaded.`)
      }
      throw error
    }
    throw new Error(String(error))
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request: AnalyzeRequest | CancelRequest, sender, sendResponse) => {
  const tabId = sender.tab?.id?.toString() || 'unknown'
  
  if (request.type === 'ANALYZE_COMMENTS') {
    console.log(`[X Thread Analyzer] Received ${request.payload.comments.length} comments for analysis`)
    
    // Create abort controller for this analysis
    const controller = new AbortController()
    activeControllers.set(tabId, controller)
    
    analyzeComments(request.payload.comments, controller.signal)
      .then(result => {
        activeControllers.delete(tabId)
        console.log('[X Thread Analyzer] Analysis successful')
        sendResponse({ data: result })
      })
      .catch(error => {
        activeControllers.delete(tabId)
        console.error('[X Thread Analyzer] Analysis failed:', error.message)
        sendResponse({ 
          error: error.message,
          code: error.name || 'ANALYSIS_ERROR'
        })
      })
    
    return true // Keep message channel open for async
  }
  
  if (request.type === 'CANCEL_ANALYSIS') {
    const controller = activeControllers.get(tabId)
    if (controller) {
      console.log(`[X Thread Analyzer] Cancelling analysis for tab ${tabId}`)
      controller.abort()
      activeControllers.delete(tabId)
      sendResponse({ cancelled: true })
    } else {
      sendResponse({ cancelled: false, reason: 'No active analysis' })
    }
    return false
  }
})

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[X Thread Analyzer] Extension installed', details.reason)
  
  // Set default settings on install
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      apiEndpoint: '',
      apiKey: '',
      model: 'gpt-4',
      maxComments: 50,
      theme: 'auto',
      requestTimeout: 300000 // 5 minutes
    })
  }
})

// Handle extension icon click
chrome.action?.onClicked?.addListener(() => {
  // Open options page
  chrome.runtime.openOptionsPage()
})
