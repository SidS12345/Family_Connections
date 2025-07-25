from flask import Blueprint, request, jsonify
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    new_user = User(
        name=data["name"],
        email=data["email"],
        password=data["password"]  # plaintext for now
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user and user.password == data["password"]:
        return jsonify({"message": "Login successful!"})
    return jsonify({"error": "Invalid credentials"}), 401
