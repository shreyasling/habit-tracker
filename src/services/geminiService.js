// OpenRouter API Configuration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4.1-nano';

// Rate limiting configuration
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests
let lastRequestTime = 0;
let requestQueue = Promise.resolve();

// Cache for quotes to avoid repeated API calls
let cachedQuote = null;
let quoteTimestamp = 0;
const QUOTE_CACHE_DURATION = 10 * 60 * 1000; // Cache quotes for 10 minutes
let isQuoteFetching = false; // Flag to prevent concurrent fetches

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Rate-limited API call wrapper
 * Ensures minimum interval between requests
 */
async function rateLimitedFetch(url, options) {
    return new Promise((resolve, reject) => {
        requestQueue = requestQueue.then(async () => {
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;

            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
            }

            lastRequestTime = Date.now();

            try {
                const response = await fetch(url, options);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * Call OpenRouter API with a prompt (with retry logic for rate limiting)
 * @param {string} prompt - The prompt to send
 * @param {string} systemInstruction - Optional system instruction
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - The AI response
 */
export async function callGemini(prompt, systemInstruction = '', maxRetries = 3) {
    const messages = [];

    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const requestBody = {
        model: MODEL,
        messages: messages,
        reasoning: {
            enabled: true
        }
    };

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await rateLimitedFetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 429) {
                // Rate limited - wait with exponential backoff
                const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                console.warn(`Rate limited (429). Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
                await sleep(waitTime);
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response generated';
        } catch (error) {
            lastError = error;
            console.error(`OpenRouter API error (attempt ${attempt + 1}):`, error);

            if (attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt + 1) * 1000;
                await sleep(waitTime);
            }
        }
    }

    throw lastError || new Error('Failed to call OpenRouter API after retries');
}

/**
 * Parse user message to detect task completion intent using LLM
 * @param {string} message - User's message
 * @param {Array} tasks - List of available tasks
 * @param {number} currentDay - Current day of month
 * @returns {Promise<Object|null>} - Parsed intent or null
 */
export async function parseTaskCompletionIntent(message, tasks, currentDay) {
    const taskNames = tasks.map(t => t.name).join(', ');

    const systemInstruction = `You are an intelligent intent parser. Understand what the user MEANS, not just what they say literally.

USER'S TASKS: ${taskNames}
TODAY: Day ${currentDay} of the month

YOUR JOB: Determine if the user is saying they completed/finished/did a task, or wants to mark something as done.

Users express themselves in MANY ways:
- "I worked out this morning" → means they did exercise
- "just finished my book session" → means they read
- "done with everything today" → means all tasks complete
- "Yesterday I managed to meditate" → means meditation done yesterday
- "Crushed my workout on the 15th!" → means exercise done on day 15
- "Finally got around to studying" → means learn something new

Think about the MEANING, not exact words. Match to the closest task even with typos or synonyms.

RESPOND WITH ONLY JSON:

For ALL tasks done:
{"isTaskCompletion": true, "allTasks": true, "day": <number>}

For ONE specific task:
{"isTaskCompletion": true, "allTasks": false, "taskName": "<exact task name from list>", "day": <number>}

For regular questions/chat (not about completing tasks):
{"isTaskCompletion": false}

IMPORTANT: 
- "today" = day ${currentDay}
- "yesterday" = day ${currentDay - 1}
- Understand context and synonyms
- Match user's words to task names intelligently`;

    const prompt = `Parse this message and extract intent: "${message}"`;

    try {
        const response = await callGemini(prompt, systemInstruction, 1);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.isTaskCompletion) {
                const day = parsed.day || currentDay;

                // Handle "all tasks" command
                if (parsed.allTasks) {
                    return { allTasks: true, tasks: tasks, day };
                }

                // Handle single task
                if (parsed.taskName) {
                    const task = tasks.find(t =>
                        t.name.toLowerCase() === parsed.taskName.toLowerCase() ||
                        t.name.toLowerCase().includes(parsed.taskName.toLowerCase()) ||
                        parsed.taskName.toLowerCase().includes(t.name.toLowerCase())
                    );
                    if (task) {
                        return { task, day };
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Failed to parse task intent:', error);
        return null;
    }
}

/**
 * Get AI analysis of productivity data
 * @param {Object} stats - The productivity stats
 * @returns {Promise<string>} - Analysis and recommendations
 */
export async function analyzeProductivity(tasks, completionData, monthStats, taskStats) {
    const systemInstruction = `You are a helpful productivity coach AI. Analyze the user's habit tracking data and provide:
1. A brief summary of their progress (2-3 sentences)
2. Areas that need more focus (be specific about which tasks)
3. 2-3 actionable tips to improve
4. A motivational closing statement

Keep your response concise, friendly, and actionable. Use emojis sparingly for visual appeal.
Format with clear sections using **bold** headers.`;

    const prompt = `Analyze my productivity data for this month:

**Overall Stats:**
- Monthly completion rate: ${monthStats.percentage}%
- Total tasks completed: ${monthStats.completedCells} out of ${monthStats.totalCells}
- Current streak: ${monthStats.streak} days

**Task-by-Task Performance:**
${taskStats.map(t => `- ${t.name}: ${t.percentage}% completion (${t.completed}/${t.total} days)`).join('\n')}

Based on this data, what areas should I focus on and how can I improve?`;

    return callGemini(prompt, systemInstruction);
}

/**
 * Chat with AI about productivity
 * @param {string} message - User message
 * @param {Object} context - Context about user's data including daily details
 * @returns {Promise<string>} - AI response
 */
export async function chatWithAI(message, context) {
    // Build daily completion summary
    let dailyDetails = '';
    if (context.dailyData && context.dailyData.length > 0) {
        dailyDetails = `\n\n**Daily Completion Data for ${context.monthName} ${context.year}:**\n`;
        dailyDetails += context.dailyData.map(d =>
            `- Day ${d.day}: ${d.completed}/${d.total} tasks (${d.percentage}%)`
        ).join('\n');
    }

    // Build task-specific performance
    let taskDetails = '';
    if (context.taskStats && context.taskStats.length > 0) {
        taskDetails = `\n\n**Task Performance:**\n`;
        taskDetails += context.taskStats.map(t =>
            `- ${t.name}: ${t.percentage}% (${t.completed}/${t.total} days)`
        ).join('\n');
    }

    const systemInstruction = `You are a friendly AI assistant for a productivity tracking app. Help users with:
- Questions about their habits and productivity
- Motivation and encouragement
- Tips for building better habits
- General productivity advice

You have access to the user's complete productivity data:
- Current Month: ${context.monthName || 'Unknown'} ${context.year || ''}
- Monthly completion: ${context.monthlyPercentage}%
- Tasks being tracked: ${context.taskNames.join(', ')}
- Current streak: ${context.streak} days
${dailyDetails}
${taskDetails}

When the user asks about a specific day (like "Jan 11" or "day 11"), look up the completion data for that day and provide specific details about which tasks were completed.

Be concise, helpful, and encouraging. Keep responses under 150 words unless more detail is needed.`;

    return callGemini(message, systemInstruction);
}

// Fallback quotes when API fails
const FALLBACK_QUOTES = [
    '"The secret of getting ahead is getting started." - Mark Twain',
    '"Success is the sum of small efforts repeated day in and day out." - Robert Collier',
    '"We are what we repeatedly do. Excellence is not an act, but a habit." - Aristotle',
    '"Your habits will determine your future." - Jack Canfield',
    '"Small daily improvements are the key to staggering long-term results." - Unknown',
    '"Motivation is what gets you started. Habit is what keeps you going." - Jim Ryun',
    '"The only way to do great work is to love what you do." - Steve Jobs',
    '"Progress, not perfection." - Unknown'
];

/**
 * Get a motivational quote (with caching to reduce API calls)
 * @param {boolean} forceRefresh - Force a new quote even if cached
 * @returns {Promise<string>} - A motivational quote
 */
export async function getMotivationalQuote(forceRefresh = false) {
    const now = Date.now();

    // Return cached quote if still valid and not forcing refresh
    if (!forceRefresh && cachedQuote && (now - quoteTimestamp) < QUOTE_CACHE_DURATION) {
        return cachedQuote;
    }

    // Prevent concurrent fetches (fixes React StrictMode double-render)
    if (isQuoteFetching) {
        // Wait a bit and return cached or fallback
        await sleep(100);
        if (cachedQuote) return cachedQuote;
        return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    }

    isQuoteFetching = true;

    try {
        const systemInstruction = `Generate a short, inspiring motivational quote about productivity, habits, or personal growth. 
Return ONLY the quote and author in this format: "Quote here" - Author
Keep it under 20 words. Be varied and creative.`;

        const prompt = `Give me a motivational quote for today. Pick something inspiring about building habits, consistency, or achieving goals.`;

        // Use only 1 retry for quotes to reduce API calls
        const newQuote = await callGemini(prompt, systemInstruction, 1);

        // Cache the successful response
        cachedQuote = newQuote;
        quoteTimestamp = now;

        return newQuote;
    } catch (error) {
        console.warn('Failed to fetch AI quote, using fallback:', error.message);
        // Return a random fallback quote
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        // Cache the fallback to prevent more retries
        cachedQuote = fallback;
        quoteTimestamp = now;
        return fallback;
    } finally {
        isQuoteFetching = false;
    }
}
