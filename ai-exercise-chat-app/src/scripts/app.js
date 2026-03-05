// Main JavaScript file for the AI Exercise Chat System

document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const resultCard = document.getElementById('result-card');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    const ageInput = document.getElementById('age');
    const sexInput = document.getElementById('sex');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const bmiInput = document.getElementById('bmi');
    const bodyConditionInput = document.getElementById('body-condition');
    const goalInput = document.getElementById('goal');
    const daysPerWeekInput = document.getElementById('days-per-week');
    const minutesPerDayInput = document.getElementById('minutes-per-day');
    const busyLevelInput = document.getElementById('busy-level');
    const locationInput = document.getElementById('location');
    const exercisePreferencesInput = document.getElementById('exercise-preferences');
    const availableToolsInput = document.getElementById('available-tools');

    const conversationId = crypto.randomUUID();
    const supabase = createSupabaseClient();
    let conversationReady = false;

    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSend();
        }
    });

    displayMessage(
        'Hi! Complete your profile and send your goal. I will generate 4/8/12-week outcome + weekly program.',
        'ai'
    );

    async function handleSend() {
        const message = userInput.value.trim();
        if (!message) return;

        await ensureConversation();

        displayMessage(message, 'user');
        userInput.value = '';

        await saveMessage('user', message);

        const profile = getUserProfile();
        await saveAssessment(profile);

        const outcome = generateOutcomes(profile);
        renderResultCard(outcome, profile);

        const aiReply = generateAssistantReply(message, profile, outcome);
        displayMessage(aiReply, 'ai');
        await saveMessage('assistant', aiReply);
        await savePlan(profile, outcome);
    }

    function getUserProfile() {
        const age = Number(ageInput.value) || null;
        const sex = sexInput.value || null;
        const heightCm = Number(heightInput.value) || null;
        const weightKg = Number(weightInput.value) || null;
        const manualBmi = Number(bmiInput.value);
        let safeBmi = Number.isFinite(manualBmi) && manualBmi > 0 ? manualBmi : null;

        if (!safeBmi && heightCm && weightKg) {
            const bmiInfo = getBMIInfo(weightKg, heightCm / 100);
            safeBmi = Number(bmiInfo.bmi);
            bmiInput.value = bmiInfo.bmi;
        }

        const bodyCondition = bodyConditionInput.value.trim() || 'Not specified';
        const goal = goalInput.value;
        const daysPerWeek = Math.min(7, Math.max(1, Number(daysPerWeekInput.value) || 4));
        const minutesPerDay = Math.min(180, Math.max(10, Number(minutesPerDayInput.value) || 45));
        const busyLevel = busyLevelInput.value;
        const location = locationInput.value;
        const preferences = exercisePreferencesInput.value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        const tools = availableToolsInput.value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        return {
            age,
            sex,
            heightCm,
            weightKg,
            bmi: safeBmi,
            bodyCondition,
            goal,
            daysPerWeek,
            minutesPerDay,
            busyLevel,
            location,
            preferences,
            tools
        };
    }

    function generateAssistantReply(userMessage, profile, outcome) {
        const topPrograms = outcome.weeklyPlan.slice(0, Math.min(3, outcome.weeklyPlan.length)).map((item) => `• ${item}`).join('\n');

        return [
            `Got it. Your current message: "${userMessage}".`,
            `Estimated body status: ${outcome.bmiLabel}.`,
            'Suggested starting programs:',
            topPrograms,
            `Forecast: ${outcome.timeline.week4} (4w), ${outcome.timeline.week8} (8w), ${outcome.timeline.week12} (12w).`,
            'Note: this is guidance only, not medical advice.'
        ].join('\n');
    }

    function renderResultCard(outcome, profile) {
        const title = profile.goal === 'fat_loss'
            ? 'Fat Loss Forecast'
            : profile.goal === 'muscle_gain'
                ? 'Muscle Gain Forecast'
                : 'Fitness Maintenance Forecast';

        resultCard.textContent = [
            title,
            '--------------------------',
            outcome.summary,
            '',
            'Weekly Program',
            '--------------------------',
            ...outcome.weeklyPlan,
            '',
            'Safety: Stop and consult a professional if you feel pain, chest tightness, dizziness, or unusual symptoms.'
        ].join('\n');
    }

    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = sender === 'user' ? 'user-message' : 'ai-message';
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function createSupabaseClient() {
        const config = window.SUPABASE_CONFIG;
        const hasConfig =
            !!config &&
            typeof config.SUPABASE_URL === 'string' &&
            typeof config.SUPABASE_ANON_KEY === 'string' &&
            config.SUPABASE_URL.length > 0 &&
            config.SUPABASE_ANON_KEY.length > 0;

        if (!hasConfig || !window.supabase?.createClient) {
            displayMessage('Supabase is not configured yet. Running in local-only mode.', 'ai');
            return null;
        }

        return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    }

    async function saveAssessment(profile) {
        if (!supabase) return;

        const payload = {
            conversation_id: conversationId,
            age: profile.age,
            sex: profile.sex,
            height_cm: profile.heightCm,
            weight_kg: profile.weightKg,
            bmi: profile.bmi,
            body_condition: profile.bodyCondition,
            goal: profile.goal,
            days_per_week: profile.daysPerWeek,
            minutes_per_day: profile.minutesPerDay,
            busy_level: profile.busyLevel,
            location: profile.location,
            exercise_preferences: profile.preferences,
            available_tools: profile.tools
        };

        const { error } = await supabase.from('assessments').insert(payload);
        if (error) {
            console.error('Failed to save assessment:', error.message);
        }
    }

    async function saveMessage(role, content) {
        if (!supabase) return;

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            role,
            content
        });

        if (error) {
            console.error('Failed to save message:', error.message);
        }
    }

    async function savePlan(profile, outcome) {
        if (!supabase) return;

        const payload = {
            conversation_id: conversationId,
            goal: profile.goal,
            risk_level: outcome.riskLevel,
            forecast_week4: outcome.timeline.week4,
            forecast_week8: outcome.timeline.week8,
            forecast_week12: outcome.timeline.week12,
            weekly_plan: outcome.weeklyPlan,
            summary: outcome.summary
        };

        const { error } = await supabase.from('plans').insert(payload);
        if (error) {
            console.error('Failed to save plan:', error.message);
        }
    }

    async function ensureConversation() {
        if (!supabase || conversationReady) return;

        const { error } = await supabase.from('conversations').insert({ id: conversationId });
        if (error) {
            console.error('Failed to create conversation:', error.message);
            return;
        }

        conversationReady = true;
    }
});