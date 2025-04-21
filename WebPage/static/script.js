document.addEventListener('DOMContentLoaded', () => {
    const params   = new URLSearchParams(window.location.search);
    const mode     = params.get('mode') || 'login';
    const error    = params.get('error');
    const form     = document.getElementById('authForm');
    const title    = document.getElementById('formTitle');
    const toggle   = document.getElementById('toggleText');
    const errorMsg = document.getElementById('errorMsg');
  
    if (mode === 'signup') {
      title.textContent = 'Sign Up';
      form.action        = '/signup';
      toggle.innerHTML   = 'Already have an account? <a href="/login">Login</a>';
      form.querySelector('button').textContent = 'Sign Up';
    } else {
      title.textContent = 'Login';
      form.action        = '/login';
      toggle.innerHTML   = 'Don’t have an account? <a href="/signup">Sign up</a>';
      form.querySelector('button').textContent = 'Login';
    }
  
    if (error === 'invalid') {
      errorMsg.textContent = 'Incorrect username or password';
    } else if (error === 'exists') {
      errorMsg.textContent = 'Username already exists';
    }
  });
  