import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import CategoryManager from './CategoryManager';

function Settings() {
    const { state, actions } = useFinance();
    const { settings } = state;

    const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const [formData, setFormData] = useState({
        userName: settings.userName || '',
        monthlyBudget: settings.monthlyBudget?.toString() || '',
        currentMonthBudget: settings.budgets?.[currentMonthKey]?.toString() || '',
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    ];

    const handleCurrencyChange = (code) => {
        const currency = currencies.find(c => c.code === code);
        setFormData({
            ...formData,
            currency: code,
            currencySymbol: currency?.symbol || '$'
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update budgets map
            const updatedBudgets = { ...(settings.budgets || {}) };
            if (formData.currentMonthBudget) {
                updatedBudgets[currentMonthKey] = parseFloat(formData.currentMonthBudget);
            } else {
                delete updatedBudgets[currentMonthKey]; // Remove if cleared
            }

            await actions.updateSettings({
                ...formData,
                monthlyBudget: parseFloat(formData.monthlyBudget) || 0,
                budgets: updatedBudgets
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h1>
                <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                    Customize your finance tracking experience
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
                marginBottom: '80px' // Space for floating action button if needed, or just bottom padding
            }}>
                {/* Profile Section */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Profile</h3>
                    <div className="form-group">
                        <label className="form-label">Display Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.userName}
                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                        />
                    </div>
                </div>

                {/* Budget Section */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Budget Settings</h3>

                    {/* Default Budget */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Default Monthly Budget</label>
                        <div className="currency-input-wrapper">
                            <span className="currency-symbol">{formData.currencySymbol}</span>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.monthlyBudget}
                                onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)', marginTop: '4px' }}>
                            Applied if no specific budget is set for the month.
                        </p>
                    </div>

                    {/* Current Month Override */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Budget for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', fontWeight: 400 }}>Override</span>
                        </label>
                        <div className="currency-input-wrapper">
                            <span className="currency-symbol">{formData.currencySymbol}</span>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.currentMonthBudget}
                                onChange={(e) => setFormData({ ...formData, currentMonthBudget: e.target.value })}
                                placeholder={formData.monthlyBudget || "0.00"}
                                style={{ borderColor: formData.currentMonthBudget ? 'var(--fin-accent-primary)' : '' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Currency Section */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Currency</h3>
                    <div className="form-group">
                        <label className="form-label">Preferred Currency</label>
                        <select
                            className="form-select"
                            value={formData.currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.symbol} - {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Theme Section */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Appearance</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Theme</div>
                            <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)' }}>
                                Switch between dark and light mode
                            </p>
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={actions.toggleTheme}
                            style={{ minWidth: '120px' }}
                        >
                            {settings.theme === 'dark' ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <circle cx="12" cy="12" r="5" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                    </svg>
                                    Light Mode
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                    Dark Mode
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Categories Section - Full Width */}
            <div className="card" style={{ padding: '24px', marginBottom: '80px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Manage Categories
                </h3>
                <p style={{ color: 'var(--fin-text-tertiary)', fontSize: '13px', marginBottom: '20px' }}>
                    Add your own custom categories with custom icons and colors. These will appear everywhere you can select a category.
                </p>
                <CategoryManager />
            </div>

            {/* Save Button Bar - Sticky at bottom or fixed position */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 100
            }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        padding: '12px 32px',
                        fontSize: '16px',
                        boxShadow: 'var(--fin-shadow-lg)'
                    }}
                >
                    {isSaving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

export default Settings;
