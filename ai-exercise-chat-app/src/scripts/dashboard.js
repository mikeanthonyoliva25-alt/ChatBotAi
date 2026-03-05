// Dashboard script
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

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    });

    // Fetch and display data
    async function loadDashboard() {
        try {
            const ownerColumn = await getConversationOwnerColumn();

            // Fetch conversations
            let conversationsQuery = supabase
                .from('conversations')
                .select('id, created_at')
                .order('created_at', { ascending: false });

            if (ownerColumn) {
                conversationsQuery = conversationsQuery.eq(ownerColumn, userId);
            } else {
                conversationsQuery = conversationsQuery.limit(0);
            }

            const { data: conversations, error: convError } = await conversationsQuery;

            if (convError) throw convError;

            const conversationIds = (conversations || []).map((conv) => conv.id);

            // Fetch assessments (compatible with both old/new schema)
            let assessmentsQuery = supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false });

            if (await hasUserIdColumn('assessments')) {
                assessmentsQuery = assessmentsQuery.eq('user_id', userId);
            } else if (conversationIds.length > 0) {
                assessmentsQuery = assessmentsQuery.in('conversation_id', conversationIds);
            } else {
                assessmentsQuery = assessmentsQuery.limit(0);
            }

            const { data: assessments, error: assessError } = await assessmentsQuery;
            if (assessError) throw assessError;

            // Fetch plans (compatible with both old/new schema)
            let plansQuery = supabase
                .from('plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (await hasUserIdColumn('plans')) {
                plansQuery = plansQuery.eq('user_id', userId);
            } else if (conversationIds.length > 0) {
                plansQuery = plansQuery.in('conversation_id', conversationIds);
            } else {
                plansQuery = plansQuery.limit(0);
            }

            const { data: plans, error: plansError } = await plansQuery;
            if (plansError) throw plansError;

            // Calculate stats
            const totalWorkouts = conversations?.length || 0;
            const latestAssessment = assessments?.[0];
            const oldestAssessment = assessments?.[assessments.length - 1];

            // Update stats cards
            document.getElementById('totalWorkouts').textContent = totalWorkouts;

            if (latestAssessment) {
                // Current BMI
                const currentBMI = latestAssessment.bmi
                    ? latestAssessment.bmi.toFixed(1)
                    : '--';
                document.getElementById('currentBMI').textContent = currentBMI;

                // Weight change
                if (assessments.length > 1 && latestAssessment.weight_kg && oldestAssessment.weight_kg) {
                    const weightChange = (latestAssessment.weight_kg - oldestAssessment.weight_kg).toFixed(1);
                    const sign = weightChange > 0 ? '+' : '';
                    document.getElementById('weightChange').textContent = `${sign}${weightChange} kg`;
                } else {
                    document.getElementById('weightChange').textContent = '--';
                }

                // Main goal
                const goalText = latestAssessment.goal
                    ? latestAssessment.goal.replace('_', ' ').toUpperCase()
                    : '--';
                document.getElementById('mainGoal').textContent = goalText;
            }

            // Display conversations with details
            const convList = document.getElementById('conversationsList');
            if (conversations && conversations.length > 0) {
                const conversationItems = await Promise.all(
                    conversations.map(async (conv, idx) => {
                        const date = new Date(conv.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });

                        const assessment = assessments?.find(a => a.conversation_id === conv.id);
                        const plan = plans?.find(p => p.conversation_id === conv.id);

                        // Get message count
                        const { count: msgCount } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('conversation_id', conv.id);

                        return `
                    <div class="conversation-item" onclick="window.location.href='index.html'">
                        <h4>Session #${idx + 1}</h4>
                        <small><strong>Date:</strong> ${date}</small>
                        ${assessment ? `<small><strong>Goal:</strong> ${assessment.goal?.replace('_', ' ') || 'N/A'}</small>` : ''}
                        ${assessment ? `<small><strong>BMI:</strong> ${assessment.bmi?.toFixed(1) || 'N/A'}</small>` : ''}
                        ${assessment ? `<small><strong>Weight:</strong> ${assessment.weight_kg?.toFixed(1) || 'N/A'} kg</small>` : ''}
                        ${plan ? `<small><strong>Risk Level:</strong> ${plan.risk_level || 'N/A'}</small>` : ''}
                        <small><strong>Messages:</strong> ${msgCount || 0}</small>
                    </div>
                `;
                    })
                );

                convList.innerHTML = conversationItems.join('');
            } else {
                convList.innerHTML =
                    '<div class="empty-state">No sessions yet. Start chatting to track your progress!</div>';
            }

            // Display progress timeline with real data
            if (assessments && assessments.length > 0) {
                const timeline = document.getElementById('progressTimeline');
                const latestPlan = plans?.[0];

                if (latestPlan) {
                    const weeks = [
                        { week: 4, key: 'forecast_week4' },
                        { week: 8, key: 'forecast_week8' },
                        { week: 12, key: 'forecast_week12' }
                    ];

                    timeline.innerHTML = weeks
                        .map(({ week, key }) => {
                            const forecast = latestPlan[key] || 'No forecast';
                            const progress = Math.min(100, (week / 12) * 100);
                            return `
                        <div class="chart-row">
                            <div class="chart-label">Week ${week}</div>
                            <div class="chart-bar">
                                <div class="chart-fill" style="width: ${progress}%">${forecast}</div>
                            </div>
                        </div>
                    `;
                        })
                        .join('');

                    // Add weight/BMI progress if multiple assessments
                    if (assessments.length > 1) {
                        const weightProgress = assessments
                            .slice(0, 5)
                            .reverse()
                            .map((a, idx) => {
                                const date = new Date(a.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                });
                                const weight = a.weight_kg?.toFixed(1) || '--';
                                const bmi = a.bmi?.toFixed(1) || '--';
                                return `
                            <div class="chart-row" style="margin-top: 16px;">
                                <div class="chart-label">${date}</div>
                                <div style="flex: 1; display: flex; gap: 16px; font-size: 14px; color: var(--muted);">
                                    <span><strong>Weight:</strong> ${weight} kg</span>
                                    <span><strong>BMI:</strong> ${bmi}</span>
                                </div>
                            </div>
                        `;
                            })
                            .join('');

                        timeline.innerHTML += '<h3 style="margin-top: 32px; font-size: 16px;">Historical Data</h3>' + weightProgress;
                    }
                } else {
                    timeline.innerHTML = '<p style="color: var(--muted);">Complete a session to see your forecast.</p>';
                }
            } else {
                document.getElementById('progressTimeline').innerHTML = 
                    '<p style="color: var(--muted);">No data yet. Start your first workout session!</p>';
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            document.getElementById('conversationsList').innerHTML =
                '<div class="empty-state">Error loading data. Please refresh.</div>';
        }
    }

    loadDashboard();
});
