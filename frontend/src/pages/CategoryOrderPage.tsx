/**
 * CategoryOrderPage - Admin page for managing category display order
 * Features drag-and-drop reordering of problem categories
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Save,
    RotateCcw,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Sortable item component
function SortableItem({ id, index }: { id: string; index: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 px-4 py-3 bg-slate-800/50 border rounded-lg 
                ${isDragging ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-700'}
                group transition-colors`}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={20} />
            </button>
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 font-mono text-sm">
                {index + 1}
            </span>
            <span className="text-white font-medium flex-1">{id}</span>
        </div>
    );
}

export default function CategoryOrderPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<string[]>([]);
    const [originalOrder, setOriginalOrder] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const adminToken = sessionStorage.getItem('admin_token');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch current category order
    const loadOrder = useCallback(async () => {
        if (!adminToken) {
            navigate('/admin');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/admin/category-order`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch order');
            const data = await response.json();
            setCategories(data.order || []);
            setOriginalOrder(data.order || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [adminToken, navigate]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Save order
    const handleSave = async () => {
        if (!adminToken) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/category-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ order: categories })
            });

            if (!response.ok) throw new Error('Failed to save');

            setOriginalOrder([...categories]);
            setSuccess('Category order saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Reset to original order
    const handleReset = () => {
        setCategories([...originalOrder]);
    };

    const hasChanges = JSON.stringify(categories) !== JSON.stringify(originalOrder);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Category Order</h1>
                            <p className="text-slate-400 text-sm">Drag to reorder learning flow</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            disabled={!hasChanges}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Order
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* Info */}
                <div className="mb-6 bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-400">
                    <strong className="text-white">Tip:</strong> The order below determines how categories appear on the main site.
                    Earlier categories represent foundational topics, later ones build upon them.
                </div>

                {/* Sortable List */}
                <div className="space-y-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={categories}
                            strategy={verticalListSortingStrategy}
                        >
                            {categories.map((category, index) => (
                                <SortableItem key={category} id={category} index={index} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Change indicator */}
                {hasChanges && (
                    <div className="mt-6 text-center text-sm text-amber-400">
                        You have unsaved changes
                    </div>
                )}
            </div>
        </div>
    );
}
