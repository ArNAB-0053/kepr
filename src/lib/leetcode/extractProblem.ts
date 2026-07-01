import type { ProblemData } from "../types/problem"

/**
 * Extracts raw question data from Next.js __NEXT_DATA__ script block.
 */
export function getRawQuestionData(): any {
  const scriptTag = document.getElementById("__NEXT_DATA__")
  if (!scriptTag || !scriptTag.textContent) {
    return null
  }

  try {
    const nextData = JSON.parse(scriptTag.textContent)
    const queries = nextData?.props?.pageProps?.dehydratedState?.queries || []
    
    const questionQuery = queries.find(
      (q: any) => q.queryKey?.[0] === "questionDetail"
    )
    
    if (!questionQuery) {
      const fallbackQuery = queries.find(
        (q: any) => q.state?.data?.question !== undefined
      )
      return fallbackQuery?.state?.data?.question || null
    }
    
    return questionQuery?.state?.data?.question || null
  } catch (error) {
    console.error("[Kepr] Error parsing __NEXT_DATA__:", error)
    return null
  }
}

/**
 * Helper to fetch problem details from LeetCode's public GraphQL API.
 * Used during client-side navigation since __NEXT_DATA__ script remains static.
 */
async function fetchProblemDetails(slug: string): Promise<any> {
  const query = `
    query questionTitle($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
      }
    }
  `

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { titleSlug: slug },
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL fetch failed: ${response.statusText}`)
  }

  const { data } = await response.json()
  return data?.question || null
}

/**
 * Formats raw problem results from either Next.js or GraphQL.
 */
function formatProblem(rawQuestion: any): ProblemData {
  const topics = rawQuestion.topicTags
    ? rawQuestion.topicTags.map((tag: any) => tag.name)
    : []

  const rawId = rawQuestion.questionFrontendId || rawQuestion.questionId || ""
  let formattedId = String(rawId).trim()
  
  // Pad numerical IDs to 4 characters for clean sorting in folders (e.g. "1" -> "0001")
  if (formattedId && !isNaN(Number(formattedId))) {
    formattedId = formattedId.padStart(4, "0")
  }

  return {
    id: formattedId,
    title: rawQuestion.title || "",
    slug: rawQuestion.titleSlug || "",
    difficulty: rawQuestion.difficulty || "",
    topics,
    url: `https://leetcode.com/problems/${rawQuestion.titleSlug}/`
  }
}

/**
 * Asynchronously extracts and formats problem data.
 * First checks if the URL matches the static __NEXT_DATA__ content.
 * If there is a mismatch (caused by SPA navigation), fetches the details dynamically via GraphQL.
 */
export async function getProblemData(): Promise<ProblemData | null> {
  const pathParts = window.location.pathname.split("/")
  const slug = pathParts[2] // Expecting: /problems/{slug}/
  
  if (!slug) return null

  // Try static extraction first
  const rawQuestion = getRawQuestionData()
  if (rawQuestion && rawQuestion.titleSlug === slug) {
    return formatProblem(rawQuestion)
  }

  // Fall back to GraphQL query for client-side routing updates
  try {
    const gqlQuestion = await fetchProblemDetails(slug)
    if (gqlQuestion) {
      return formatProblem(gqlQuestion)
    }
  } catch (error) {
    console.error("[Kepr] Failed to resolve problem via GraphQL:", error)
  }

  return null
}
