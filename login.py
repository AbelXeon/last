from flask import Flask, render_template,jsonify , request, redirect, url_for, session, flash
import mysql.connector
from mysql.connector import Error
import bcrypt
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Better secret key generation
app.config['SESSION_COOKIE_SECURE'] = False  # True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Helpful during development

# Simplified demo users with plain passwords for testing (remove in production)
DEMO_USERS = {
    "hr_demo": {
        "password": "hr123",
        "role": "hr"
    },
    "accountant_demo": {
        "password": "accountant123",
        "role": "accountant"
    },
    "manager_demo": {
        "password": "manager123",
        "role": "manager"
    }
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='abel tiruneh',
            password='Ab1996@2468',
            database='TIME_BANK',
            auth_plugin='mysql_native_password'  # Important for MySQL 8+
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/')
def home():
    return redirect(url_for('login'))
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle both form and JSON requests
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            is_ajax = True
        else:
            username = request.form.get('username')
            password = request.form.get('password')
            is_ajax = False
        
        # Check demo users
        if username in DEMO_USERS and password == DEMO_USERS[username]['password']:
            session['username'] = username
            session['role'] = DEMO_USERS[username]['role']
            
            if is_ajax:
                return jsonify({
                    'success': True,
                    'redirect': url_for(f"{DEMO_USERS[username]['role']}_dashboard")
                })
            else:
                flash('Login successful!', 'success')
                return redirect(url_for(f"{DEMO_USERS[username]['role']}_dashboard"))
        
        # Failed login
        if is_ajax:
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401
        else:
            flash('Invalid credentials', 'danger')
            return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/hr_dashboard')
def hr_dashboard():
    if 'username' not in session or session.get('role') != 'hr':
        flash('You are not authorized to access this page', 'danger')
        return redirect(url_for('login'))
    return render_template('HR_Dashboard.html', username=session['username'])

@app.route('/accountant_dashboard')
def accountant_dashboard():
    if 'username' not in session or session.get('role') != 'accountant':
        flash('You are not authorized to access this page', 'danger')
        return redirect(url_for('login'))
    return render_template('accountant_dashboard.html', username=session['username'])

@app.route('/manager_dashboard')
def manager_dashboard():
    if 'username' not in session or session.get('role') != 'manager':
        flash('You are not authorized to access this page', 'danger')
        return redirect(url_for('login'))
    return render_template('Manager.html', username=session['username'])

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
