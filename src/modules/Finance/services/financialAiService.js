/**
 * AI Service for Finance Module - Enhanced Version
 * Smart financial assistant with date handling, mathematical analysis, and intelligent suggestions
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
 * Get date ranges for different time periods
 */
function getDateRanges() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    return {
        today: { start: today, end: now },
        yesterday: { start: yesterday, end: new Date(yesterday.getTime() + 86400000 - 1) },
        thisWeek: { start: thisWeekStart, end: now },
        lastWeek: { start: lastWeekStart, end: lastWeekEnd },
        thisMonth: { start: thisMonthStart, end: now },
        lastMonth: { start: lastMonthStart, end: lastMonthEnd },
        thisYear: { start: thisYearStart, end: now },
        lastYear: { start: lastYearStart, end: lastYearEnd },
        last7Days: { start: new Date(today.getTime() - 7 * 86400000), end: now },
        last30Days: { start: new Date(today.getTime() - 30 * 86400000), end: now },
        last90Days: { start: new Date(today.getTime() - 90 * 86400000), end: now }
    };
}

/**
 * Pre-compute all financial analytics from transactions
 */
function computeFinancialAnalytics(transactions, categories, symbol) {
    const dateRanges = getDateRanges();
    const now = new Date();

    // Helper to normalize date to start of day for comparison
    const normalizeDate = (dateInput) => {
        const d = new Date(dateInput);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Helper to check if date is in range (inclusive)
    const isInRange = (dateStr, range) => {
        const d = normalizeDate(dateStr);
        const start = normalizeDate(range.start);
        const end = normalizeDate(range.end);
        return d >= start && d <= end;
    };

    // Helper to format date
    const formatDate = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Group transactions by different periods
    const groupByPeriod = (txs, range) => txs.filter(t => isInRange(t.date, range));

    // Group by category
    const groupByCategory = (txs, type = null) => {
        const grouped = {};
        txs.forEach(t => {
            if (type && t.type !== type) return;
            const catId = t.categoryId || 'others';
            if (!grouped[catId]) {
                grouped[catId] = {
                    transactions: [],
                    total: 0,
                    count: 0,
                    categoryName: t.categoryName || catId
                };
            }
            grouped[catId].transactions.push(t);
            grouped[catId].total += t.amount;
            grouped[catId].count += 1;
        });
        return grouped;
    };

    // Calculate totals
    const calcTotals = (txs) => {
        let income = 0, expense = 0;
        txs.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });
        return { income, expense, net: income - expense };
    };

    // Get transactions for each period
    const todayTxs = groupByPeriod(transactions, dateRanges.today);
    const yesterdayTxs = groupByPeriod(transactions, dateRanges.yesterday);
    const thisWeekTxs = groupByPeriod(transactions, dateRanges.thisWeek);
    const lastWeekTxs = groupByPeriod(transactions, dateRanges.lastWeek);
    const thisMonthTxs = groupByPeriod(transactions, dateRanges.thisMonth);
    const lastMonthTxs = groupByPeriod(transactions, dateRanges.lastMonth);
    const last7DaysTxs = groupByPeriod(transactions, dateRanges.last7Days);
    const last30DaysTxs = groupByPeriod(transactions, dateRanges.last30Days);

    // Debug logging
    console.log('[FinanceAI] Date Ranges:', {
        thisMonth: { start: dateRanges.thisMonth.start.toISOString(), end: dateRanges.thisMonth.end.toISOString() },
        lastMonth: { start: dateRanges.lastMonth.start.toISOString(), end: dateRanges.lastMonth.end.toISOString() }
    });
    console.log('[FinanceAI] Total transactions passed:', transactions.length);
    console.log('[FinanceAI] This month transactions:', thisMonthTxs.length, 'Total expense:', calcTotals(thisMonthTxs).expense);
    console.log('[FinanceAI] Last month transactions:', lastMonthTxs.length, 'Total expense:', calcTotals(lastMonthTxs).expense);

    // Category-wise breakdown for this month
    const thisMonthByCategory = groupByCategory(thisMonthTxs, 'expense');
    const lastMonthByCategory = groupByCategory(lastMonthTxs, 'expense');

    // Calculate daily averages
    const daysInMonth = now.getDate();
    const dailyAvgSpend = daysInMonth > 0 ? calcTotals(thisMonthTxs).expense / daysInMonth : 0;

    // Find highest spending category
    let highestCategory = { name: 'None', total: 0 };
    Object.entries(thisMonthByCategory).forEach(([id, data]) => {
        if (data.total > highestCategory.total) {
            highestCategory = { name: data.categoryName, total: data.total, id };
        }
    });

    // Find biggest single expense
    const allExpenses = transactions.filter(t => t.type === 'expense');
    const biggestExpense = allExpenses.length > 0
        ? allExpenses.reduce((max, t) => t.amount > max.amount ? t : max, allExpenses[0])
        : null;

    // Generate category summary string
    const generateCategorySummary = (categoryData) => {
        return Object.entries(categoryData)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([id, data]) => `  - ${data.categoryName}: ${symbol}${data.total.toFixed(2)} (${data.count} transactions)`)
            .join('\n');
    };

    // Transaction list formatter with date
    const formatTransactionList = (txs, limit = 50) => {
        return txs.slice(0, limit).map(t => {
            const d = new Date(t.date);
            const dateStr = formatDate(d);
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return `  [${dateStr} ${timeStr}] ${t.type === 'expense' ? 'SPENT' : 'RECEIVED'} ${symbol}${t.amount} on ${t.categoryName || t.categoryId}${t.note ? ` - "${t.note}"` : ''}`;
        }).join('\n');
    };

    // Spending trends
    const weekOverWeek = lastWeekTxs.length > 0
        ? ((calcTotals(thisWeekTxs).expense - calcTotals(lastWeekTxs).expense) / calcTotals(lastWeekTxs).expense * 100).toFixed(1)
        : 0;

    return {
        dateRanges,
        periods: {
            today: { transactions: todayTxs, ...calcTotals(todayTxs) },
            yesterday: { transactions: yesterdayTxs, ...calcTotals(yesterdayTxs) },
            thisWeek: { transactions: thisWeekTxs, ...calcTotals(thisWeekTxs) },
            lastWeek: { transactions: lastWeekTxs, ...calcTotals(lastWeekTxs) },
            thisMonth: { transactions: thisMonthTxs, ...calcTotals(thisMonthTxs) },
            lastMonth: { transactions: lastMonthTxs, ...calcTotals(lastMonthTxs) },
            last7Days: { transactions: last7DaysTxs, ...calcTotals(last7DaysTxs) },
            last30Days: { transactions: last30DaysTxs, ...calcTotals(last30DaysTxs) }
        },
        categoryBreakdown: {
            thisMonth: thisMonthByCategory,
            lastMonth: lastMonthByCategory
        },
        insights: {
            dailyAvgSpend,
            highestCategory,
            biggestExpense,
            weekOverWeek
        },
        formatters: {
            generateCategorySummary,
            formatTransactionList
        },
        formatDate,
        currentDate: now
    };
}

