// Main JavaScript file for the AI Exercise Chat System

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.SUPABASE_CONFIG;
    const supabase = config?.SUPABASE_URL && config?.SUPABASE_ANON_KEY
        ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        : null;

    // Check authentication
    if (!supabase) {
        window.location.href = 'auth.html';
        return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        window.location.href = 'auth.html';
        return;
    }

    const userId = session.user.id;

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    });

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
    let conversationReady = false;
    const userIdColumnSupport = {};
    let conversationOwnerColumn;

    async function hasUserIdColumn(tableName) {
        if (tableName in userIdColumnSupport) {
            return userIdColumnSupport[tableName];
        }

        const { error } = await supabase
            .from(tableName)
            .select('user_id')
            .limit(1);

        const supported = !(error && error.code === '42703');
        userIdColumnSupport[tableName] = supported;
        return supported;
    }

    async function getConversationOwnerColumn() {
        if (conversationOwnerColumn !== undefined) {
            return conversationOwnerColumn;
        }

        const candidates = ['user_id', 'owner_id', 'profile_id', 'account_id'];

        for (const columnName of candidates) {
            const { error } = await supabase
                .from('conversations')
                .select(columnName)
                .limit(1);

            if (!(error && error.code === '42703')) {
                conversationOwnerColumn = columnName;
                return conversationOwnerColumn;
            }
        }

        conversationOwnerColumn = null;
        return conversationOwnerColumn;
    }

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

        const ok = await ensureConversation();
        if (!ok) {
            displayMessage('Could not start a session right now. Please try again.', 'ai');
            return;
        }

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

        // Show success notification
        console.log('✅ Data saved successfully!');
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

    async function saveAssessment(profile) {
        const includeUserId = await hasUserIdColumn('assessments');
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

        if (includeUserId) {
            payload.user_id = userId;
        }

        const { error } = await supabase.from('assessments').insert(payload);
        if (error) {
            console.error('❌ Failed to save assessment:', error.message);
        } else {
            console.log('✅ Assessment saved');
        }
    }

    async function saveMessage(role, content) {
        const includeUserId = await hasUserIdColumn('messages');
        const payload = {
            conversation_id: conversationId,
            role,
            content
        };

        if (includeUserId) {
            payload.user_id = userId;
        }

        const { error } = await supabase.from('messages').insert(payload);

        if (error) {
            console.error('Failed to save message:', error.message);
        } else {
            console.log('✅ Message saved:', role);
        }
    }

    async function savePlan(profile, outcome) {
        const includeUserId = await hasUserIdColumn('plans');
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

        if (includeUserId) {
            payload.user_id = userId;
        }

        const { error } = await supabase.from('plans').insert(payload);
        if (error) {
            console.error('❌ Failed to save plan:', error.message);
        } else {
            console.log('✅ Plan saved');
        }
    }

    async function ensureConversation() {
        if (conversationReady) return true;

        const ownerColumn = await getConversationOwnerColumn();
        const payload = { id: conversationId };

        if (ownerColumn) {
            payload[ownerColumn] = userId;
        }

        const { error } = await supabase.from('conversations').insert(payload);
        if (error) {
            console.error('❌ Failed to create conversation:', error.message);
            console.error('Conversation payload:', payload);
            return false;
        }

        console.log('✅ Conversation created');
        conversationReady = true;
        return true;
    }
});