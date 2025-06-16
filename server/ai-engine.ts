import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export interface ContentGenerationRequest {
  keyword: string;
  content_type: 'blog_post' | 'product_comparison' | 'review_article' | 'video_script' | 'social_post' | 'email_campaign';
  tone_of_voice: string;
  target_audience: string;
  additional_context?: string;
  brand_voice?: string;
  seo_focus?: boolean;
  word_count?: number;
}

export interface ContentGenerationResponse {
  content_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_text?: string;
  title?: string;
  seo_title?: string;
  seo_description?: string;
  meta_tags?: string[];
  estimated_reading_time?: number;
  ai_model_used?: string;
  generation_time_ms?: number;
  error?: string;
}

export interface ContentQueue {
  [contentId: string]: {
    request: ContentGenerationRequest;
    response: ContentGenerationResponse;
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
  };
}

// In-memory content generation queue
const contentQueue: ContentQueue = {};

// Content type templates and specifications
const CONTENT_TEMPLATES = {
  blog_post: {
    min_words: 800,
    structure: ['introduction', 'main_points', 'conclusion', 'call_to_action'],
    seo_focus: true,
    tone_adaptable: true
  },
  product_comparison: {
    min_words: 600,
    structure: ['overview', 'feature_comparison', 'pros_cons', 'recommendation'],
    seo_focus: true,
    tone_adaptable: true
  },
  review_article: {
    min_words: 700,
    structure: ['product_intro', 'detailed_review', 'pros_cons', 'verdict'],
    seo_focus: true,
    tone_adaptable: true
  },
  video_script: {
    min_words: 300,
    structure: ['hook', 'introduction', 'main_content', 'call_to_action'],
    seo_focus: false,
    tone_adaptable: true
  },
  social_post: {
    min_words: 50,
    max_words: 280,
    structure: ['hook', 'value_proposition', 'call_to_action'],
    seo_focus: false,
    tone_adaptable: true
  },
  email_campaign: {
    min_words: 200,
    structure: ['subject_line', 'greeting', 'main_message', 'call_to_action'],
    seo_focus: false,
    tone_adaptable: true
  }
};

// AI Model selection logic
export function selectOptimalModel(request: ContentGenerationRequest): 'gemini' | 'claude' | 'mistral' {
  const { content_type, word_count } = request;
  
  // Gemini for most content types (primary model)
  if (content_type === 'blog_post' || content_type === 'review_article') {
    return 'gemini';
  }
  
  // Claude for creative/comparison content (if available)
  if (content_type === 'product_comparison' || content_type === 'video_script') {
    return process.env.ANTHROPIC_API_KEY ? 'claude' : 'gemini';
  }
  
  // Mistral for shorter, punchy content (if available)
  if (content_type === 'social_post' || content_type === 'email_campaign') {
    return process.env.MISTRAL_API_KEY ? 'mistral' : 'gemini';
  }
  
  return 'gemini'; // Default fallback
}

