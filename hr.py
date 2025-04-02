from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
from flask_cors import CORS
import mysql.connector
import bcrypt
import random
import string
from datetime import datetime
import logging

app = Flask(__name__, static_folder='templates')
app.secret_key = 'your_secure_secret_key_here_12345!'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour session lifetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'abel tiruneh',
    'password': 'Ab1996@2468',
    'database': 'TIME_BANK',
    'auth_plugin': 'mysql_native_password'  # Add if using MySQL 8+
}

# Department mapping
DEPARTMENT_MAPPING = {
    'Accountant': 101,
    'Manager': 102,
    'Finance': 103,
    'Security': 104,
    'Cleaner': 105,
    'HR': 107
}

def get_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        logger.info("Database connection successful")
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def generate_employee_id():
    return random.randint(1000, 9999)

def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@app.route('/api/login', methods=['POST'])
def login():
    logger.info("Login attempt received")
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        logger.warning("Missing username or password")
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400

    db = get_db()
    if not db:
        logger.error("Database connection failed during login")
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.*, d.dep_name 
            FROM employee e
            JOIN department d ON e.dep_id = d.dep_id
            WHERE username = %s AND job_title IS NOT NULL
        """, (username,))
        user = cursor.fetchone()

        if not user:
            logger.warning(f"No active user found with username: {username}")
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

        logger.info(f"User found: {user['emp_name']}")
        logger.debug(f"Password comparison: {password} vs stored hash")

        # Verify password
        if bcrypt.checkpw(password.encode('utf-8'), user['passwords'].encode('utf-8')):
            logger.info("Password matches - login successful")
            
            # Store user info in session
            session.clear()
            session['user_id'] = user['emp_id']
            session['username'] = user['username']
            session['name'] = user['emp_name']
            session['emp_id'] = user['emp_id']
            session['job_title'] = user['job_title']
            session['department'] = user['dep_name']
            session.permanent = True
            
            logger.debug(f"Session data: {dict(session)}")
            
            return jsonify({
                'success': True,
                'user': {
                    'emp_id': user['emp_id'],
                    'name': user['emp_name'],
                    'job_title': user['job_title'],
                    'department': user['dep_name']
                }
            })
        else:
            logger.warning("Password does not match")
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Login failed'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    logger.info(f"Logout requested by user {session.get('username')}")
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/current-user')
def current_user():
    if 'user_id' not in session:
        logger.warning("Current user request without valid session")
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    logger.debug(f"Current user session: {dict(session)}")
    return jsonify({
        'success': True,
        'user': {
            'emp_id': session.get('emp_id'),
            'name': session.get('name'),
            'username': session.get('username'),
            'job_title': session.get('job_title'),
            'role': session.get('department')
        }
    })

@app.route('/api/department-stats')
def department_stats():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    db = get_db()
    if not db:
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT d.dep_name, COUNT(e.emp_id) as employee_count
            FROM department d
            LEFT JOIN employee e ON d.dep_id = e.dep_id AND e.job_title IS NOT NULL
            GROUP BY d.dep_name
            ORDER BY d.dep_name
        """)
        stats = cursor.fetchall()
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        logger.error(f"Department stats error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch department stats'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/recent-actions')
def recent_actions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    db = get_db()
    if not db:
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT ea.*, e.emp_name 
            FROM employee_actions ea
            JOIN employee e ON ea.emp_id = e.emp_id
            ORDER BY ea.action_date DESC
            LIMIT 10
        """)
        actions = cursor.fetchall()
        return jsonify({'success': True, 'actions': actions})
    except Exception as e:
        logger.error(f"Recent actions error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch recent actions'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/hire', methods=['POST'])
def hire_employee():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    data = request.get_json()
    required_fields = ['name', 'phone', 'email', 'city', 'address', 'role', 'branch_id', 'dob', 'gender', 'salary']
    if not all(field in data for field in required_fields):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    db = get_db()
    if not db:
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor()

        # Generate employee ID
        emp_id = generate_employee_id()
        
        # Generate username (firstname.lastname)
        first_name = data['name'].split()[0].lower()
        last_name = data['name'].split()[-1].lower() if len(data['name'].split()) > 1 else ''
        username = f"{first_name}.{last_name}" if last_name else first_name
        
        # Check if username exists and append number if needed
        temp_username = username
        counter = 1
        while True:
            cursor.execute("SELECT emp_id FROM employee WHERE username = %s", (temp_username,))
            if not cursor.fetchone():
                username = temp_username
                break
            temp_username = f"{username}{counter}"
            counter += 1

        # Generate temporary password
        temp_password = generate_password()
        hashed_password = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Get department ID
        dep_id = DEPARTMENT_MAPPING.get(data['role'])
        if not dep_id:
            return jsonify({'success': False, 'error': 'Invalid role'}), 400

        # Insert new employee
        cursor.execute("""
            INSERT INTO employee (
                emp_id, emp_name, gender, dep_id, branch_id, job_title, salary, dbo, 
                phone, city, address, email, username, passwords
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            emp_id, data['name'], data['gender'], dep_id, data['branch_id'], data['role'], 
            data['salary'], data['dob'], data['phone'], data['city'], data['address'], 
            data['email'], username, hashed_password
        ))

        # Record the hiring action
        cursor.execute("""
            INSERT INTO employee_actions (emp_id, action_type, details)
            VALUES (%s, 'Hire', %s)
        """, (emp_id, f"Hired as {data['role']} with salary {data['salary']}"))

        db.commit()

        logger.info(f"New employee hired: {emp_id} - {data['name']}")

        return jsonify({
            'success': True,
            'emp_id': emp_id,
            'username': username,
            'temp_password': temp_password
        })

    except Exception as e:
        db.rollback()
        logger.error(f"Hire employee error: {e}")
        return jsonify({'success': False, 'error': 'Failed to hire employee'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/fire', methods=['POST'])
def fire_employee():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    data = request.get_json()
    if not data.get('empId') or not data.get('name'):
        return jsonify({'success': False, 'error': 'Employee ID and name are required'}), 400

    db = get_db()
    if not db:
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor(dictionary=True)

        # Verify employee exists
        cursor.execute("SELECT * FROM employee WHERE emp_id = %s AND emp_name = %s AND job_title IS NOT NULL", 
                      (data['empId'], data['name']))
        employee = cursor.fetchone()
        
        if not employee:
            return jsonify({'success': False, 'error': 'Employee not found or already terminated'}), 404

        # Record the firing action before deleting
        cursor.execute("""
            INSERT INTO employee_actions (emp_id, action_type, details)
            VALUES (%s, 'Fire', 'Employee terminated')
        """, (data['empId'],))

        # Remove employee (set job_title to NULL as per your trigger)
        cursor.execute("""
            UPDATE employee 
            SET job_title = NULL 
            WHERE emp_id = %s
        """, (data['empId'],))

        db.commit()

        logger.info(f"Employee terminated: {data['empId']} - {data['name']}")

        return jsonify({'success': True})

    except Exception as e:
        db.rollback()
        logger.error(f"Fire employee error: {e}")
        return jsonify({'success': False, 'error': 'Failed to terminate employee'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/update-credentials', methods=['POST'])
def update_credentials():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    data = request.get_json()
    required_fields = ['currentUsername', 'newUsername', 'currentPassword', 'newPassword']
    if not all(field in data for field in required_fields):
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    db = get_db()
    if not db:
        return jsonify({'success': False, 'error': 'Database connection failed'}), 500

    try:
        cursor = db.cursor(dictionary=True)

        # Verify current credentials
        cursor.execute("""
            SELECT passwords FROM employee 
            WHERE emp_id = %s AND username = %s
        """, (session['user_id'], data['currentUsername']))
        user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'error': 'Current username is incorrect'}), 401

        if not bcrypt.checkpw(data['currentPassword'].encode('utf-8'), user['passwords'].encode('utf-8')):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401

        # Check if new username is already taken
        if data['newUsername'] != data['currentUsername']:
            cursor.execute("SELECT emp_id FROM employee WHERE username = %s", (data['newUsername'],))
            if cursor.fetchone():
                return jsonify({'success': False, 'error': 'New username is already taken'}), 400

        # Hash new password
        hashed_password = bcrypt.hashpw(data['newPassword'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update credentials
        cursor.execute("""
            UPDATE employee 
            SET username = %s, passwords = %s 
            WHERE emp_id = %s
        """, (data['newUsername'], hashed_password, session['user_id']))

        db.commit()

        # Update session
        session['username'] = data['newUsername']

        logger.info(f"Credentials updated for user: {session['user_id']}")

        return jsonify({'success': True})

    except Exception as e:
        db.rollback()
        logger.error(f"Update credentials error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update credentials'}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/')
def home():
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    return send_from_directory('templates', 'login.html')

@app.route('/hr-dashboard')
def hr_dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return send_from_directory('templates', 'HR-Dashboard.html')

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)