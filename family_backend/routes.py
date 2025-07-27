from flask import Blueprint, request, jsonify
from models import db, Relationship, User

def build_tree(user_id, visited=None):
    if visited is None:
        visited = set()

    if user_id in visited:
        return None  # Prevent circular references / infinite loops

    visited.add(user_id)

    user = User.query.get(user_id)
    if not user:
        return None

    relationships = Relationship.query.filter_by(from_user_id=user_id).all()

    relatives = []
    for rel in relationships:
        child_tree = build_tree(rel.to_user_id, visited)
        if child_tree:
            relatives.append({
                "id": child_tree["id"],
                "name": child_tree["name"],
                "relationship": rel.relationship_type,
                "relations": child_tree["relations"]
            })

    return {
        "id": user.id,
        "name": user.name,
        "relations": relatives
    }

main_bp = Blueprint('main', __name__)

@main_bp.route('/users', methods=["GET"])
def get_all_users():
    users = User.query.all()
    print({
    "id": users[0].id,
    "name": users[0].name,
    "email": users[0].email
    })

    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email
    } for u in users])


@main_bp.route('/connect', methods=['POST'])
def connect():
    data = request.json

    # Expecting a JSON body like:
    # {
    #   "from_user_id": 1,
    #   "to_user_id": 2,
    #   "relationship_type": "father"
    # }

    new_relationship = Relationship(
        from_user_id=data['from_user_id'],
        to_user_id=data['to_user_id'],
        relationship_type=data['relationship_type'],
        status='pending'  # New requests are pending
    )

    db.session.add(new_relationship)
    db.session.commit()

    return jsonify({"message": "Connection request sent!"})

@main_bp.route('/update_relationship/<int:relationship_id>', methods=["POST"])
def update_relationship(relationship_id):
    rel = Relationship.query.get(relationship_id)
    if not rel:
        return jsonify({"error": "Relationship not found"}), 404

    data = request.json
    if "relationship_type" in data:
        rel.relationship_type = data["relationship_type"]
        db.session.commit()
        return jsonify({"message": "Relationship updated"})
    return jsonify({"error": "No valid fields to update"}), 400

@main_bp.route('/delete_relationship/<int:relationship_id>', methods=["DELETE"])
def delete_relationship(relationship_id):
    rel = Relationship.query.get(relationship_id)
    if not rel:
        return jsonify({"error": "Relationship not found"}), 404

    db.session.delete(rel)
    db.session.commit()
    return jsonify({"message": "Relationship deleted"})

@main_bp.route('/update_profile/<int:user_id>', methods=["POST"])
def update_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json

    if "name" in data:
        user.name = data["name"]

    if "profile_pic" in data:
        user.profile_pic = data["profile_pic"]

    db.session.commit()
    return jsonify({"message": "Profile updated successfully."})

@main_bp.route('/relationships/<int:user_id>', methods=["GET"])
def get_relationships(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Only show approved relationships where the user is either the sender or recipient
    relationships = Relationship.query.filter(
        ((Relationship.from_user_id == user_id) | (Relationship.to_user_id == user_id)) &
        (Relationship.status == 'approved')
    ).all()

    results = []
    for rel in relationships:
        if rel.from_user_id == user_id:
            other_user = User.query.get(rel.to_user_id)
            direction = 'to'
        else:
            other_user = User.query.get(rel.from_user_id)
            direction = 'from'
        if other_user:
            results.append({
                "relative_id": other_user.id,
                "name": other_user.name,
                "relationship": rel.relationship_type,
                "direction": direction
            })
    return jsonify(results)

@main_bp.route('/tree/<int:user_id>', methods=["GET"])
def get_family_tree(user_id):
    tree = build_tree(user_id)
    if tree:
        return jsonify(tree)
    return jsonify({"error": "User not found"}), 404

@main_bp.route('/delete_user/<int:user_id>', methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Delete any relationships this user is involved in
    Relationship.query.filter(
        (Relationship.from_user_id == user_id) |
        (Relationship.to_user_id == user_id)
    ).delete(synchronize_session=False)

    # Delete the user
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": f"User with ID {user_id} deleted."})

@main_bp.route('/relationship_requests/<int:user_id>', methods=["GET"])
def get_relationship_requests(user_id):
    # Requests where the user is the recipient and status is pending
    requests = Relationship.query.filter_by(to_user_id=user_id, status='pending').all()
    results = []
    for rel in requests:
        from_user = User.query.get(rel.from_user_id)
        if from_user:
            results.append({
                "request_id": rel.id,
                "from_user_id": from_user.id,
                "from_name": from_user.name,
                "relationship": rel.relationship_type
            })
    return jsonify(results)

@main_bp.route('/respond_relationship/<int:request_id>', methods=["POST"])
def respond_relationship(request_id):
    rel = Relationship.query.get(request_id)
    if not rel:
        return jsonify({"error": "Request not found"}), 404
    data = request.json
    if "status" in data and data["status"] in ["approved", "declined"]:
        rel.status = data["status"]
        db.session.commit()
        return jsonify({"message": f"Request {data['status']}"})
    return jsonify({"error": "Invalid status"}), 400

@main_bp.route('/connect_requests_sent/<int:user_id>', methods=["GET"])
def get_sent_connect_requests(user_id):
    # Pending requests sent by this user
    requests = Relationship.query.filter_by(from_user_id=user_id, status='pending').all()
    results = []
    for rel in requests:
        to_user = User.query.get(rel.to_user_id)
        if to_user:
            results.append({
                "request_id": rel.id,
                "to_user_id": to_user.id,
                "to_name": to_user.name,
                "relationship": rel.relationship_type
            })
    return jsonify(results)
