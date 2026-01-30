import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function Goals() {
    const { state, actions } = useFinance();
    const symbol = state.settings.currencySymbol || '$';
    const [showAddGoal, setShowAddGoal] = useState(false);

    // Use goals from context state
    const goals = state.goals || [];

    const [newGoal, setNewGoal] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        icon: '🎯',
        color: '#a855f7'
    });

    const handleAddGoal = async (e) => {
        e.preventDefault();
        const goal = {
            ...newGoal,
            id: Date.now().toString(),
            targetAmount: parseFloat(newGoal.targetAmount) || 0,
            currentAmount: parseFloat(newGoal.currentAmount) || 0
        };

        await actions.addGoal(goal);
        setNewGoal({ name: '', targetAmount: '', currentAmount: '', deadline: '', icon: '🎯', color: '#a855f7' });
        setShowAddGoal(false);
    };

    const handleAddToGoal = async (goalId, amount) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const updatedGoal = {
            ...goal,
            currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount)
        };

        await actions.updateGoal(updatedGoal);
    };

    const handleDeleteGoal = async (goalId) => {
        await actions.deleteGoal(goalId);
    };

    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    const icons = ['🎯', '🏦', '✈️', '🚗', '🏠', '💻', '📱', '👗', '🎮', '📚', '💍', '🎓'];
    const colors = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6'];

    return (
        <div className="goals-page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Savings Goals</h1>
                    <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                        Track your progress towards financial goals
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddGoal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Goal
                </button>
            </div>

            {/* Summary Cards */}
            <div className="goals-metrics-grid">
                <div className="metric-card">
                    <span className="metric-title">Total Goals</span>
                    <div className="metric-value">{goals.length}</div>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Total Saved</span>
                    <div className="metric-value" style={{ color: 'var(--fin-success)' }}>
                        {symbol}{totalSaved.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card full-width-mobile">
                    <span className="metric-title">Overall Progress</span>
                    <div className="metric-value">
                        {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Goals List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {goals.map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    const remaining = goal.targetAmount - goal.currentAmount;
                    const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                        <div key={goal.id} className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: goal.color + '20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}>
                                        {goal.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, marginBottom: '2px' }}>{goal.name}</h3>
                                        <span style={{ fontSize: '13px', color: 'var(--fin-text-muted)' }}>
                                            {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="icon-btn danger"
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    title="Delete goal"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 700 }}>
                                        {symbol}{goal.currentAmount.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '14px', color: 'var(--fin-text-muted)' }}>
                                        of {symbol}{goal.targetAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'var(--fin-bg-elevated)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(progress, 100)}%`,
                                        height: '100%',
                                        background: goal.color,
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>
                                        {Math.round(progress)}% complete
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>
                                        {symbol}{remaining.toLocaleString()} to go
                                    </span>
                                </div>
                            </div>

                            {/* Quick Add Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[50, 100, 500].map(amount => (
                                    <button
                                        key={amount}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, padding: '8px' }}
                                        onClick={() => handleAddToGoal(goal.id, amount)}
                                        disabled={goal.currentAmount >= goal.targetAmount}
                                    >
                                        +{symbol}{amount}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {goals.length === 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', padding: '48px' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12h8M12 8v8" />
                                </svg>
                            </div>
                            <h4 className="empty-state-title">No savings goals yet</h4>
                            <p className="empty-state-text">
                                Create your first goal to start tracking your savings
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowAddGoal(true)} style={{ marginTop: '16px' }}>
                                Create Goal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Goal Modal */}
            {showAddGoal && (
                <div className="modal-overlay" onClick={() => setShowAddGoal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Savings Goal</h2>
                            <button className="modal-close" onClick={() => setShowAddGoal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddGoal}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Goal Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Emergency Fund"
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Target Amount</label>
                                    <div className="currency-input-wrapper">
                                        <span className="currency-symbol">{symbol}</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="10000"
                                            value={newGoal.targetAmount}
                                            onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Already Saved</label>
                                    <div className="currency-input-wrapper">
                                        <span className="currency-symbol">{symbol}</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={newGoal.currentAmount}
                                            onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Target Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Icon</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {icons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setNewGoal({ ...newGoal, icon })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    border: newGoal.icon === icon ? '2px solid var(--fin-accent-primary)' : '1px solid var(--fin-border-primary)',
                                                    borderRadius: '8px',
                                                    background: 'var(--fin-bg-elevated)',
                                                    fontSize: '18px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Color</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {colors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewGoal({ ...newGoal, color })}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    border: newGoal.color === color ? '2px solid white' : 'none',
                                                    borderRadius: '50%',
                                                    background: color,
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddGoal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Goals;
