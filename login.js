// Password visibility toggle
const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#password');

togglePassword.addEventListener('click', function() {
  // Toggle the type attribute
  const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
  password.setAttribute('type', type);
  
  // Toggle the eye icon
  this.classList.toggle('fa-eye');
  this.classList.toggle('fa-eye-slash');
});

// Form submission
document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const errorElement = document.getElementById('errorMessage');
  errorElement.style.display = 'none';

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
      const response = await fetch('/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
              username: username, 
              password: password 
          })
      });

      // First check if response is OK
      if (!response.ok) {
          // Try to parse error as JSON
          try {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Login failed');
          } catch (e) {
              // If not JSON, use status text
              throw new Error(response.statusText);
          }
      }

      // If OK, parse the JSON
      const data = await response.json();
      
      // Redirect logic
      const jobTitle = data.job_title.toLowerCase();
      const department = data.department.toLowerCase();

      if (jobTitle.includes('hr') || department.includes('hr')) {
          window.location.href = '/hr-dashboard';
      } 
      else if (jobTitle.includes('accountant') || department.includes('finance')) {
          window.location.href = '/accountant-dashboard';
      } 
      else if (jobTitle.includes('manager') || department.includes('management')) {
          window.location.href = '/manager-dashboard';
      } 
      else {
          window.location.href = '/employee-dashboard';
      }

  } catch (error) {
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
      console.error('Login error:', error);
  }
});
