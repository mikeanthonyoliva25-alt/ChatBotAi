// Supabase auth handler
document.addEventListener('DOMContentLoaded', () => {
    const config = window.SUPABASE_CONFIG;
    if (!config?.SUPABASE_URL || !config?.SUPABASE_ANON_KEY) {
        document.getElementById('authError').textContent = 'Supabase not configured';
        document.getElementById('authError').style.display = 'block';
        return;
    }

    const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    const authForm = document.getElementById('authForm');
    const authButton = document.getElementById('authButton');
    const authTitle = document.getElementById('authTitle');
    const authError = document.getElementById('authError');
    const toggleAuth = document.getElementById('toggleAuth');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleBtn = document.getElementById('googleBtn');

    let isSignUp = true;

    // Toggle between signup and signin
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        authTitle.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        authButton.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        toggleAuth.textContent = isSignUp ? 'Have an account? Sign In' : "Don't have account? Sign Up";
        authError.style.display = 'none';
    });

    // Handle email/password form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            authError.textContent = 'Email and password required';
            authError.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            authError.textContent = 'Password must be at least 6 characters';
            authError.style.display = 'block';
            return;
        }

        authForm.classList.add('loading');
        authButton.disabled = true;

        try {
            let result;

            if (isSignUp) {
                result = await supabase.auth.signUp({ email, password });
            } else {
                result = await supabase.auth.signInWithPassword({ email, password });
            }

            if (result.error) {
                authError.textContent = result.error.message || 'Authentication failed';
                authError.style.display = 'block';
            } else {
                // Success — redirect to chat
                window.location.href = 'index.html';
            }
        } catch (error) {
            authError.textContent = error.message || 'An error occurred';
            authError.style.display = 'block';
        } finally {
            authForm.classList.remove('loading');
            authButton.disabled = false;
        }
    });

    // Google OAuth
    googleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        authError.style.display = 'none';
        googleBtn.disabled = true;

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/index.html'
                }
            });

            if (error) {
                authError.textContent = error.message || 'Google sign-in failed';
                authError.style.display = 'block';
            }
        } catch (error) {
            authError.textContent = error.message || 'An error occurred';
            authError.style.display = 'block';
        } finally {
            googleBtn.disabled = false;
        }
    });

    // Check if already logged in
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            window.location.href = 'index.html';
        }
    });
});
