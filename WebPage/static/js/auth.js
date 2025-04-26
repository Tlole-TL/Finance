// auth.js
document.addEventListener('DOMContentLoaded', () => {
  const params   = new URLSearchParams(window.location.search);
  const mode     = params.get('mode')    || 'login';
  const error    = params.get('error');
  const signupOk = params.get('signup');
  const form     = document.getElementById('authForm');
  const title    = document.getElementById('formTitle');
  const toggle   = document.getElementById('toggleText');
  const errorMsg = document.getElementById('errorMsg');

  // Mode switch
  if (mode === 'signup') {
    title.textContent = 'Sign Up';
    form.action       = '/signup';
    form.querySelector('button').textContent = 'Sign Up';
    toggle.innerHTML  = 'Already have an account? <a href="/login">Login</a>';
  } else {
    title.textContent = 'Login';
    form.action       = '/login';
    form.querySelector('button').textContent = 'Login';
    toggle.innerHTML  = 'Don’t have an account? <a href="/signup">Sign up</a>';
  }

  // Feedback messages
  if (error === 'invalid') {
    errorMsg.textContent = mode === 'login'
      ? 'Incorrect username or password.'
      : 'Invalid signup information.';
  } else if (error === 'exists') {
    errorMsg.textContent = 'Username already exists.';
  } else if (signupOk === 'success') {
    errorMsg.textContent = 'Signup successful! Please log in.';
    errorMsg.classList.add('success');
  }
});
