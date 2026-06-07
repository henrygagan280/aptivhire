import { NextRequest, NextResponse } from "next/server"

function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function extractTitle(html: string, text: string) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)

  if (h1Match?.[1]) {
    return cleanHtml(h1Match[1]).slice(0, 120)
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  if (titleMatch?.[1]) {
    return cleanHtml(titleMatch[1])
      .replace(/\|.*$/g, "")
      .replace(/- Careers.*$/gi, "")
      .trim()
      .slice(0, 120)
  }

  return text.slice(0, 80)
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid job URL." },
        { status: 400 }
      )
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: "The URL format is invalid." },
        { status: 400 }
      )
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only http and https URLs are supported." },
        { status: 400 }
      )
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AptivHireJobImporter/1.0; +https://aptivhire.net)",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        {
  error:
    "We couldn't read this job page. Some job boards block automatic imports. Try a company careers page, or copy and paste the job description instead."
},
        { status: 400 }
      )
    }

    const html = await response.text()
    const text = cleanHtml(html)

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Could not find enough job description text on that page." },
        { status: 400 }
      )
    }

    const jobTitle = extractTitle(html, text)
    const jobDescription = text.slice(0, 8000)

    return NextResponse.json({
      jobTitle,
      jobDescription,
      sourceUrl: parsedUrl.toString(),
    })
  } catch (error) {
    console.error("Import job URL error:", error)

    return NextResponse.json(
      { error: "Something went wrong while importing the job URL." },
      { status: 500 }
    )
  }
}