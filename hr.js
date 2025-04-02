// Enhanced HR Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with dashboard data
    loadDashboardData();
    showDashboard();
    
    // Add event listeners
    setupEventListeners();
  });
  
  // Configuration
  const CONFIG = {
    roleSalaries: {
      'Accountant': 15000,
      'Manager': 30000,
      'Security': 5000,
      'Cleaner': 5000,
      'Finance': 10000,
      'HR': 12000
    },
    apiBaseUrl: 'http://localhost:8000/api'
  };
  
  // Set up all event listeners
  function setupEventListeners() {
    // Role salary autofill
    document.getElementById('role').addEventListener('change', function() {
      const selectedRole = this.value;
      const salaryInput = document.getElementById('salary');
      salaryInput.value = CONFIG.roleSalaries[selectedRole] || '';
      if (salaryInput.value) {
        salaryInput.classList.add('success-glow');
        setTimeout(() => salaryInput.classList.remove('success-glow'), 1000);
      }
    });
  
    // Form submissions
    document.getElementById('hiringForm').addEventListener('submit', handleHireEmployee);
    document.getElementById('firingForm').addEventListener('submit', handleFireEmployee);
    
    // Modal interactions
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('overlay').addEventListener('click', toggleSidebar);
    
    // Sidebar buttons
    document.querySelector('.sidebar button:not(.logout-btn)').addEventListener('click', openModal);
    document.querySelector('.logout-btn').addEventListener('click', logout);
  }
  
  // Page Navigation Functions
  function showDashboard() {
    document.getElementById('hrDashboard').style.display = 'flex';
    document.getElementById('hirePage').style.display = 'none';
    document.getElementById('firePage').style.display = 'none';
    loadDashboardData();
  }
  
  function showHirePage() {
    document.getElementById('hrDashboard').style.display = 'none';
    document.getElementById('hirePage').style.display = 'flex';
    document.getElementById('firePage').style.display = 'none';
    document.getElementById('hire-name').focus();
  }
  
  function showFirePage() {
    document.getElementById('hrDashboard').style.display = 'none';
    document.getElementById('hirePage').style.display = 'none';
    document.getElementById('firePage').style.display = 'flex';
    document.getElementById('fire-name').focus();
  }
  
  // Sidebar and Modal Functions
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburger = document.querySelector('.hamburger-menu');
  
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('open');
    
    // Add animation class
    if (sidebar.classList.contains('open')) {
      sidebar.classList.add('sidebar-open-animation');
      setTimeout(() => sidebar.classList.remove('sidebar-open-animation'), 500);
    }
  }
  
  function openModal() {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('currentUsername').focus();
    toggleSidebar();
  }
  
  function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('credentialsForm').reset();
  }
  
  // Data Loading Functions
  async function loadDashboardData() {
    try {
      await Promise.all([
        loadHRManagerData(),
        loadDepartmentStats(),
        loadRecentActions()
      ]);
      
      // Add subtle animation when data loads
      document.querySelector('.dashboard-container').classList.add('data-loaded');
      setTimeout(() => {
        document.querySelector('.dashboard-container').classList.remove('data-loaded');
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    }
  }
  
  async function loadHRManagerData() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/current-user`);
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Failed to load user data');
      
      document.getElementById('userName').textContent = result.user.name;
      document.getElementById('userEmpId').textContent = result.user.emp_id;
      document.getElementById('userRole').textContent = result.user.role;
      document.getElementById('hrName').textContent = result.user.name;
      
      // Store in sessionStorage
      sessionStorage.setItem('hrName', result.user.name);
      sessionStorage.setItem('hrEmpId', result.user.emp_id);
      sessionStorage.setItem('hrRole', result.user.role);
      
    } catch (error) {
      console.error('Error loading HR data:', error);
      // Fallback to session storage
      document.getElementById('userName').textContent = sessionStorage.getItem('hrName') || 'HR Manager';
      document.getElementById('userEmpId').textContent = sessionStorage.getItem('hrEmpId') || 'HR001';
      document.getElementById('userRole').textContent = sessionStorage.getItem('hrRole') || 'HR Manager';
      document.getElementById('hrName').textContent = sessionStorage.getItem('hrName') || 'HR Manager';
    }
  }
  
  async function loadDepartmentStats() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/department-stats`);
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Failed to load stats');
      
      const statsHTML = result.stats.map(stat => `
        <div class="stat-item">
          <span class="stat-label">${stat.dep_name}:</span>
          <span class="stat-value">${stat.employee_count}</span>
        </div>
      `).join('');
      
      document.getElementById('statsContent').innerHTML = statsHTML;
      
    } catch (error) {
      console.error('Error loading department stats:', error);
      document.getElementById('statsContent').innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i> Failed to load statistics
        </div>
      `;
    }
  }
  
  async function loadRecentActions() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/recent-actions`);
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Failed to load actions');
      
      const actionsHTML = result.actions.map(action => `
        <div class="action-item">
          <div class="action-type">
            <i class="fas ${getActionIcon(action.action_type)}"></i>
            ${action.action_type}: ${action.emp_id}
          </div>
          <div>${action.details}</div>
          <div class="action-date">
            <i class="far fa-clock"></i> ${new Date(action.action_date).toLocaleString()}
          </div>
        </div>
      `).join('');
      
      document.getElementById('actionsContent').innerHTML = actionsHTML;
      
    } catch (error) {
      console.error('Error loading recent actions:', error);
      document.getElementById('actionsContent').innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i> Failed to load recent actions
        </div>
      `;
    }
  }
  
  function getActionIcon(actionType) {
    const icons = {
      'Hire': 'fa-user-plus',
      'Fire': 'fa-user-minus',
      'Update': 'fa-user-edit',
      'Promotion': 'fa-arrow-up'
    };
    return icons[actionType] || 'fa-user-cog';
  }
  
  // Form Handlers
  async function handleHireEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      // Disable button and show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      
      // Collect form data
      const formData = {
        name: document.getElementById('hire-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        city: document.getElementById('city').value.trim(),
        address: document.getElementById('address').value.trim(),
        salary: document.getElementById('salary').value.trim(),
        role: document.getElementById('role').value.trim(),
        branch_id: document.getElementById('branch').value.trim(),
        dob: document.getElementById('dob').value.trim(),
        gender: document.getElementById('gender').value.trim()
      };
  
      // Validate required fields
      if (Object.values(formData).some(value => !value)) {
        throw new Error('All fields are required');
      }
  
      // Send data to backend
      const response = await fetch(`${CONFIG.apiBaseUrl}/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error(result.error || 'Failed to hire employee');
      }
  
      // Show success popup
      showSuccessPopup(formData, result);
      
      // Reset form
      form.reset();
      
      // Update UI
      addNewActionToUI({
        action_type: 'Hire',
        emp_name: formData.name,
        details: `Hired as ${formData.role} with salary ${formData.salary}`,
        action_date: new Date().toISOString()
      });
      
      // Reload data
      loadDepartmentStats();
      
    } catch (error) {
      console.error('Hiring error:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Hire Employee';
    }
  }
  
  async function handleFireEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      
      const formData = {
        name: document.getElementById('fire-name').value.trim(),
        empId: document.getElementById('empId').value.trim()
      };
  
      if (!formData.name || !formData.empId) {
        throw new Error('Both name and employee ID are required');
      }
      
      const response = await fetch(`${CONFIG.apiBaseUrl}/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error(result.error || 'Failed to terminate employee');
      }
  
      showFirePopup(formData);
      form.reset();
      loadRecentActions();
      loadDepartmentStats();
      
    } catch (error) {
      console.error('Firing error:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Terminate Employee';
    }
  }
  
  async function updateCredentials() {
    const form = document.getElementById('credentialsForm');
    const currentUsername = document.getElementById('currentUsername').value;
    const newUsername = document.getElementById('newUsername').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
  
    if (!currentUsername || !newUsername || !currentPassword || !newPassword) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
  
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/update-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          newUsername,
          currentPassword,
          newPassword
        })
      });
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error(result.error || 'Failed to update credentials');
      }
  
      showToast('Credentials updated successfully!', 'success');
      closeModal();
      form.reset();
      
    } catch (error) {
      console.error('Error updating credentials:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  }
  
  // UI Helper Functions
  function showSuccessPopup(formData, result) {
    const successHTML = `
      <div class="success-popup">
        <h3>🎉 Employee Hired Successfully! 🎉</h3>
        <div class="employee-card">
          <div class="emp-name">${formData.name}</div>
          <div class="emp-id">Employee ID: <span>${result.emp_id}</span></div>
          <div class="emp-credentials">
            <p><strong>Username:</strong> ${result.username}</p>
            <p><strong>Temporary Password:</strong> ${result.temp_password}</p>
          </div>
          <div class="warning">⚠️ Employee must change password on first login</div>
        </div>
        <button onclick="closeSuccessPopup()">Close</button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
  }
  
  function showFirePopup(formData) {
    const fireHTML = `
      <div class="fire-popup">
        <div class="fire-animation">🔥</div>
        <h3>Employee Terminated</h3>
        <p>${formData.name} (ID: ${formData.empId}) has been terminated.</p>
        <p class="warning">Access revoked immediately!</p>
        <button onclick="closeFirePopup()">Acknowledge</button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', fireHTML);
  }
  
  function addNewActionToUI(action) {
    const actionsContainer = document.getElementById('actionsContent');
    const actionHTML = `
      <div class="action-item new-action">
        <div class="action-type">
          <i class="fas ${getActionIcon(action.action_type)}"></i>
          ${action.action_type}: ${action.emp_name}
        </div>
        <div>${action.details}</div>
        <div class="action-date">
          <i class="far fa-clock"></i> ${new Date(action.action_date).toLocaleString()}
        </div>
      </div>
    `;
    
    // Add new action at the top with animation
    actionsContainer.insertAdjacentHTML('afterbegin', actionHTML);
    
    // Highlight the new action temporarily
    const newAction = actionsContainer.firstElementChild;
    setTimeout(() => newAction.classList.remove('new-action'), 2000);
  }
  
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${getToastIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after delay
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }
  
  function getToastIcon(type) {
    const icons = {
      'success': 'fa-check-circle',
      'error': 'fa-exclamation-circle',
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
  }
  
  // Close popup functions
  function closeSuccessPopup() {
    const popup = document.querySelector('.success-popup');
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 500);
  }
  
  function closeFirePopup() {
    const popup = document.querySelector('.fire-popup');
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 500);
  }
  
  // Logout function
  async function logout() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
  
      const result = await response.json();
  
      if (result.success) {
        // Clear session storage
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = '/login.html';
      } else {
        throw new Error(result.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Failed to logout. Please try again.', 'error');
    }
  }