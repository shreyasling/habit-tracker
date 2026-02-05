import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

// Popular emoji options for categories
const emojiOptions = [
    '🍔', '🛒', '🚗', '🏠', '💼', '🎬', '🏥', '📚', '✈️', '🎮',
    '💳', '📱', '🛍️', '⚡', '💰', '🎁', '🏋️', '☕', '🍕', '🚌',
    '📈', '💎', '🎯', '🔧', '🌐', '📦', '🎵', '🐕', '👶', '💄',
    '🏦', '🎓', '🍿', '🍺', '🚿', '📰', '🧾', '💊', '🔌', '📺'
];

// Color options
const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#6b7280', '#374151', '#1f2937'
];

function CategoryManager() {
    const { state, actions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('expense');
    const [formData, setFormData] = useState({
        name: '',
        icon: '📦',
        color: '#3b82f6',
        type: 'expense'
    });

    const customCategories = state.customCategories || [];
    const expenseCustom = customCategories.filter(c => c.type === 'expense');
    const incomeCustom = customCategories.filter(c => c.type === 'income');

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            icon: '📦',
            color: '#3b82f6',
            type: activeTab
        });
        setEditingCategory(null);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Please enter a category name');
            return;
        }

        if (editingCategory) {
            await actions.updateCustomCategory(editingCategory.id, formData);
        } else {
            await actions.addCustomCategory(formData);
        }

        setShowAddModal(false);
        resetForm();
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type
        });
        setEditingCategory(category);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await actions.deleteCustomCategory(id);
        }
    };

    const openAddModal = () => {
        resetForm();
        setFormData(prev => ({ ...prev, type: activeTab }));
        setShowAddModal(true);
    };

    const renderCategoryList = (categories, isDefault = false) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {categories.map(cat => (
                <div
                    key={cat.id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--fin-bg-elevated)',
                        border: '1px solid var(--fin-border-primary)',
                        borderRadius: 'var(--fin-radius-md)',
                        position: 'relative'
                    }}
                >
                    <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}>
                        {cat.icon}
                    </span>
                    <span style={{
                        fontSize: '13px',
                        color: 'var(--fin-text-primary)',
                        fontWeight: 500
                    }}>
                        {cat.name}
                    </span>
                    {!isDefault && (
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <button
                                onClick={() => handleEdit(cat)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--fin-text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--fin-error)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    {isDefault && (
                        <span style={{
                            fontSize: '10px',
                            color: 'var(--fin-text-muted)',
                            padding: '2px 6px',
                            background: 'var(--fin-bg-primary)',
                            borderRadius: '4px'
                        }}>
                            Default
                        </span>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="category-manager">
            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--fin-border-primary)',
                paddingBottom: '12px'
            }}>
                <button
                    onClick={() => setActiveTab('expense')}
                    style={{
                        padding: '8px 16px',
                        background: activeTab === 'expense' ? 'var(--fin-accent-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--fin-radius-sm)',
                        color: activeTab === 'expense' ? 'white' : 'var(--fin-text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    Expense Categories
                </button>
                <button
                    onClick={() => setActiveTab('income')}
                    style={{
                        padding: '8px 16px',
                        background: activeTab === 'income' ? 'var(--fin-accent-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--fin-radius-sm)',
                        color: activeTab === 'income' ? 'white' : 'var(--fin-text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    Income Categories
                </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'expense' ? (
                <>
                    {/* Custom Expense Categories */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-text-primary)', margin: 0 }}>
                                Your Custom Categories ({expenseCustom.length})
                            </h4>
                            <button
                                onClick={openAddModal}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: 'var(--fin-accent-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add Category
                            </button>
                        </div>
                        {expenseCustom.length > 0 ? (
                            renderCategoryList(expenseCustom, false)
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)', margin: 0 }}>
                                No custom expense categories yet. Click "Add Category" to create one.
                            </p>
                        )}
                    </div>

                    {/* Default Expense Categories */}
                    <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-text-secondary)', marginBottom: '12px' }}>
                            Default Categories ({state.expenseCategories.length})
                        </h4>
                        {renderCategoryList(state.expenseCategories, true)}
                    </div>
                </>
            ) : (
                <>
                    {/* Custom Income Categories */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-text-primary)', margin: 0 }}>
                                Your Custom Categories ({incomeCustom.length})
                            </h4>
                            <button
                                onClick={openAddModal}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: 'var(--fin-accent-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add Category
                            </button>
                        </div>
                        {incomeCustom.length > 0 ? (
                            renderCategoryList(incomeCustom, false)
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)', margin: 0 }}>
                                No custom income categories yet. Click "Add Category" to create one.
                            </p>
                        )}
                    </div>

                    {/* Default Income Categories */}
                    <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-text-secondary)', marginBottom: '12px' }}>
                            Default Categories ({state.incomeCategories.length})
                        </h4>
                        {renderCategoryList(state.incomeCategories, true)}
                    </div>
                </>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px'
                }} onClick={() => setShowAddModal(false)}>
                    <div style={{
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: 'calc(100vh - 32px)',
                        background: 'var(--fin-bg-card)',
                        borderRadius: 'var(--fin-radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--fin-border-primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fin-text-primary)', margin: 0 }}>
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--fin-text-muted)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {/* Preview */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                                padding: '16px',
                                background: 'var(--fin-bg-elevated)',
                                borderRadius: 'var(--fin-radius-md)'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: formData.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    marginRight: '12px'
                                }}>
                                    {formData.icon}
                                </div>
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: 'var(--fin-text-primary)'
                                }}>
                                    {formData.name || 'Category Name'}
                                </span>
                            </div>

                            {/* Category Type */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Type
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('type', 'expense')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: formData.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-bg-elevated)',
                                            border: `1px solid ${formData.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-border-primary)'}`,
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: formData.type === 'expense' ? 'white' : 'var(--fin-text-primary)',
                                            fontWeight: 500,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('type', 'income')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: formData.type === 'income' ? 'var(--fin-success)' : 'var(--fin-bg-elevated)',
                                            border: `1px solid ${formData.type === 'income' ? 'var(--fin-success)' : 'var(--fin-border-primary)'}`,
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: formData.type === 'income' ? 'white' : 'var(--fin-text-primary)',
                                            fontWeight: 500,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Gym, Pets, Uber..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border-primary)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        color: 'var(--fin-text-primary)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Icon */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Icon
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(10, 1fr)',
                                    gap: '4px',
                                    maxHeight: '120px',
                                    overflowY: 'auto',
                                    padding: '8px',
                                    background: 'var(--fin-bg-elevated)',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    border: '1px solid var(--fin-border-primary)'
                                }}>
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleInputChange('icon', emoji)}
                                            style={{
                                                padding: '6px',
                                                background: formData.icon === emoji ? formData.color : 'transparent',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '18px',
                                                cursor: 'pointer',
                                                transition: 'transform 0.1s'
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Color
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(10, 1fr)',
                                    gap: '4px',
                                    padding: '8px',
                                    background: 'var(--fin-bg-elevated)',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    border: '1px solid var(--fin-border-primary)'
                                }}>
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => handleInputChange('color', color)}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                background: color,
                                                border: formData.color === color ? '3px solid white' : 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                boxShadow: formData.color === color ? '0 0 0 2px var(--fin-accent-primary)' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '16px 20px',
                            borderTop: '1px solid var(--fin-border-primary)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--fin-bg-elevated)',
                                    border: '1px solid var(--fin-border-primary)',
                                    borderRadius: 'var(--fin-radius-md)',
                                    color: 'var(--fin-text-primary)',
                                    fontWeight: 500,
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--fin-accent-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-md)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingCategory ? 'Save Changes' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryManager;
