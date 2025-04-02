from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import mysql.connector
from mysql.connector import Error
import bcrypt

app = Flask(__name__)
app.secret_key = 'your_very_secure_secret_key_here'  # Change this for production
app.config['SESSION_COOKIE_SECURE'] = False  # True in production
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='abel tiruneh',
            password='Ab1996@2468',
            database='Time_Internation_BANK'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Password hashing functions
def hash_password(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def check_password(hashed_password, user_password):
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        if isinstance(user_password, str):
            user_password = user_password.encode('utf-8')
        return bcrypt.checkpw(user_password, hashed_password)
    except Exception as e:
        print(f"Password check error: {e}")
        return False

@app.route('/')
def home():
    session.clear()
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database unavailable'}), 503

        try:
            with conn.cursor(dictionary=True) as cursor:
                # Get user with department info
                cursor.execute("""
                    SELECT e.*, d.dep_name 
                    FROM employee e
                    JOIN department d ON e.dep_id = d.dep_id
                    WHERE username = %s
                """, (username,))
                user = cursor.fetchone()

                if not user:
                    return jsonify({'error': 'Invalid credentials'}), 401

                print(f"Stored hash: {user['passwords']}")
                if not check_password(user['passwords'], password):
                    return jsonify({'error': 'Invalid credentials'}), 401

                # Set session data
                session.update({
                    'user_id': user['emp_id'],
                    'emp_id': user['emp_id'],
                    'username': user['username'],
                    'job_title': user['job_title'],
                    'name': user['emp_name'],
                    'department': user['dep_name'],
                    'logged_in': True
                })

                return jsonify({
                    'success': True,
                    'user': {
                        'id': user['emp_id'],
                        'name': user['emp_name'],
                        'role': user['job_title'],
                        'department': user['dep_name']
                    }
                })

        except Error as e:
            print(f"Database error: {str(e)}")
            return jsonify({'error': 'Database operation failed'}), 500
        finally:
            if conn and conn.is_connected():
                conn.close()

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Temporary development routes (REMOVE IN PRODUCTION)
@app.route('/dev-reset-password', methods=['POST'])
def dev_reset_password():
    """Reset password for development (REMOVE IN PRODUCTION)"""
    data = request.get_json()
    username = data.get('username')
    new_password = data.get('password')

    if not username or not new_password:
        return jsonify({'error': 'Username and password required'}), 400

    hashed = hash_password(new_password)
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE employee SET passwords = %s WHERE username = %s",
                (hashed, username)
            )
            conn.commit()
            return jsonify({
                'success': True,
                'message': 'Password updated',
                'username': username,
                'new_password': new_password  # Only for development!
            })
    except Error as e:
        print(f"Password reset error: {str(e)}")
        return jsonify({'error': 'Password reset failed'}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/dev-create-test-user', methods=['POST'])
def dev_create_test_user():
    """Create test user (REMOVE IN PRODUCTION)"""
    test_user = {
        'emp_id': 9999,
        'emp_name': 'Test HR',
        'gender': 'M',
        'dep_id': 107,  # HR department
        'job_title': 'HR Manager',
        'salary': 50000.00,
        'dbo': '1990-01-01',
        'phone': 1234567890,
        'city': 'Addis Ababa',
        'address': '22 Bole Road',
        'email': 'testhr@bank.com',
        'username': 'testhr',
        'password': 'testpassword'
    }
    
    hashed_pw = hash_password(test_user['password'])
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO employee (
                    emp_id, emp_name, gender, dep_id, job_title, salary,
                    dbo, phone, city, address, email, username, passwords
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, tuple(test_user.values()))
            
            conn.commit()
            return jsonify({
                'success': True,
                'message': 'Test user created',
                'credentials': {
                    'username': 'testhr',
                    'password': 'testpassword'
                }
            })
    except Error as e:
        conn.rollback()
        print(f"User creation error: {str(e)}")
        return jsonify({'error': 'User creation failed'}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# Dashboard routes (HR, Accountant, Manager) remain unchanged from your original code
# ...

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000, debug=True)