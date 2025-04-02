// DOM Elements
const hrDashboard = document.getElementById('hrDashboard');
const hirePage = document.getElementById('hirePage');
const firePage = document.getElementById('firePage');
const hiringForm = document.getElementById('hiringForm');
const firingForm = document.getElementById('firingForm');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    showDashboard();
    hiringForm.addEventListener('submit', handleHireEmployee);
    firingForm.addEventListener('submit', handleFireEmployee);
    loadUserInfo();
    loadDepartmentStats();
    loadRecentActions();
});

// Navigation functions
function showDashboard() {
    hrDashboard.style.display = 'block';
    hirePage.style.display = 'none';
    firePage.style.display = 'none';
}

function showHirePage() {
    hrDashboard.style.display = 'none';
    hirePage.style.display = 'block';
    firePage.style.display = 'none';
}

function showFirePage() {
    hrDashboard.style.display = 'none';
    hirePage.style.display = 'none';
    firePage.style.display = 'block';
}

// Form handling with improved error handling
async function handleHireEmployee(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Disable button during processing
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        // Prepare form data
        const formData = {
            name: form.querySelector('#hire-name').value,
            phone: form.querySelector('#phone').value,
            email: form.querySelector('#email').value,
            city: form.querySelector('#city').value,
            address: form.querySelector('#address').value,
            role: form.querySelector('#role').value,
            branch: form.querySelector('#branch').value,
            dob: form.querySelector('#dob').value,
            gender: form.querySelector('#gender').value,
            salary: form.querySelector('#salary').value
        };
        
        // Convert branch to number
        formData.branch = parseInt(formData.branch);
        
        // Send request to server
        const response = await fetch('/hire_employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to hire employee');
        }
        
        if (data.success) {
            showSuccessPopup(formData, data);
            form.reset();
            loadDepartmentStats();
            loadRecentActions();
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Hiring error:', error);
        showErrorPopup(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Improved error display
function showErrorPopup(message) {
    const errorHTML = `
        <div class="error-popup">
            <h3>❌ Error Occurred</h3>
            <p>${message}</p>
            <button onclick="closeErrorPopup()">OK</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', errorHTML);
}

function closeErrorPopup() {
    const popup = document.querySelector('.error-popup');
    if (popup) popup.remove();
}

// Data loading with error handling
async function loadUserInfo() {
    try {
        const response = await fetch('/hr_dashboard');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load user info');
        }
        
        if (data.user_info) {
            document.getElementById('hrName').textContent = data.user_info.emp_name;
            document.getElementById('userName').textContent = data.user_info.emp_name;
            document.getElementById('userEmpId').textContent = data.user_info.emp_id;
            document.getElementById('userRole').textContent = data.user_info.dep_name;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Add similar error handling to other data loading functions
async function loadDepartmentStats() {
    try {
        const response = await fetch('/hr_dashboard');
        const data = await response.json();
        
        if (data.dept_stats) {
            const statsContent = document.getElementById('statsContent');
            statsContent.innerHTML = data.dept_stats.map(stat => `
                <div class="stat-item">
                    <span class="stat-name">${stat.dep_name}:</span>
                    <span class="stat-value">${stat.employee_count}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading department stats:', error);
        document.getElementById('statsContent').textContent = 'Failed to load statistics';
    }
}

async function loadRecentActions() {
    try {
        const response = await fetch('/hr_dashboard');
        const data = await response.json();
        
        if (data.recent_actions) {
            const actionsContent = document.getElementById('actionsContent');
            actionsContent.innerHTML = data.recent_actions.map(action => `
                <div class="action-item">
                    <span class="action-type ${action.action_type.toLowerCase()}">${action.action_type}</span>
                    <span class="action-emp">${action.emp_name}</span>
                    <span class="action-date">${new Date(action.action_date).toLocaleString()}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent actions:', error);
        document.getElementById('actionsContent').textContent = 'Failed to load recent actions';
    }
}

// Keep your existing popup functions and other utilities
// Success and Fire Popups (keep your existing implementations)

// Success Popup for Hiring
function showSuccessPopup(formData, result) {
    const successHTML = `
      <div class="success-popup">
        <h3>🎉 Employee Hired Successfully! 🎉</h3>
        <div class="employee-card">
          <div class="emp-name">${formData.emp_name}</div>
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

// Close Success Popup
function closeSuccessPopup() {
    const popup = document.querySelector('.success-popup');
    if (popup) popup.remove();
}

// Fire Popup for Terminating Employees
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

// Close Fire Popup
function closeFirePopup() {
    const popup = document.querySelector('.fire-popup');
    if (popup) popup.remove();
}

// Reset Form Fields
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}