/**
 * Parse natural language transaction intent with DATE support
 */
export const parseTransactionIntentAI = async (text, categories, accounts) => {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured, falling back to regex parser');
        return null;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const categoriesList = categories.map(c => `${c.name} (id: ${c.id})`).join(', ');
    const accountsList = accounts.map(a => `${a.name} (id: ${a.id})`).join(', ');

    const systemPrompt = `You are a smart financial assistant. Your job is to extract transaction details from user input.

CURRENT DATE: ${today}
YESTERDAY: ${yesterdayStr}

AVAILABLE CATEGORIES: ${categoriesList}
AVAILABLE ACCOUNTS: ${accountsList}

INSTRUCTIONS:
1. Identify if the user wants to add an expense or income.
2. Extract the AMOUNT (number).
3. Identify the CATEGORY based on keywords. Detailed mapping is preferred. If unknown, use 'others'.
4. Identify the ACCOUNT if mentioned. If not mentioned, use the first account ID or leave empty.
5. Extract a short NOTE/DESCRIPTION.
6. Handle MULTIPLE transactions in a single sentence (e.g., "Spent 50 on food and 20 on bus").
7. IMPORTANT: Handle DATE references:
   - "yesterday" = ${yesterdayStr}
   - "today" = ${today}
   - "2 days ago", "last week", etc. - calculate the correct date
   - If no date mentioned, use today: ${today}

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects. No markdown.
[
    {
        "type": "expense" | "income",
        "amount": number,
        "categoryId": "string (category id)",
        "categoryName": "string (category name)",
        "bankAccountId": "string (account id)",
        "note": "string",
        "date": "YYYY-MM-DD format"
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
 * Enhanced Chat with Finance AI - Full Analytics Support
 */
export const chatWithFinanceAI = async (text, context) => {
    if (!OPENROUTER_API_KEY) {
        return "I can't connect to my brain right now (API Key missing).";
    }

    // Get all transactions with full details
    const allTransactions = context.allTransactions || context.recentTransactions || [];
    const categories = context.categories || [];
    const symbol = context.symbol || '₹';

    // Compute comprehensive analytics
    const analytics = computeFinancialAnalytics(allTransactions, categories, symbol);
    const { periods, categoryBreakdown, insights, formatters } = analytics;

    // Format current date info
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Build comprehensive context for AI
    const systemPrompt = `You are "Penny", a smart, friendly, and analytical financial assistant.

═══════════════════════════════════════════════════════════════
📅 DATE CONTEXT
═══════════════════════════════════════════════════════════════
Current Date & Time: ${todayStr} at ${now.toLocaleTimeString()}
Yesterday was: ${yesterdayStr}

═══════════════════════════════════════════════════════════════
💰 ACCOUNT SUMMARY
═══════════════════════════════════════════════════════════════
Total Balance: ${symbol}${context.totalBalance?.toLocaleString() || 0}
Monthly Budget: ${symbol}${context.budget?.toLocaleString() || 0}
Budget Remaining: ${symbol}${context.remaining?.toLocaleString() || 0}

═══════════════════════════════════════════════════════════════
📊 SPENDING ANALYTICS
═══════════════════════════════════════════════════════════════

TODAY (${analytics.formatDate(now)}):
- Total Spent: ${symbol}${periods.today.expense.toFixed(2)}
- Total Received: ${symbol}${periods.today.income.toFixed(2)}
- Transaction Count: ${periods.today.transactions.length}
${periods.today.transactions.length > 0 ? 'Transactions:\n' + formatters.formatTransactionList(periods.today.transactions) : '- No transactions yet today'}

YESTERDAY (${analytics.formatDate(yesterdayDate)}):
- Total Spent: ${symbol}${periods.yesterday.expense.toFixed(2)}
- Total Received: ${symbol}${periods.yesterday.income.toFixed(2)}
- Transaction Count: ${periods.yesterday.transactions.length}
${periods.yesterday.transactions.length > 0 ? 'Transactions:\n' + formatters.formatTransactionList(periods.yesterday.transactions) : '- No transactions yesterday'}

THIS WEEK:
- Total Spent: ${symbol}${periods.thisWeek.expense.toFixed(2)}
- Total Received: ${symbol}${periods.thisWeek.income.toFixed(2)}
- Transaction Count: ${periods.thisWeek.transactions.length}

LAST WEEK:
- Total Spent: ${symbol}${periods.lastWeek.expense.toFixed(2)}
- Total Received: ${symbol}${periods.lastWeek.income.toFixed(2)}

⚠️ PRE-COMPUTED WEEK COMPARISON:
- This Week Spent: ${symbol}${periods.thisWeek.expense.toFixed(2)}
- Last Week Spent: ${symbol}${periods.lastWeek.expense.toFixed(2)}
- Difference: ${symbol}${Math.abs(periods.thisWeek.expense - periods.lastWeek.expense).toFixed(2)} ${periods.thisWeek.expense > periods.lastWeek.expense ? 'MORE' : 'LESS'}
- Percentage Change: ${insights.weekOverWeek}% ${parseFloat(insights.weekOverWeek) > 0 ? 'INCREASE' : 'DECREASE'}

THIS MONTH:
- Total Spent: ${symbol}${periods.thisMonth.expense.toFixed(2)}
- Total Received: ${symbol}${periods.thisMonth.income.toFixed(2)}
- Transaction Count: ${periods.thisMonth.transactions.length}
- Daily Average Spending: ${symbol}${insights.dailyAvgSpend.toFixed(2)}

LAST MONTH:
- Total Spent: ${symbol}${periods.lastMonth.expense.toFixed(2)}
- Total Received: ${symbol}${periods.lastMonth.income.toFixed(2)}
- Transaction Count: ${periods.lastMonth.transactions.length}

═══════════════════════════════════════════════════════════════
📂 CATEGORY BREAKDOWN (This Month - February 2026)
═══════════════════════════════════════════════════════════════
${formatters.generateCategorySummary(categoryBreakdown.thisMonth) || '- No expense categories this month'}

Highest Category This Month: ${insights.highestCategory.name} (${symbol}${insights.highestCategory.total.toFixed(2)})
${insights.biggestExpense ? `Biggest Single Expense: ${symbol}${insights.biggestExpense.amount} on ${insights.biggestExpense.categoryName}` : ''}

═══════════════════════════════════════════════════════════════
📂 CATEGORY BREAKDOWN (Last Month - January 2026)
═══════════════════════════════════════════════════════════════
${formatters.generateCategorySummary(categoryBreakdown.lastMonth) || '- No expense categories last month'}

⚠️ IMPORTANT: When user asks about "last month" spending on a category (like food), 
use ONLY the "LAST MONTH" section data above, NOT "This Month" data!

═══════════════════════════════════════════════════════════════
📜 ALL TRANSACTIONS (Complete History for Analysis)
═══════════════════════════════════════════════════════════════
Total transactions in database: ${allTransactions.length}

${formatters.formatTransactionList(allTransactions, 100)}

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL CALCULATION RULES
═══════════════════════════════════════════════════════════════
1. NEVER calculate percentages yourself - USE ONLY the pre-computed values above
2. For week comparisons, use the PRE-COMPUTED WEEK COMPARISON section values EXACTLY
3. The percentage change is ALREADY calculated: ${insights.weekOverWeek}%
4. DO NOT hallucinate or make up numbers - only use values from this data
5. If a category is mentioned, find ALL transactions for that category and ADD them
6. When asked about specific categories (like "petrol"), search ALL transactions including notes

═══════════════════════════════════════════════════════════════
🎯 RESPONSE FORMAT INSTRUCTIONS
═══════════════════════════════════════════════════════════════

IMPORTANT: When the user asks for category breakdowns, comparisons, or analysis, you MUST include a JSON block in your response that can be rendered as a rich UI component.

For category-related questions (top spending, category breakdown, where money goes):
Include this JSON block at the END of your response:
\`\`\`json
{
    "type": "category_breakdown",
    "title": "Top Spending Categories",
    "subtitle": "Based on your monthly spending",
    "data": [
        {"category": "Category Name", "icon": "emoji", "amount": 1234, "percentage": 25, "color": "#hexcolor"},
        ...
    ],
    "summary": {
        "totalIncome": 50000,
        "totalSpent": 25000
    }
}
\`\`\`

For spending comparison questions (this week vs last week, month comparison):
USE THE PRE-COMPUTED VALUES FROM "PRE-COMPUTED WEEK COMPARISON" SECTION!
The change percentage is: ${insights.weekOverWeek}%
\`\`\`json
{
    "type": "comparison",
    "title": "Spending Comparison",
    "periods": [
        {"label": "This Week", "amount": ${periods.thisWeek.expense.toFixed(0)}},
        {"label": "Last Week", "amount": ${periods.lastWeek.expense.toFixed(0)}}
    ],
    "change": ${Math.abs(parseFloat(insights.weekOverWeek))},
    "changeLabel": "${parseFloat(insights.weekOverWeek) > 0 ? 'increase' : 'decrease'}"
}
\`\`\`

For quick stats/insights:
\`\`\`json
{
    "type": "stats",
    "cards": [
        {"label": "Total Spent Today", "value": "₹500", "icon": "💸", "color": "#ef4444"},
        {"label": "Budget Remaining", "value": "₹15,000", "icon": "💰", "color": "#22c55e"}
    ]
}
\`\`\`

For transaction lists:
\`\`\`json
{
    "type": "transactions",
    "title": "Recent Transactions",
    "data": [
        {"date": "2026-02-05", "category": "Food", "icon": "🍔", "amount": 250, "note": "Lunch", "type": "expense"}
    ]
}
\`\`\`

ALWAYS include the JSON block when the question is about:
- Category breakdown / top spending / where money goes
- Comparisons (week to week, month to month)
- Statistics summary
- Transaction lists

The JSON MUST be valid and wrapped in \`\`\`json ... \`\`\` code blocks.

STYLE GUIDELINES:
- Be witty and fun like "Brace yourself... this is going to hurt! 💔📉"
- Use emojis in your text responses
- Be encouraging but honest
- After the conversational text, ALWAYS include the JSON block for visual data
`;

    try {
        const aiResponse = await callOpenRouter(systemPrompt, text);

        // Parse the response for structured data
        const result = {
            text: aiResponse,
            richData: null
        };

        // Extract JSON block if present
        const jsonMatch = aiResponse?.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                result.richData = JSON.parse(jsonMatch[1]);
                // Remove the JSON block from the text response
                result.text = aiResponse.replace(/```json[\s\S]*?```/g, '').trim();
            } catch (e) {
                console.warn('Failed to parse rich data JSON:', e);
            }
        }

        return result;
    } catch (error) {
        console.error('Finance Chat Error:', error);
        return {
            text: "I'm having trouble analyzing your finances right now. Please try again.",
            richData: null
        };
    }
};

/**
 * Generate quick insights for dashboard
 */
export const generateQuickInsights = (context) => {
    const { transactions, symbol, budget } = context;
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This month's transactions
    const thisMonthTxs = transactions.filter(t => new Date(t.date) >= thisMonthStart);
    const thisMonthExpense = thisMonthTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const thisMonthIncome = thisMonthTxs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categorySpend = {};
    thisMonthTxs.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.categoryName || t.categoryId || 'Others';
        categorySpend[cat] = (categorySpend[cat] || { amount: 0, icon: t.categoryIcon });
        categorySpend[cat].amount += t.amount;
    });

    const topCategories = Object.entries(categorySpend)
        .map(([name, data]) => ({
            category: name,
            amount: data.amount,
            percentage: thisMonthIncome > 0 ? Math.round((data.amount / thisMonthIncome) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return {
        monthlySpent: thisMonthExpense,
        monthlyIncome: thisMonthIncome,
        budgetUsed: budget > 0 ? Math.round((thisMonthExpense / budget) * 100) : 0,
        topCategories,
        transactionCount: thisMonthTxs.length
    };
};