export function generateContentPrompt(request: ContentGenerationRequest): string {
  const template = CONTENT_TEMPLATES[request.content_type];
  const wordCount = request.word_count || template.min_words;
  
  let prompt = `You are an expert content creator specializing in ${request.content_type.replace('_', ' ')} writing.

CONTENT SPECIFICATIONS:
- Content Type: ${request.content_type.replace('_', ' ').toUpperCase()}
- Primary Keyword: ${request.keyword}
- Target Audience: ${request.target_audience}
- Tone of Voice: ${request.tone_of_voice}
- Word Count Target: ${wordCount} words
- Brand Voice: ${request.brand_voice || 'Authentic and trustworthy'}

REQUIREMENTS:
`;

  // Add content type specific requirements
  switch (request.content_type) {
    case 'blog_post':
      prompt += `
- Create a comprehensive blog post with clear structure
- Include engaging introduction, detailed main content, and strong conclusion
- Naturally incorporate the keyword "${request.keyword}" throughout
- Add relevant subheadings and bullet points for readability
- Include actionable insights and practical advice
- End with a compelling call-to-action`;
      break;
      
    case 'product_comparison':
      prompt += `
- Compare multiple products/services related to "${request.keyword}"
- Create detailed feature comparison tables or lists
- Highlight pros and cons for each option
- Provide clear recommendations based on different use cases
- Include pricing considerations and value propositions
- Maintain objectivity while guiding towards best choices`;
      break;
      
    case 'review_article':
      prompt += `
- Write an in-depth review of products/services related to "${request.keyword}"
- Include personal experience or expert analysis
- Cover features, performance, usability, and value
- Provide honest pros and cons assessment
- Include rating or scoring system
- Conclude with clear recommendation and target user profile`;
      break;
      
    case 'video_script':
      prompt += `
- Create an engaging video script with clear spoken dialogue
- Include [VISUAL CUES] and [ACTION NOTES] in brackets
- Start with a strong hook to capture attention within first 10 seconds
- Structure content for visual medium with clear transitions
- Include natural speaking patterns and conversational tone
- End with strong call-to-action and next steps`;
      break;
      
    case 'social_post':
      prompt += `
- Create punchy, engaging social media content
- Use attention-grabbing opening line
- Include relevant hashtags and mentions
- Optimize for platform engagement (likes, shares, comments)
- Keep within character limits while maximizing impact
- Include clear call-to-action or engagement prompt`;
      break;
      
    case 'email_campaign':
      prompt += `
- Write compelling email marketing content
- Create attention-grabbing subject line
- Use personalized greeting and conversational tone
- Structure with clear value proposition and benefits
- Include strong call-to-action with urgency or incentive
- Optimize for mobile reading and quick scanning`;
      break;
  }

  if (template.seo_focus && request.seo_focus !== false) {
    prompt += `

SEO OPTIMIZATION:
- Include the primary keyword "${request.keyword}" naturally 3-5 times
- Create SEO-optimized title (under 60 characters)
- Write compelling meta description (under 160 characters)
- Suggest 3-5 relevant meta tags
- Use semantic keywords and related terms
- Structure content with proper heading hierarchy`;
  }

  if (request.additional_context) {
    prompt += `

ADDITIONAL CONTEXT:
${request.additional_context}`;
  }

  prompt += `

FORMATTING REQUIREMENTS:
- Use proper Markdown formatting for structure and readability
- Start with an engaging introduction paragraph (2-3 sentences)
- Use clear heading hierarchy (## for main sections, ### for subsections)
- Include bullet points or numbered lists where appropriate
- Add bold text for emphasis on key points
- Create proper paragraph breaks for readability
- Include a strong conclusion with call-to-action
- Add affiliate links naturally within content using [Product Name](affiliate-link) format

CONTENT STRUCTURE FOR BLOG POSTS:
1. **Introduction** - Hook the reader and preview what they'll learn
2. **Main Content Sections** - 3-5 well-organized sections with descriptive headings
3. **Practical Examples** - Include real-world applications or case studies
4. **Benefits/Features** - Highlight key advantages and value propositions
5. **Comparison/Alternatives** - If relevant, compare different options
6. **Conclusion** - Summarize key points and provide clear next steps

TONE AND STYLE:
Adopt the "${request.tone_of_voice}" voice throughout. This should influence:
- Word choice and vocabulary level
- Sentence structure and length
- Level of formality or casualness
- Use of humor, technical terms, or colloquialisms
- Overall personality and approach

OUTPUT FORMAT:
Please provide the content in the following JSON structure:
{
  "title": "Engaging, benefit-focused title",
  "content": "Well-formatted Markdown content with proper structure, headings, and formatting",
  "seo_title": "SEO-optimized title (under 60 characters)",
  "seo_description": "Compelling meta description (under 160 characters)",
  "meta_tags": ["relevant", "keyword", "tags"],
  "estimated_reading_time": number_in_minutes
}

Generate high-quality, original content that provides genuine value to the target audience while naturally promoting affiliate opportunities through well-structured, professional formatting.`;

  return prompt;
}

