/**
 * AI Service for Tomorrow Plans
 * Uses Gemini to parse natural language into structured tasks
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Parse natural language plan into structured tasks
 */
export const generatePlanFromText = async (userInput, existingTasks = []) => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const prompt = `You are a smart daily planner assistant. Parse the user's description of their day and create a structured schedule.

Current time: ${currentTime}

User's plan description:
"${userInput}"

${existingTasks.length > 0 ? `
IMPORTANT - These time slots are ALREADY OCCUPIED (DO NOT overlap with these):
${existingTasks.map(t => `- ${t.startTime} to ${t.endTime}: ${t.title}`).join('\n')}

You MUST schedule new tasks in the gaps between these busy slots. Never create overlapping times.
` : ''}

Create 4-6 realistic time-slot tasks based on their description. Each task should have:
- Realistic duration (30 min to 2 hours typically)
- 10-15 minute buffer between tasks
- Clear, actionable title
- Brief helpful description
- ABSOLUTELY NO overlapping with existing tasks

RESPOND ONLY with valid JSON array (no markdown, no explanation):
[
  {
    "startTime": "HH:MM",
    "endTime": "HH:MM", 
    "title": "Task title",
    "description": "Brief description or tip",
    "priority": "high" | "medium" | "low"
  }
]

Rules:
- Use 24-hour format for times (e.g., "09:00", "14:30")
- Start from current time or later if they mention "now"
- Keep tasks focused and achievable
- Add motivating descriptions
- NEVER overlap with existing occupied time slots
- If user mentions vague times like "morning", use sensible defaults (morning: 09:00-12:00, afternoon: 12:00-17:00, evening: 17:00-21:00)`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate plan');
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
    if (!GEMINI_API_KEY || !tasks || tasks.length === 0) {
        return null;
    }

    const prompt = `Analyze this daily schedule and provide brief helpful suggestions:

Schedule:
${tasks.map(t => `- ${t.startTime}-${t.endTime}: ${t.title} (${t.status})`).join('\n')}

Provide 1-2 short suggestions (max 50 words total). Consider:
- Are there enough breaks?
- Is the schedule realistic?
- Any tasks that might need more time?

Respond with just the suggestions, no formatting.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 100 }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        return null;
    }
};

/**
 * Chat with AI about today's tasks
 */
export const chatAboutTasks = async (message, tasks, chatHistory = []) => {
    if (!GEMINI_API_KEY) {
        return "AI assistant is not configured. Please add your Gemini API key.";
    }

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'not-started').length,
        inProgress: tasks.filter(t => t.status === 'partial' || t.status === 'tried').length
    };

    const systemContext = `You are a helpful daily planning assistant. Be concise and encouraging.

Today's schedule:
${tasks.length > 0
            ? tasks.map(t => `- ${t.startTime}-${t.endTime}: ${t.title} [${t.status}]`).join('\n')
            : 'No tasks planned yet'
        }

Stats: ${stats.total} total, ${stats.completed} done, ${stats.pending} pending

Previous messages:
${chatHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

User asks: "${message}"

Respond helpfully in 1-2 sentences. Be specific about their tasks when relevant.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemContext }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that. Try again!";
    } catch (error) {
        console.error('Chat Error:', error);
        return "Sorry, I'm having trouble connecting. Please try again.";
    }
};
