from flask import Blueprint, request, jsonify
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        name=data['name'], 
        email=data['email'], 
        password=hashed_password,
        gender=data.get('gender'),
        profile_pic=data.get('profile_pic')
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'})
    except Exception as e:
        return jsonify({'error': 'User with this email already exists'}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user and check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Login successful!"})
    return jsonify({"error": "Invalid credentials"}), 401
