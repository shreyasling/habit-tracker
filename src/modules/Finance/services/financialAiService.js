/**
 * AI Service for Finance Module
 * Uses OpenRouter API to parse natural language into structured financial data and answer queries
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4.1-nano';

/**
 * Call OpenRouter API
 */
async function callOpenRouter(systemPrompt, userPrompt, options = {}) {
    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userPrompt });

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                reasoning: {
                    enabled: true
                },
                ...options
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('OpenRouter API call failed:', error);
        throw error;
    }
}

/**
 * Parse natural language transaction intent
 * @param {string} text - User input
 * @param {Array} categories - Available categories
 * @param {Array} accounts - Available bank accounts
 */
export const parseTransactionIntentAI = async (text, categories, accounts) => {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured, falling back to regex parser');
        return null;
    }

    const categoriesList = categories.map(c => `${c.name} (id: ${c.id})`).join(', ');
    const accountsList = accounts.map(a => `${a.name} (id: ${a.id})`).join(', ');

    const systemPrompt = `You are a smart financial assistant. Your job is to extract transaction details from user input.

AVAILABLE CATEGORIES: ${categoriesList}
AVAILABLE ACCOUNTS: ${accountsList}

INSTRUCTIONS:
1. Identify if the user wants to add an expense or income.
2. Extract the AMOUNT (number).
3. Identify the CATEGORY based on keywords. detailed mapping is preferred. If unknown, use 'others'.
4. Identify the ACCOUNT if mentioned. If not mentioned, use the first account ID or leave empty.
5. Extract a short NOTE/DESCRIPTION.
6. Handle MULTIPLE transactions in a single sentence (e.g., "Spent 50 on food and 20 on bus").

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects. No markdown.
[
    {
        "type": "expense" | "income",
        "amount": number,
        "categoryId": "string (category id)",
        "categoryName": "string (category name)",
        "bankAccountId": "string (account id)",
        "note": "string"
    }
]

If the input is NOT a transaction request (e.g. "How much did I spend?"), return null.
`;

    const userPrompt = `Parse this input: "${text}"`;

    try {
        const response = await callOpenRouter(systemPrompt, userPrompt);
        if (!response) return null;

        // Clean markdown code blocks if any
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();

        // Attempt to parse JSON
        try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
            return null;
        } catch (e) {
            console.error('Failed to parse AI JSON response:', e);
            return null;
        }

    } catch (error) {
        console.error('AI Intent Parsing Error:', error);
        return null;
    }
};

/**
 * Chat with Finance AI
 * @param {string} text - User question
 * @param {Object} context - Financial context (balance, spending, transactions)
 */
export const chatWithFinanceAI = async (text, context) => {
    if (!OPENROUTER_API_KEY) {
        return "I can't connect to my brain right now (API Key missing).";
    }

    const todayDateStr = new Date().toDateString(); // "Fri Jan 30 2026"

    // Filter today's transactions
    const todaysTransactions = context.recentTransactions.filter(t =>
        new Date(t.date).toDateString() === todayDateStr
    );

    const todaysTxString = todaysTransactions.length > 0
        ? todaysTransactions.map(t => `- ${context.symbol}${t.amount} (${t.categoryName}) for ${t.note || 'no description'}`).join('\n')
        : "No transactions recorded yet today.";

    // Get last 20 transactions for context
    const recentTxString = context.recentTransactions.slice(0, 20).map(t =>
        `- [${new Date(t.date).toLocaleDateString()}] ${t.type === 'expense' ? 'Spent' : 'Received'} ${context.symbol}${t.amount} on ${t.categoryName} (${t.note || ''})`
    ).join('\n');

    const stats = `
    Current Date: ${todayDateStr}
    Total Balance: ${context.symbol}${context.totalBalance}
    Monthly Spending: ${context.symbol}${context.monthlySpend}
    Monthly Budget: ${context.symbol}${context.budget}
    Remaining Budget: ${context.symbol}${context.remaining}
    `;

    const systemPrompt = `You are a helpful financial assistant called "Penny".
    
YOUR KNOWLEDGE BASE:
${stats}

TODAY'S ACTIVITY:
${todaysTxString}

RECENT HISTORY (Last 20 transactions):
${recentTxString}

INSTRUCTIONS:
- Answer the user's question based strictly on the data provided.
- If asked "how much did I spend on X today", look at TODAY'S ACTIVITY.
- If asked about past spending, look at RECENT HISTORY.
- If the data is not in the list, state that you don't have that record.
- Be concise, friendly, and encouraging.
- Do NOT make up data or transactions.
`;

    const userPrompt = text;

    try {
        return await callOpenRouter(systemPrompt, userPrompt);
    } catch (error) {
        console.error('Finance Chat Error:', error);
        return "I'm having trouble analyzing your finances right now. Please try again.";
    }
};
