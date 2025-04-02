from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import mysql.connector
from mysql.connector import Error
import bcrypt
import random
import string

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Development mode - set to False in production
DEVELOPMENT_MODE = True

def get_db_connection():
    try:
        return mysql.connector.connect(
            host='localhost',
            user='abel tiruneh',
            password='Ab1996@2468',
            database='TIME_BANK'
        )
    except Error as e:
        print(f"Database error: {e}")
        return None

def setup_hr_session():
    """Set up a mock HR session for development"""
    session['user_id'] = 1000  # Your HR employee ID
    session['username'] = 'adminhr'
    session['role'] = 'hr'
    session['branch_id'] = 1

@app.route('/')
def home():
    if DEVELOPMENT_MODE:
        setup_hr_session()
        return redirect(url_for('HR_Dashboard'))
    return redirect(url_for('login'))

@app.route('/hr/dashboard')
def hr_dashboard():
    if DEVELOPMENT_MODE or ('username' in session and session.get('role') == 'hr'):
        connection = get_db_connection()
        if connection:
            try:
                cursor = connection.cursor(dictionary=True)
                
                # Get HR user details
                cursor.execute("""
                    SELECT e.*, d.dep_name, b.branch_name 
                    FROM employee e
                    JOIN department d ON e.dep_id = d.dep_id
                    JOIN branch b ON e.branch_id = b.branch_id
                    WHERE e.emp_id = %s
                """, (session['user_id'],))
                user_info = cursor.fetchone()
                
                # Get department statistics
                cursor.execute("""
                    SELECT d.dep_name, COUNT(e.emp_id) as employee_count
                    FROM department d
                    LEFT JOIN employee e ON d.dep_id = e.dep_id
                    GROUP BY d.dep_name
                """)
                dept_stats = cursor.fetchall()
                
                return render_template('hr_dashboard.html', 
                                    user_info=user_info,
                                    dept_stats=dept_stats)
            
            except Error as e:
                print(f"Database error: {e}")
                flash('Error loading dashboard data', 'danger')
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
        else:
            flash('Database connection failed', 'danger')
        return render_template('hr_dashboard.html')
    
    flash('You must be HR to access this page', 'danger')
    return redirect(url_for('login'))
@app.route('/hr/hire', methods=['POST'])
def hire_employee():
    if not (DEVELOPMENT_MODE or ('username' in session and session.get('role') == 'hr')):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data received'}), 400

        print("Received hiring data:", data)  # Debugging

        # Validate required fields
        required_fields = ['name', 'gender', 'dep_id', 'branch_id', 'job_title', 
                          'salary', 'dob', 'phone', 'city', 'address', 'email']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing fields: {", ".join(missing_fields)}'
            }), 400

        # Generate credentials
        first_name = data['name'].split()[0].lower()
        username = f"{first_name}{random.randint(100, 999)}"
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        hashed_password = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())

        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500

        try:
            cursor = connection.cursor()

            # Check if department exists
            cursor.execute("SELECT dep_name FROM department WHERE dep_id = %s", (data['dep_id'],))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'error': f'Department ID {data["dep_id"]} does not exist'
                }), 400

            # Insert employee
            cursor.execute("""
                INSERT INTO employee (
                    emp_name, gender, dep_id, branch_id, job_title, salary,
                    dbo, phone, city, address, email, username, passwords
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['name'], data['gender'], data['dep_id'], data['branch_id'],
                data['job_title'], data['salary'], data['dob'], data['phone'],
                data['city'], data['address'], data['email'], username, hashed_password
            ))

            emp_id = cursor.lastrowid
            connection.commit()

            # Log the hiring action
            cursor.execute("""
                INSERT INTO employee_actions (emp_id, action_type, details)
                VALUES (%s, 'Hire', %s)
            """, (emp_id, f"Hired as {data['job_title']}"))

            connection.commit()

            return jsonify({
                'success': True,
                'emp_id': emp_id,
                'username': username,
                'temp_password': temp_password,
                'message': 'Employee hired successfully'
            })

        except Error as e:
            connection.rollback()
            error_msg = f"Database error: {str(e)}"
            print(error_msg)  # Debugging
            return jsonify({'success': False, 'error': error_msg}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg)  # Debugging
        return jsonify({'success': False, 'error': error_msg}), 500
# ... (keep your other routes the same)

if __name__ == '__main__':
    app.run(debug=True)
