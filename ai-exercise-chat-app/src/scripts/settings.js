// Settings page
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
    const userEmail = session.user.email || 'Unknown';

    // Display user email
    document.getElementById('userEmail').textContent = userEmail;

    // Logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtn2 = document.getElementById('logoutBtn2');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    };

    logoutBtn.addEventListener('click', handleLogout);
    logoutBtn2.addEventListener('click', handleLogout);

    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.add('active');
    });

    cancelDelete.addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });

    confirmDelete.addEventListener('click', async () => {
        confirmDelete.disabled = true;
        confirmDelete.textContent = 'Deleting...';

        try {
            // Delete all user data
            const tables = ['conversations', 'assessments', 'plans', 'messages'];

            for (const table of tables) {
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq('user_id', userId);

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 = no rows matched, which is fine
                    console.error(`Error deleting from ${table}:`, error);
                }
            }

            // Delete auth user
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

            if (deleteError) {
                console.error('Error deleting user:', deleteError);
                confirmDelete.disabled = false;
                confirmDelete.textContent = 'Delete Permanently';
                alert('Error deleting account. Please try again.');
                return;
            }

            // Sign out and redirect
            await supabase.auth.signOut();
            window.location.href = 'auth.html?deleted=true';
        } catch (error) {
            console.error('Error:', error);
            confirmDelete.disabled = false;
            confirmDelete.textContent = 'Delete Permanently';
            alert('Error deleting account. Please try again.');
        }
    });
});
