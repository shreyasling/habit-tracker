import { useFinance } from '../../context/FinanceContext';
import MetricCard from './MetricCard';
import AssetsChart from './AssetsChart';
import AccountsPanel from './AccountsPanel';
import LatestTransactions from './LatestTransactions';
import SpendingOverview from './SpendingOverview';

function Dashboard({ onPayClick, onAddExpenseClick, onCalendarClick, onAskAIClick, onViewChange }) {
    const { state, derivedData } = useFinance();
    const { settings } = state;
    const symbol = settings.currencySymbol || '$';

    // Calculate percentage changes (mock for now, would be calculated from historical data)
    const budgetChange = derivedData.monthlyBudgetRemaining > 0 ? '+35%' : '-15%';
    const spendingChange = '-12%';

    // Savings Goal Progress
    const savingsProgress = derivedData.savingsGoalProgress;

    const todayTransactionCount = state.transactions.filter(tx => {
        const today = new Date().toDateString();
        return new Date(tx.date).toDateString() === today;
    }).length;

    return (
        <div className="dashboard-container">
            {/* Quick Actions Row - Horizontal above metrics */}
            <div className="quick-actions-row">
                <button className="quick-action-btn primary" onClick={onPayClick}>
                    <PlusIcon /> Pay
                </button>
                <button className="quick-action-btn" onClick={onAddExpenseClick}>
                    <ArrowIcon /> Add Expense
                </button>
                <button className="quick-action-btn" onClick={onCalendarClick}>
                    <CalendarIcon /> Calendar
                </button>
                <button className="quick-action-btn" onClick={onAskAIClick}>
                    <ChatIcon /> Ask AI
                </button>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <MetricCard
                    title="Monthly Budget"
                    value={`${symbol}${derivedData.monthlyBudgetRemaining.toLocaleString()}`}
                    change={budgetChange}
                    changeType={derivedData.monthlyBudgetRemaining > 0 ? 'positive' : 'negative'}
                    subtitle="Remaining this month"
                />
                <MetricCard
                    title="Total Spending"
                    value={`${symbol}${derivedData.monthlySpend.toLocaleString()}`}
                    change={spendingChange}
                    changeType="negative"
                    subtitle="Increased from last month"
                />
                <MetricCard
                    title="Savings Goals"
                    value={`${symbol}${derivedData.totalSavedGoals.toLocaleString()}`}
                    change={savingsProgress > 0 ? `↑ ${savingsProgress}%` : '--'}
                    changeType="positive"
                    subtitle={`of ${symbol}${derivedData.totalGoalTarget.toLocaleString()} goal`}
                />
                <MetricCard
                    title="Today's Spend"
                    value={`${symbol}${derivedData.todaysSpend.toLocaleString()}`}
                    change={todayTransactionCount > 0 ? `↑ 8%` : '--'}
                    changeType={todayTransactionCount > 0 ? 'neutral' : 'neutral'}
                    subtitle={`${todayTransactionCount} transaction${todayTransactionCount !== 1 ? 's' : ''} today`}
                />
            </div>

            {/* Main Dashboard Grid */}
            <div className="dashboard-grid">
                <div className="dashboard-left">
                    {/* Assets Chart */}
                    <AssetsChart transactions={state.transactions} symbol={symbol} />

                    {/* Latest Transactions */}
                    <LatestTransactions
                        transactions={derivedData.recentTransactions}
                        categories={[...state.expenseCategories, ...state.incomeCategories, ...(state.customCategories || [])]}
                        symbol={symbol}
                        onViewAll={() => onViewChange('transactions')}
                    />
                </div>

                <div className="dashboard-right">
                    {/* My Accounts */}
                    <AccountsPanel
                        accounts={state.bankAccounts}
                        symbol={symbol}
                    />

                    {/* Spending Overview */}
                    <SpendingOverview
                        spendingByCategory={derivedData.spendingByCategory}
                        totalSpend={derivedData.monthlySpend}
                        symbol={symbol}
                    />
                </div>
            </div>
        </div>
    );
}

// Quick Action Icons
function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <path d="M7 17l10-10M7 7h10v10" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
    );
}

export default Dashboard;
