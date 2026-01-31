import { ref } from 'vue'
import type { AnalysisResult, XComment } from '../../types'

export function useThreadAnalyzer() {
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)
  const abortController = ref<AbortController | null>(null)

  /**
   * Parse engagement count from X's formatted text
   * Handles formats like "1.2K", "5K", "1,234"
   */
  const parseEngagementCount = (text: string | null | undefined): number => {
    if (!text) return 0
    
    const cleanText = text.trim()
    
    // Handle "K" suffix (thousands)
    if (cleanText.includes('K')) {
      const num = parseFloat(cleanText.replace(/[^0-9.]/g, ''))
      return Math.floor(num * 1000)
    }
    
    // Handle "M" suffix (millions)
    if (cleanText.includes('M')) {
      const num = parseFloat(cleanText.replace(/[^0-9.]/g, ''))
      return Math.floor(num * 1000000)
    }
    
    // Handle regular numbers with commas
    return parseInt(cleanText.replace(/[^0-9]/g, '') || '0')
  }

  /**
   * Extract author name from X's user name element
   * Handles various X UI formats
   */
  const extractAuthor = (authorEl: Element | null): string => {
    if (!authorEl) return 'Unknown'
    
    // Try to find the display name (first text node)
    const text = authorEl.textContent || ''
    const lines = text.split('\n').filter(line => line.trim())
    
    // First non-empty line is usually the display name
    return lines[0]?.trim() || 'Unknown'
  }

  /**
   * Check if element is visible (not display:none, etc.)
   */
  const isVisible = (element: Element): boolean => {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0'
  }

  /**
   * Scrape comments from X thread
   * Only collects visible comments to avoid loading hidden/spam content
   */
  const scrapeComments = (): XComment[] => {
    const comments: XComment[] = []
    const seenIds = new Set<string>() // Prevent duplicates
    
    // X/Twitter uses article elements for tweets/comments
    const articles = document.querySelectorAll('article[data-testid="tweet"]')
    
    console.log(`[X Thread Analyzer] Found ${articles.length} articles`)
    
    articles.forEach((article, index) => {
      // Skip the first one (it's the original post)
      if (index === 0) return
      
      // Only process visible articles
      if (!isVisible(article)) {
        console.log(`[X Thread Analyzer] Skipping hidden article ${index}`)
        return
      }
      
      // Get tweet ID from article for deduplication
      const tweetId = article.getAttribute('data-tweet-id') || 
                     article.querySelector('a[href*="/status/"]')?.getAttribute('href')?.split('/status/')[1]?.split('/')[0] ||
                     `article-${index}`
      
      if (seenIds.has(tweetId)) {
        console.log(`[X Thread Analyzer] Skipping duplicate tweet ${tweetId}`)
        return
      }
      seenIds.add(tweetId)
      
      // Extract text content first
      const textEl = article.querySelector('[data-testid="tweetText"]')
      const text = textEl?.textContent?.trim() || ''
      
      // Check for images/media in the tweet
      const hasImages = article.querySelector('[data-testid="tweetPhoto"]') !== null
      
      // Skip only if no text AND has images (image-only tweets)
      // Keep comments that have text, even if they also have images
      if (!text && hasImages) {
        console.log(`[X Thread Analyzer] Skipping image-only comment ${index}`)
        return
      }
      
      // Skip if no text or too short (likely just media or emoji)
      if (!text || text.length < 5) {
        console.log(`[X Thread Analyzer] Skipping short/empty comment ${index}`)
        return
      }
      
      // Extract author
      const authorEl = article.querySelector('[data-testid="User-Name"]')
      const author = extractAuthor(authorEl)
      
      // Extract timestamp
      const timeEl = article.querySelector('time')
      const timestamp = timeEl?.getAttribute('datetime') || ''
      const displayTime = timeEl?.textContent?.trim() || ''
      
      // Get engagement metrics
      const likeEl = article.querySelector('[data-testid="like"]')
      const repostEl = article.querySelector('[data-testid="retweet"]')
      const replyEl = article.querySelector('[data-testid="reply"]')
      
      const likes = parseEngagementCount(likeEl?.textContent)
      const reposts = parseEngagementCount(repostEl?.textContent)
      const replies = parseEngagementCount(replyEl?.textContent)
      
      // Try to get view count if available
      const viewEl = article.querySelector('[data-testid="app-text-transition-container"]')
      const views = parseEngagementCount(viewEl?.textContent)
      
      // Check if this might be a promoted/ad tweet
      const isPromoted = article.querySelector('[data-testid="socialContext"]')?.textContent?.toLowerCase().includes('promoted') ||
                        article.textContent?.toLowerCase().includes('promoted')
      
      if (isPromoted) {
        console.log(`[X Thread Analyzer] Skipping promoted content ${index}`)
        return
      }
      
      comments.push({
        id: tweetId,
        text,
        author,
        timestamp,
        displayTime,
        likes,
        reposts,
        replies,
        views,
        engagement: likes + reposts + replies // Total engagement score
      })
      
      console.log(`[X Thread Analyzer] Collected comment ${comments.length}: "${text.substring(0, 50)}..." by ${author}`)
    })
    
    console.log(`[X Thread Analyzer] Total comments collected: ${comments.length}`)
    
    // Sort by engagement (highest first) and take top 50
    return comments
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, 35)
  }

  /**
   * Cancel ongoing analysis
   */
  const cancelAnalysis = async (): Promise<void> => {
    if (abortController.value) {
      console.log('[X Thread Analyzer] Cancelling analysis...')
      abortController.value.abort()
      
      // Also notify background script to cancel
      try {
        await chrome.runtime.sendMessage({ type: 'CANCEL_ANALYSIS' })
      } catch {
        // Ignore errors if background script is not responding
      }
      
      abortController.value = null
    }
    isAnalyzing.value = false
    progress.value = 0
  }

  /**
   * Analyze thread by scraping comments and sending to API
   */
  const analyzeThread = async (): Promise<AnalysisResult> => {
    // Cancel any existing analysis first to prevent duplicate requests
    if (isAnalyzing.value && abortController.value) {
      console.log('[X Thread Analyzer] Cancelling previous analysis before starting new one')
      await cancelAnalysis()
    }
    
    isAnalyzing.value = true
    error.value = null
    progress.value = 0
    
    // Create new abort controller for this analysis
    abortController.value = new AbortController()
    
    try {
      // Step 1: Scrape comments
      progress.value = 10
      const comments = scrapeComments()
      
      if (comments.length === 0) {
        throw new Error('No comments found. Make sure you\'re on a thread page with visible comments.')
      }
      
      progress.value = 30
      console.log(`[X Thread Analyzer] Sending ${comments.length} comments to API`)
      
      // Step 2: Send to background script for API call
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_COMMENTS',
        payload: { comments }
      })
      
      // Check if analysis was cancelled
      if (abortController.value?.signal.aborted) {
        throw new Error('Analysis cancelled')
      }
      
      progress.value = 80
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (!response.data) {
        throw new Error('No analysis data received from API')
      }
      
      progress.value = 100
      
      // Log the results for debugging
      const result = response.data as AnalysisResult
      const totalInCategories = result.categories?.reduce((sum, cat) => sum + (cat.comments?.length || 0), 0) || 0
      console.log(`[X Thread Analyzer] Analysis complete:`)
      console.log(`  - Input comments: ${comments.length}`)
      console.log(`  - Categories returned: ${result.categories?.length || 0}`)
      console.log(`  - Total comments in categories: ${totalInCategories}`)
      console.log(`  - Summary length: ${result.summary?.length || 0} chars`)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Don't show error for user cancellation
      if (errorMessage === 'Analysis cancelled' || errorMessage === 'Analysis cancelled by user') {
        console.log('[X Thread Analyzer] Analysis was cancelled by user')
        error.value = null
      } else {
        error.value = errorMessage
        console.error('[X Thread Analyzer] Analysis failed:', errorMessage)
      }
      
      throw err
    } finally {
      isAnalyzing.value = false
      abortController.value = null
    }
  }

  return {
    isAnalyzing,
    error,
    progress,
    analyzeThread,
    cancelAnalysis
  }
}
