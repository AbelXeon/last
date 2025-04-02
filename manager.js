function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const hamburger = document.querySelector('.hamburger-menu');

  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  hamburger.classList.toggle('open');
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('credentialMessage').textContent = '';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function updateCredentials() {
  const currentUsername = document.getElementById('currentUsername').value;
  const newUsername = document.getElementById('newUsername').value;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const messageElement = document.getElementById('credentialMessage');

  if (!currentUsername || !newUsername || !currentPassword || !newPassword) {
    messageElement.textContent = 'All fields are required';
    messageElement.style.color = 'red';
    return;
  }

  fetch('/update-credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_username: currentUsername,
      new_username: newUsername,
      current_password: currentPassword,
      new_password: newPassword
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      messageElement.textContent = 'Credentials updated successfully!';
      messageElement.style.color = 'green';
      setTimeout(() => {
        closeModal();
        window.location.reload();
      }, 1500);
    } else {
      messageElement.textContent = data.error || 'Failed to update credentials';
      messageElement.style.color = 'red';
    }
  })
  .catch(error => {
    messageElement.textContent = 'Error updating credentials: ' + error.message;
    messageElement.style.color = 'red';
    console.error('Error:', error);
  });
}

document.getElementById('viewReports').addEventListener('click', function() {
  document.getElementById('reportSection').style.display = 'block';
  document.getElementById('employeeListSection').style.display = 'none';
});

document.getElementById('manageEmployees').addEventListener('click', function() {
  document.getElementById('employeeListSection').style.display = 'block';
  document.getElementById('reportSection').style.display = 'none';
});

// Initialize the page with reports shown by default
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('reportSection').style.display = 'block';
});

async function logout() {
try {
const response = await fetch('http://localhost:8000/api/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
});

const result = await response.json();

if (result.success) {
  // Redirect to login page
  window.location.href = '/login.html';
} else {
  throw new Error(result.error || 'Logout failed');
}
} catch (error) {
console.error('Logout error:', error);
alert('Failed to logout. Please try again.');
}
}

