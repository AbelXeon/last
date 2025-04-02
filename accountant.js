// Navigation between pages
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page-container').forEach(page => {
    page.classList.remove('active');
  });
  
  // Hide dashboard
  document.getElementById('dashboard').style.display = 'none';
  
  // Show selected page
  if (pageId === 'dashboard') {
    document.getElementById('dashboard').style.display = 'block';
  } else {
    document.getElementById(`${pageId}-page`).classList.add('active');
  }
  
  // Close sidebar if open
  closeSidebar();
}

// Sidebar functions
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const hamburger = document.querySelector('.hamburger-menu');

  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  hamburger.classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
  document.querySelector('.hamburger-menu').classList.remove('open');
}

// Modal functions
function openModal() {
  document.getElementById('modal').style.display = 'flex';
  closeSidebar();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// Logout function
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

// Form submissions
document.getElementById('balanceForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const accountNo = document.getElementById('balanceAccountNo').value;
  if (!accountNo) {
    alert('Please enter an account number.');
    return;
  }
  alert(`Searching for balance of account: ${accountNo}`);
  this.reset();
});

document.getElementById('withdrawForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const accountNo = document.getElementById('withdrawAccountNo').value;
  if (!accountNo) {
    alert('Please enter an account number.');
    return;
  }
  alert(`Searching for account to withdraw: ${accountNo}`);
  this.reset();
});

document.getElementById('depositForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const accountNo = document.getElementById('depositAccountNo').value;
  if (!accountNo) {
    alert('Please enter an account number.');
    return;
  }
  alert(`Searching for account to deposit: ${accountNo}`);
  this.reset();
});

document.getElementById('createAccountForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const dob = document.getElementById('dob').value;
  const phone = document.getElementById('phone').value;
  const gender = document.getElementById('gender').value;
  const email = document.getElementById('email').value;
  const address = document.getElementById('address').value;
  
  if (!name || !dob || !phone || !gender || !email || !address) {
    alert('Please fill in all fields.');
    return;
  }
  
  alert('Account created successfully!');
  this.reset();
  showPage('dashboard');
});

// Initialize with dashboard visible
showPage('dashboard');
