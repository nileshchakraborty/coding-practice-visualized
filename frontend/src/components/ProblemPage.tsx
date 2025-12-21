import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SolutionModal from './SolutionModal';
import type { Solution } from '../types';
import { SolutionsAPI } from '../models/api';

/**
 * ProblemPage - Wrapper component that renders SolutionModal as a full page
 * This reuses all the existing SolutionModal features including:
 * - Problem/Explain/Tutor tabs
 * - Code Editor with test runner
 * - Visualizations, YouTube videos, external resources
 * - Brute Force / Optimal toggle
 */
const ProblemPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [solution, setSolution] = useState<Solution | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load solution data
    useEffect(() => {
        const loadSolution = async () => {
            if (!slug) return;

            setLoading(true);
            setError(null);

            try {
                const data = await SolutionsAPI.getBySlug(slug);
                if (data) {
                    setSolution(data);
                } else {
                    setError('Problem not found');
                }
            } catch (err) {
                setError('Failed to load problem');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadSolution();
    }, [slug]);

    // Handle close - navigate back to home
    const handleClose = () => {
        navigate('/');
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-white text-lg">Loading problem...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !solution) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Problem not found'}</div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Render SolutionModal as full page
    return (
        <SolutionModal
            isOpen={true}
            onClose={handleClose}
            solution={solution}
            slug={slug || null}
        />
    );
};

export default ProblemPage;