export async function generateWithGemini(prompt: string): Promise<any> {
  try {
    console.log('Attempting Gemini API call...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API call successful');
    
    // Try to parse as JSON, fallback to plain text
    try {
      return JSON.parse(text);
    } catch {
      return {
        title: "Generated Content",
        content: text,
        seo_title: "",
        seo_description: "",
        meta_tags: [],
        estimated_reading_time: Math.ceil(text.split(' ').length / 200)
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini generation failed: ${error.message || error}`);
  }
}

export async function generateWithClaude(prompt: string): Promise<any> {
  // Placeholder for Claude integration
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Claude API key not available");
  }
  
  // TODO: Implement Claude API integration
  throw new Error("Claude integration not yet implemented");
}

export async function generateWithMistral(prompt: string): Promise<any> {
  // Placeholder for Mistral integration
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("Mistral API key not available");
  }
  
  // TODO: Implement Mistral API integration
  throw new Error("Mistral integration not yet implemented");
}

export async function generateContent(
  contentId: string,
  request: ContentGenerationRequest,
  databaseContentId?: number,
  updateContentCallback?: (contentId: number, updates: any) => Promise<void>
): Promise<ContentGenerationResponse> {
  const startTime = Date.now();
  
  try {
    // Update queue status
    contentQueue[contentId].response.status = 'processing';
    contentQueue[contentId].started_at = new Date();
    
    // Select optimal AI model
    const selectedModel = selectOptimalModel(request);
    
    // Generate prompt
    const prompt = generateContentPrompt(request);
    
    // Generate content with selected model
    let generatedContent;
    switch (selectedModel) {
      case 'gemini':
        generatedContent = await generateWithGemini(prompt);
        break;
      case 'claude':
        generatedContent = await generateWithClaude(prompt);
        break;
      case 'mistral':
        generatedContent = await generateWithMistral(prompt);
        break;
      default:
        generatedContent = await generateWithGemini(prompt);
    }
    
    const generationTime = Date.now() - startTime;
    
    // Update response
    const response: ContentGenerationResponse = {
      content_id: contentId,
      status: 'completed',
      generated_text: generatedContent.content,
      title: generatedContent.title,
      seo_title: generatedContent.seo_title,
      seo_description: generatedContent.seo_description,
      meta_tags: generatedContent.meta_tags || [],
      estimated_reading_time: generatedContent.estimated_reading_time,
      ai_model_used: selectedModel,
      generation_time_ms: generationTime
    };
    
    // Update queue
    contentQueue[contentId].response = response;
    contentQueue[contentId].completed_at = new Date();
    
    // Update database content if callback provided
    if (updateContentCallback && databaseContentId) {
      try {
        await updateContentCallback(databaseContentId, {
          title: generatedContent.title || `Generated Content - ${request.keyword}`,
          content: generatedContent.content,
          seoTitle: generatedContent.seo_title,
          seoDescription: generatedContent.seo_description,
          status: 'published'
        });
      } catch (dbError) {
        console.error('Failed to update database content:', dbError);
      }
    }
    
    return response;
    
  } catch (error: any) {
    const response: ContentGenerationResponse = {
      content_id: contentId,
      status: 'failed',
      error: error.message,
      ai_model_used: 'none',
      generation_time_ms: Date.now() - startTime
    };
    
    contentQueue[contentId].response = response;
    contentQueue[contentId].completed_at = new Date();
    
    return response;
  }
}

export function addToQueue(request: ContentGenerationRequest): string {
  const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  contentQueue[contentId] = {
    request,
    response: {
      content_id: contentId,
      status: 'pending'
    },
    created_at: new Date()
  };
  
  // Process asynchronously
  setTimeout(() => {
    generateContent(contentId, request).catch(console.error);
  }, 0);
  
  return contentId;
}

export function addToQueueWithCallback(
  request: ContentGenerationRequest,
  databaseContentId: number,
  updateCallback: (contentId: number, updates: any) => Promise<void>
): string {
  const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  contentQueue[contentId] = {
    request,
    response: {
      content_id: contentId,
      status: 'pending'
    },
    created_at: new Date()
  };
  
  // Process asynchronously with database callback
  setTimeout(() => {
    generateContent(contentId, request, databaseContentId, updateCallback).catch(console.error);
  }, 0);
  
  return contentId;
}

export function getQueueStatus(contentId: string): ContentGenerationResponse | null {
  return contentQueue[contentId]?.response || null;
}

export function getAllQueueItems(): ContentQueue {
  return contentQueue;
}

// Clean up old completed items (older than 24 hours)
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  Object.keys(contentQueue).forEach(contentId => {
    const item = contentQueue[contentId];
    if (item.completed_at && item.completed_at < oneDayAgo) {
      delete contentQueue[contentId];
    }
  });
}, 60 * 60 * 1000); // Run cleanup every hour