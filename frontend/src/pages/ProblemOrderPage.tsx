/**
 * ProblemOrderPage - Admin page for managing problem order within categories
 * Features accordion-style layout with drag-and-drop reordering of problems
 * for incremental learning within each category
 */
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
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useProblemOrderData, type Problem, type CategoryData } from '../hooks/useProblemOrderData';

// Difficulty badge colors
const difficultyColors = {
    Easy: 'bg-emerald-500/20 text-emerald-400',
    Medium: 'bg-amber-500/20 text-amber-400',
    Hard: 'bg-red-500/20 text-red-400',
};

// Sortable problem item
function SortableProblemItem({ problem, index }: { problem: Problem; index: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: problem.slug });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 px-3 py-2 bg-slate-800/30 border rounded-lg ml-4
                ${isDragging ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-700/50'}
                group transition-colors`}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </button>
            <span className="w-6 h-6 flex items-center justify-center rounded bg-purple-600/20 text-purple-400 font-mono text-xs">
                {index + 1}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{problem.title}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[problem.difficulty]}`}>
                {problem.difficulty}
            </span>
        </div>
    );
}

// Category accordion item
function CategoryAccordion({
    category,
    onToggle,
    onDragEnd,
    onSave,
    onReset,
    saving,
}: {
    category: CategoryData;
    onToggle: () => void;
    onDragEnd: (event: DragEndEvent) => void;
    onSave: () => void;
    onReset: () => void;
    saving: boolean;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className={`border rounded-lg overflow-hidden transition-colors ${category.hasChanges ? 'border-amber-500/50' : 'border-slate-700'
            }`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
            >
                {category.isExpanded ? (
                    <ChevronDown size={18} className="text-slate-400" />
                ) : (
                    <ChevronRight size={18} className="text-slate-400" />
                )}
                <span className="text-white font-medium flex-1">{category.name}</span>
                <span className="text-slate-500 text-sm">{category.problems.length} problems</span>
                {category.hasChanges && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                        Modified
                    </span>
                )}
            </button>

            {category.isExpanded && (
                <div className="p-3 bg-slate-900/50 border-t border-slate-700/50">
                    {category.hasChanges && (
                        <div className="flex items-center justify-end gap-2 mb-3">
                            <button
                                onClick={onReset}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                            </button>
                        </div>
                    )}

                    <div className="space-y-1">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={onDragEnd}
                        >
                            <SortableContext
                                items={category.problems.map(p => p.slug)}
                                strategy={verticalListSortingStrategy}
                            >
                                {category.problems.map((problem, index) => (
                                    <SortableProblemItem key={problem.slug} problem={problem} index={index} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    {category.problems.length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">No problems in this category</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProblemOrderPage() {
    const navigate = useNavigate();
    const {
        categoryData,
        loading,
        savingCategory,
        error,
        success,
        changedCount,
        toggleCategory,
        handleDragEnd,
        handleSave,
        handleReset,
    } = useProblemOrderData();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-3xl mx-auto">
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
                            <h1 className="text-2xl font-bold text-white">Problem Order</h1>
                            <p className="text-slate-400 text-sm">
                                Set incremental learning progression within each category
                            </p>
                        </div>
                    </div>

                    {changedCount > 0 && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-lg">
                            {changedCount} unsaved {changedCount === 1 ? 'category' : 'categories'}
                        </span>
                    )}
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
                    <strong className="text-white">Tip:</strong> Click a category to expand and reorder its problems.
                    Order problems from foundational concepts to more advanced ones.
                </div>

                {/* Category List */}
                <div className="space-y-2">
                    {categoryData.map(category => (
                        <CategoryAccordion
                            key={category.name}
                            category={category}
                            onToggle={() => toggleCategory(category.name)}
                            onDragEnd={(event) => handleDragEnd(category.name, event)}
                            onSave={() => handleSave(category.name)}
                            onReset={() => handleReset(category.name)}
                            saving={savingCategory === category.name}
                        />
                    ))}
                </div>

                {categoryData.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No categories found
                    </div>
                )}
            </div>
        </div>
    );
}
