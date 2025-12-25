/**
 * ProgressRing - Circular progress indicator
 * 
 * Shows solved problems with difficulty breakdown (Easy/Med/Hard)
 * Similar to LeetCode's progress ring design
 */
import React from 'react';

interface ProgressRingProps {
    solved: number;
    total: number;
    easySolved: number;
    easyTotal: number;
    mediumSolved: number;
    mediumTotal: number;
    hardSolved: number;
    hardTotal: number;
    size?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    solved,
    total,
    easySolved,
    easyTotal,
    mediumSolved,
    mediumTotal,
    hardSolved,
    hardTotal,
    size = 120,
}) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate progress percentages
    const easyProgress = easyTotal > 0 ? easySolved / easyTotal : 0;
    const mediumProgress = mediumTotal > 0 ? mediumSolved / mediumTotal : 0;
    const hardProgress = hardTotal > 0 ? hardSolved / hardTotal : 0;

    // Colors
    const easyColor = '#22c55e';  // emerald-500
    const mediumColor = '#f59e0b';  // amber-500
    const hardColor = '#ef4444';  // rose-500
    const bgColor = 'rgba(255,255,255,0.1)';

    // Calculate segment lengths based on difficulty ratios
    const easyRatio = easyTotal / (total || 1);
    const mediumRatio = mediumTotal / (total || 1);
    const hardRatio = hardTotal / (total || 1);

    // Segment arcs
    const easyArc = circumference * easyRatio;
    const mediumArc = circumference * mediumRatio;
    const hardArc = circumference * hardRatio;

    // Calculate filled portions
    const easyFilled = easyArc * easyProgress;
    const mediumFilled = mediumArc * mediumProgress;
    const hardFilled = hardArc * hardProgress;

    return (
        <div className="flex items-center gap-6">
            {/* Difficulty Stats */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-semibold text-sm w-10">Easy</span>
                    <span className="text-slate-400 text-sm">{easySolved}/{easyTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-semibold text-sm w-10">Med</span>
                    <span className="text-slate-400 text-sm">{mediumSolved}/{mediumTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-semibold text-sm w-10">Hard</span>
                    <span className="text-slate-400 text-sm">{hardSolved}/{hardTotal}</span>
                </div>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                >
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={bgColor}
                        strokeWidth={strokeWidth}
                    />

                    {/* Easy segment (background) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(34, 197, 94, 0.2)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${easyArc} ${circumference}`}
                        strokeDashoffset={0}
                    />

                    {/* Medium segment (background) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(245, 158, 11, 0.2)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${mediumArc} ${circumference}`}
                        strokeDashoffset={-easyArc}
                    />

                    {/* Hard segment (background) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.2)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${hardArc} ${circumference}`}
                        strokeDashoffset={-(easyArc + mediumArc)}
                    />

                    {/* Easy filled */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={easyColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${easyFilled} ${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Medium filled */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={mediumColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${mediumFilled} ${circumference}`}
                        strokeDashoffset={-easyArc}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Hard filled */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={hardColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${hardFilled} ${circumference}`}
                        strokeDashoffset={-(easyArc + mediumArc)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Endpoint dots */}
                    {easyTotal > 0 && (
                        <circle
                            cx={size / 2 + radius * Math.cos((easyFilled / circumference) * 2 * Math.PI)}
                            cy={size / 2 + radius * Math.sin((easyFilled / circumference) * 2 * Math.PI)}
                            r={4}
                            fill={easyColor}
                            className="transition-all duration-500"
                        />
                    )}
                    {mediumTotal > 0 && mediumFilled > 0 && (
                        <circle
                            cx={size / 2 + radius * Math.cos(((easyArc + mediumFilled) / circumference) * 2 * Math.PI)}
                            cy={size / 2 + radius * Math.sin(((easyArc + mediumFilled) / circumference) * 2 * Math.PI)}
                            r={4}
                            fill={mediumColor}
                            className="transition-all duration-500"
                        />
                    )}
                    {hardTotal > 0 && hardFilled > 0 && (
                        <circle
                            cx={size / 2 + radius * Math.cos(((easyArc + mediumArc + hardFilled) / circumference) * 2 * Math.PI)}
                            cy={size / 2 + radius * Math.sin(((easyArc + mediumArc + hardFilled) / circumference) * 2 * Math.PI)}
                            r={4}
                            fill={hardColor}
                            className="transition-all duration-500"
                        />
                    )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                        {solved}<span className="text-slate-500 text-lg">/{total}</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Solved</span>
                </div>
            </div>
        </div>
    );
};

export default ProgressRing;
