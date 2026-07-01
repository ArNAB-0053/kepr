import type { ProblemData, TopicTag } from "./types"

/**
 * Extracts the raw, parsed JSON object containing LeetCode query information.
 * Next.js embeds the initial page state inside a `<script id="__NEXT_DATA__">` element.
 * 
 * Since Chrome extension content scripts execute in an "isolated world" (sharing the DOM
 * but NOT the JavaScript context of the webpage), reading window.__NEXT_DATA__ directly 
 * would yield `undefined`. 
 * 
 * To bypass this constraint, we query the HTML DOM for the script tag, extract its text content,
 * and parse it. This ensures we get the pre-fetched state containing problem details.
 */
export function getRawQuestionData(): any {
  // Query the script tag containing Next.js pre-fetched data
  const scriptTag = document.getElementById("__NEXT_DATA__")
  if (!scriptTag || !scriptTag.textContent) {
    return null
  }

  try {
    // Parse the script content as JSON
    const nextData = JSON.parse(scriptTag.textContent)
    
    // LeetCode stores React Query caches under dehydratedState.queries
    const queries = nextData?.props?.pageProps?.dehydratedState?.queries || []
    
    // Find the query that holds the question details (key includes "questionDetail")
    const questionQuery = queries.find(
      (q: any) => q.queryKey?.[0] === "questionDetail"
    )
    
    // If not found by queryKey, search for any query containing the 'question' data object as a fallback
    if (!questionQuery) {
      const fallbackQuery = queries.find(
        (q: any) => q.state?.data?.question !== undefined
      )
      return fallbackQuery?.state?.data?.question || null
    }
    
    return questionQuery?.state?.data?.question || null
  } catch (error) {
    console.error("[Kepr] Error parsing LeetCode __NEXT_DATA__:", error)
    return null
  }
}

/**
 * Reusable utility to extract and structure problem metadata.
 * It formats the raw extracted LeetCode query data into a clean, typed ProblemData object.
 * Returns null if the problem details are not found.
 */
export function getProblemData(): ProblemData | null {
  const rawQuestion = getRawQuestionData()
  if (!rawQuestion) {
    return null
  }

  // Convert the TopicTag array to a simple array of string names
  // e.g., [{ name: "Array", slug: "array" }] becomes ["Array"]
  const topics = rawQuestion.topicTags
    ? rawQuestion.topicTags.map((tag: TopicTag) => tag.name)
    : []

  return {
    title: rawQuestion.title || "",
    titleSlug: rawQuestion.titleSlug || "",
    difficulty: rawQuestion.difficulty || "",
    topics,
    url: window.location.href
  }
}
