/**
 * AI Service for Tomorrow Plans
 * Uses OpenRouter API to parse natural language into structured tasks
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b:free';

/**
 * Call OpenRouter API
 */
async function callOpenRouter(systemPrompt, userPrompt, options = {}) {
    const messages = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            ...options
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}

/**
 * Parse natural language plan into structured tasks
 */
export const generatePlanFromText = async (userInput, existingTasks = []) => {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const systemPrompt = `You are a smart daily planner assistant. Your job is to EXTRACT and PRESERVE the exact schedule provided by the user.

Current time: ${currentTime}

CRITICAL RULES:
1. **RESPECT EXACT TIMES**: If the user provides specific times (like "09:00 AM - 10:00 AM"), you MUST use those EXACT times. Do NOT modify, shift, or create different times.
2. **EXTRACT, DON'T CREATE**: Parse the user's schedule and extract ALL tasks with their EXACT provided timings.
3. **CONVERT TO 24-HOUR FORMAT**: Convert any 12-hour format (AM/PM) to 24-hour format:
   - "09:00 AM" → "09:00"
   - "01:00 PM" → "13:00"
   - "10:00 PM" → "22:00"
   - "12:00 AM" → "00:00"

${existingTasks.length > 0 ? `
These time slots are ALREADY in the system (skip duplicates):
${existingTasks.map(t => `- ${t.startTime} to ${t.endTime}: ${t.title}`).join('\n')}
` : ''}

RESPOND ONLY with valid JSON array (no markdown, no explanation):
[
  {
    "startTime": "HH:MM",
    "endTime": "HH:MM", 
    "title": "Task title",
    "description": "Brief motivating description or tip for this task",
    "priority": "high" | "medium" | "low"
  }
]

Priority assignment:
- "high" for Academic, Project, Work tasks
- "medium" for Study, Development tasks
- "low" for Breaks, Health, Personal tasks

REMEMBER: Use the EXACT times the user gave. If they said "02:00 PM - 03:00 PM", output "14:00" to "15:00". Do NOT invent your own schedule!`;

    const userPrompt = `Extract ALL tasks from this schedule and preserve the EXACT times provided:\n\n${userInput}`;

    try {
        const textContent = await callOpenRouter(systemPrompt, userPrompt);

        if (!textContent) {
            throw new Error('No response from AI');
        }

        // Parse the JSON response
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Invalid AI response format');
        }

        const tasks = JSON.parse(jsonMatch[0]);

        // Validate and enhance tasks
        return tasks.map((task, index) => ({
            id: `ai_task_${Date.now()}_${index}`,
            startTime: task.startTime,
            endTime: task.endTime,
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            status: 'not-started',
            notificationEnabled: true,
            aiGenerated: true,
            createdAt: new Date().toISOString()
        }));

    } catch (error) {
        console.error('AI Plan Generation Error:', error);
        throw error;
    }
};

/**
 * Get AI suggestions for improving the schedule
 */
export const getScheduleSuggestions = async (tasks) => {
    if (!OPENROUTER_API_KEY || !tasks || tasks.length === 0) {
        return null;
    }

    const systemPrompt = `You are a helpful scheduling assistant. Provide brief, actionable suggestions.`;

    const userPrompt = `Analyze this daily schedule and provide brief helpful suggestions:

Schedule:
${tasks.map(t => `- ${t.startTime}-${t.endTime}: ${t.title} (${t.status})`).join('\n')}

Provide 1-2 short suggestions (max 50 words total). Consider:
- Are there enough breaks?
- Is the schedule realistic?
- Any tasks that might need more time?

Respond with just the suggestions, no formatting.`;

    try {
        return await callOpenRouter(systemPrompt, userPrompt);
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        return null;
    }
};

/**
 * Chat with AI about today's tasks
 */
export const chatAboutTasks = async (message, tasks, chatHistory = []) => {
    if (!OPENROUTER_API_KEY) {
        return "AI assistant is not configured. Please add your OpenRouter API key.";
    }

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'not-started').length,
        inProgress: tasks.filter(t => t.status === 'partial' || t.status === 'tried').length
    };

    const systemPrompt = `You are a helpful daily planning assistant. Be concise and encouraging.

Today's schedule:
${tasks.length > 0
            ? tasks.map(t => `- ${t.startTime}-${t.endTime}: ${t.title} [${t.status}]`).join('\n')
            : 'No tasks planned yet'
        }

Stats: ${stats.total} total, ${stats.completed} done, ${stats.pending} pending

Previous messages:
${chatHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

Respond helpfully in 1-2 sentences. Be specific about their tasks when relevant.`;

    const userPrompt = message;

    try {
        return await callOpenRouter(systemPrompt, userPrompt);
    } catch (error) {
        console.error('Chat Error:', error);
        return "Sorry, I'm having trouble connecting. Please try again.";
    }
};
