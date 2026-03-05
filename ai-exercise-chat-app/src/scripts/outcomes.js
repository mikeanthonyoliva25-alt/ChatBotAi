function getExercisePrograms() {
    return [
        { name: 'Brisk Walking', type: 'cardio', intensity: 'Low', home: true, gym: true, tool: 'None' },
        { name: 'Bodyweight Strength', type: 'strength', intensity: 'Medium', home: true, gym: true, tool: 'None' },
        { name: 'HIIT Intervals', type: 'cardio', intensity: 'High', home: true, gym: true, tool: 'None' },
        { name: 'Resistance Band Circuit', type: 'strength', intensity: 'Medium', home: true, gym: true, tool: 'Resistance bands' },
        { name: 'Dumbbell Push/Pull', type: 'strength', intensity: 'Medium', home: true, gym: true, tool: 'Dumbbells' },
        { name: 'Treadmill Incline Walk', type: 'cardio', intensity: 'Low', home: false, gym: true, tool: 'Treadmill' },
        { name: 'Barbell Compound Lifts', type: 'strength', intensity: 'High', home: false, gym: true, tool: 'Barbell rack' },
        { name: 'Yoga Recovery Flow', type: 'mobility', intensity: 'Low', home: true, gym: true, tool: 'Mat' }
    ];
}

function generateOutcomes(profile) {
    const bmi = Number(profile.bmi) || 0;
    const bmiLabel = bmi > 0 ? getBodyCondition(bmi) : 'Unknown';
    const riskLevel = getRiskLevel(profile, bmi);
    const weeklyPlan = buildWeeklyPlan(profile);
    const timeline = buildTimeline(profile, bmi);

    return {
        bmi,
        bmiLabel,
        riskLevel,
        weeklyPlan,
        timeline,
        summary: buildSummary(profile, bmiLabel, riskLevel, timeline)
    };
}

function getRiskLevel(profile, bmi) {
    let score = 0;
    if (bmi >= 30 || bmi < 17) score += 2;
    if (profile.busyLevel === 'high') score += 1;
    if (profile.daysPerWeek <= 2) score += 1;
    if (profile.minutesPerDay < 25) score += 1;

    if (score >= 3) return 'Moderate';
    return 'Low';
}

function buildTimeline(profile, bmi) {
    const base = profile.goal === 'fat_loss' ? -0.4 : profile.goal === 'muscle_gain' ? 0.25 : 0;
    const consistencyBoost = Math.min(profile.daysPerWeek, 6) * 0.04;
    const busyPenalty = profile.busyLevel === 'high' ? 0.1 : 0;
    const weeklyDelta = base + consistencyBoost - busyPenalty;

    return {
        week4: estimateChange(4, weeklyDelta, profile.goal),
        week8: estimateChange(8, weeklyDelta, profile.goal),
        week12: estimateChange(12, weeklyDelta, profile.goal),
        note: bmi >= 30
            ? 'Start progressive. Prioritize low-impact cardio + strength fundamentals.'
            : 'Keep progressive overload and recovery balanced every week.'
    };
}

function estimateChange(weeks, weeklyDelta, goal) {
    const delta = (weeklyDelta * weeks).toFixed(1);
    if (goal === 'fat_loss') return `~${Math.abs(delta)} kg fat-loss potential`;
    if (goal === 'muscle_gain') return `~${Math.abs(delta)} kg lean-mass potential`;
    return `Body recomposition trend with ~${Math.abs(delta)} kg net shift`;
}

function buildWeeklyPlan(profile) {
    const programs = getExercisePrograms();
    const lowerTools = profile.tools.map((tool) => tool.toLowerCase());

    const filtered = programs.filter((program) => {
        const locationOk = profile.location === 'home' ? program.home : program.gym;
        const toolOk =
            program.tool === 'None' ||
            lowerTools.includes(program.tool.toLowerCase()) ||
            profile.location === 'gym';
        return locationOk && toolOk;
    });

    const preferred = filtered.filter((program) =>
        profile.preferences.some((pref) => program.name.toLowerCase().includes(pref.toLowerCase()) || program.type.includes(pref.toLowerCase()))
    );

    const pool = preferred.length ? preferred : filtered;
    const restDays = Math.max(1, 7 - profile.daysPerWeek);
    const days = [];
    for (let day = 1; day <= profile.daysPerWeek; day += 1) {
        const pick = pool[(day - 1) % Math.max(pool.length, 1)] || { name: 'Bodyweight Circuit', intensity: 'Medium' };
        days.push(`Day ${day}: ${pick.name} (${profile.minutesPerDay} min, ${pick.intensity})`);
    }
    days.push(`Rest/Active Recovery Days: ${restDays}`);

    return days;
}

function buildSummary(profile, bmiLabel, riskLevel, timeline) {
    const locationText = profile.location === 'home' ? 'Home workout mode' : 'Gym mode';
    return [
        `BMI category: ${bmiLabel}`,
        `Risk level: ${riskLevel}`,
        `${locationText}`,
        `4 weeks: ${timeline.week4}`,
        `8 weeks: ${timeline.week8}`,
        `12 weeks: ${timeline.week12}`,
        `Note: ${timeline.note}`
    ].join('\n');
}