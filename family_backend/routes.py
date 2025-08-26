from flask import Blueprint, request, jsonify
from models import db, Relationship, User, RelationshipEditRequest, Message
from sqlalchemy import or_, and_

def get_reverse_relationship(original_relationship, sender_gender, receiver_gender):
    """
    Determine the reverse relationship based on the original relationship and genders.
    Returns the suggested relationship from receiver to sender.
    
    Example: If sender says receiver is their "Son", 
    then receiver should call sender their "Father" or "Mother" (based on sender's gender)
    """
    relationship = original_relationship.lower()
    
    # Family relationships mapping
    if relationship == 'father':
        # If they say you're their father, you call them son/daughter (based on THEIR gender)
        return 'Daughter' if sender_gender == 'female' else 'Son'
    elif relationship == 'mother':
        # If they say you're their mother, you call them son/daughter (based on THEIR gender)
        return 'Daughter' if sender_gender == 'female' else 'Son'
    elif relationship == 'son':
        # If they say you're their son, you call them father/mother (based on THEIR gender)
        return 'Mother' if sender_gender == 'female' else 'Father'
    elif relationship == 'daughter':
        # If they say you're their daughter, you call them father/mother (based on THEIR gender)
        return 'Mother' if sender_gender == 'female' else 'Father'
    elif relationship == 'brother':
        # If they say you're their brother, you call them brother/sister (based on THEIR gender)
        return 'Sister' if sender_gender == 'female' else 'Brother'
    elif relationship == 'sister':
        # If they say you're their sister, you call them brother/sister (based on THEIR gender)
        return 'Sister' if sender_gender == 'female' else 'Brother'
    
    # For custom relationships, we can't determine the reverse automatically
    return None

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

    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        # The following fields are available but commented out for now:
        # "profile_pic": u.profile_pic,
        # "phone": u.phone,
        # "job": u.job,
        # "bio": u.bio,
        # "location": u.location,
        # "phone_private": u.phone_private,
        # "job_private": u.job_private,
        # "bio_private": u.bio_private,
        # "location_private": u.location_private
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
    print(f"Updating profile for user {user_id}")
    print(f"Request data keys: {list(data.keys()) if data else 'No data'}")

    # Update basic profile fields
    if "name" in data:
        user.name = data["name"]
    if "profile_pic" in data:
        user.profile_pic = data["profile_pic"]

    # Update new profile fields
    if "phone" in data:
        user.phone = data["phone"]
    if "job" in data:
        user.job = data["job"]
    if "bio" in data:
        user.bio = data["bio"]
    if "location" in data:
        user.location = data["location"]

    # Update privacy settings
    if "phone_private" in data:
        user.phone_private = data["phone_private"]
    if "job_private" in data:
        user.job_private = data["job_private"]
    if "bio_private" in data:
        user.bio_private = data["bio_private"]
    if "location_private" in data:
        user.location_private = data["location_private"]

    try:
        db.session.commit()
        print("Database commit successful")
        return jsonify({"message": "Profile updated successfully."})
    except Exception as e:
        print(f"Database commit failed: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@main_bp.route('/relationships/<int:user_id>', methods=["GET"])
def get_relationships(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get all approved bidirectional relationships where the user is involved
    relationships = Relationship.query.filter(
        ((Relationship.from_user_id == user_id) | (Relationship.to_user_id == user_id)) &
        (Relationship.status == 'approved') &
        (Relationship.is_bidirectional == True)
    ).all()

    results = []
    for rel in relationships:
        if rel.from_user_id == user_id:
            # User is the sender
            other_user = User.query.get(rel.to_user_id)
            my_relationship_type = rel.relationship_type
            their_relationship_type = rel.reverse_relationship_type
        else:
            # User is the receiver
            other_user = User.query.get(rel.from_user_id)
            my_relationship_type = rel.reverse_relationship_type
            their_relationship_type = rel.relationship_type

        if other_user:
            results.append({
                "relationship_id": rel.id,
                "relative_id": other_user.id,
                "name": other_user.name,
                "profile_pic": other_user.profile_pic,
                "my_relationship_type": my_relationship_type,
                "their_relationship_type": their_relationship_type,
                "can_edit": True
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
    # Pending requests TO this user
    requests = Relationship.query.filter_by(to_user_id=user_id, status='pending').all()
    results = []
    for rel in requests:
        from_user = User.query.get(rel.from_user_id)
        if from_user:
            results.append({
                "request_id": rel.id,
                "from_user_id": from_user.id,
                "from_name": from_user.name,
                "from_profile_pic": from_user.profile_pic,
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
        if data["status"] == "approved":
            # For approval, we need the reverse relationship type
            if "reverse_relationship_type" not in data or not data["reverse_relationship_type"]:
                return jsonify({"error": "Reverse relationship type is required for approval"}), 400

            rel.status = "approved"
            rel.reverse_relationship_type = data["reverse_relationship_type"]
            rel.is_bidirectional = True
        else:
            # If declined, we can just mark it as declined
            rel.status = "declined"

        db.session.commit()
        return jsonify({"message": f"Request {data['status']}"})

    return jsonify({"error": "Invalid status or missing data"}), 400

@main_bp.route('/edit_relationship/<int:relationship_id>', methods=["POST"])
def edit_relationship(relationship_id):
    """Edit a relationship type instantly and notify the other user."""
    rel = Relationship.query.get(relationship_id)
    if not rel:
        return jsonify({"error": "Relationship not found"}), 404

    data = request.json
    if "new_relationship_type" not in data or "requesting_user_id" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    requesting_user_id = data["requesting_user_id"]
    new_relationship_type = data["new_relationship_type"]

    # Determine which user is making the change and apply it directly
    if requesting_user_id == rel.from_user_id:
        rel.relationship_type = new_relationship_type
    elif requesting_user_id == rel.to_user_id:
        rel.reverse_relationship_type = new_relationship_type
    else:
        return jsonify({"error": "User not part of this relationship"}), 403

    # Here you could add a notification system to inform the other user of the change.
    # For now, we will just commit the change directly.

    db.session.commit()

    return jsonify({"message": "Relationship updated successfully!"})

@main_bp.route('/relationship_edit_requests/<int:user_id>', methods=["GET"])
def get_relationship_edit_requests(user_id):
    """Get pending relationship edit requests for a user"""
    requests = RelationshipEditRequest.query.filter_by(
        target_user_id=user_id,
        status='pending'
    ).all()

    results = []
    for req in requests:
        requesting_user = User.query.get(req.requesting_user_id)
        if requesting_user:
            results.append({
                "request_id": req.id,
                "requesting_user_id": req.requesting_user_id,
                "requesting_user_name": requesting_user.name,
                "current_relationship_type": req.current_relationship_type,
                "new_relationship_type": req.new_relationship_type,
                "relationship_id": req.relationship_id
            })

    return jsonify(results)

@main_bp.route('/respond_edit_request/<int:request_id>', methods=["POST"])
def respond_edit_request(request_id):
    """Respond to a relationship edit request"""
    edit_req = RelationshipEditRequest.query.get(request_id)
    if not edit_req:
        return jsonify({"error": "Edit request not found"}), 404

    data = request.json
    if "status" not in data or data["status"] not in ["approved", "declined"]:
        return jsonify({"error": "Invalid status"}), 400

    if data["status"] == "approved":
        # Apply the relationship change
        rel = Relationship.query.get(edit_req.relationship_id)
        if rel:
            if edit_req.field_to_change == "relationship_type":
                rel.relationship_type = edit_req.new_relationship_type
            else:
                rel.reverse_relationship_type = edit_req.new_relationship_type
            db.session.commit()

    # Mark the edit request as processed
    edit_req.status = data["status"]
    db.session.commit()

    return jsonify({"message": f"Edit request {data['status']}"})

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

@main_bp.route('/profile/<int:user_id>', methods=["GET"])
def get_user_profile(user_id):
    """Get a user's profile, respecting privacy settings"""
    try:
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404

        # Get the requesting user's ID from query parameter
        requesting_user_id = request.args.get('requesting_user_id', type=int)
        if requesting_user_id is None:
            return jsonify({"error": "Missing or invalid requesting_user_id"}), 400

        # Check if users are connected (if not the same user)
        is_connected = False
        is_own_profile = requesting_user_id == user_id

        if requesting_user_id and not is_own_profile:
            # Check if there's an approved relationship between the users (bidirectional only)
            relationship = Relationship.query.filter(
                (((Relationship.from_user_id == requesting_user_id) & (Relationship.to_user_id == user_id)) |
                 ((Relationship.from_user_id == user_id) & (Relationship.to_user_id == requesting_user_id))) &
                (Relationship.status == 'approved') &
                (Relationship.is_bidirectional == True)
            ).first()
            is_connected = relationship is not None

        # Build response based on privacy settings and connection status
        profile_data = {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email if (is_own_profile or is_connected) else None,
            "profile_pic": target_user.profile_pic
        }

        # Add fields based on privacy settings
        if is_own_profile:
            # Own profile - show everything including privacy settings
            profile_data.update({
                "phone": target_user.phone,
                "job": target_user.job,
                "bio": target_user.bio,
                "location": target_user.location,
                "phone_private": target_user.phone_private,
                "job_private": target_user.job_private,
                "bio_private": target_user.bio_private,
                "location_private": target_user.location_private,
                "is_own_profile": True,
                "is_connected": True
            })
        else:
            # Other user's profile - show all fields to connections, respect privacy for non-connections
            profile_data.update({
                "phone": target_user.phone if is_connected or not target_user.phone_private else None,
                "job": target_user.job if is_connected or not target_user.job_private else None,
                "bio": target_user.bio if is_connected or not target_user.bio_private else None,
                "location": target_user.location if is_connected or not target_user.location_private else None,
                "phone_private": target_user.phone_private,
                "job_private": target_user.job_private,
                "bio_private": target_user.bio_private,
                "location_private": target_user.location_private,
                "is_own_profile": False,
                "is_connected": is_connected
            })

        return jsonify(profile_data)
    except Exception as e:
        import traceback
        print(f"Error in get_user_profile: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# Messaging Routes
@main_bp.route('/send_message', methods=["POST"])
def send_message():
    """Send a message to another user"""
    data = request.json
    if not all(key in data for key in ['sender_id', 'recipient_id', 'content']):
        return jsonify({"error": "Missing required fields"}), 400

    sender_id = data['sender_id']
    recipient_id = data['recipient_id']
    content = data['content'].strip()

    if not content:
        return jsonify({"error": "Message content cannot be empty"}), 400

    # Check if users are connected
    relationship = Relationship.query.filter(
        (((Relationship.from_user_id == sender_id) & (Relationship.to_user_id == recipient_id)) |
         ((Relationship.from_user_id == recipient_id) & (Relationship.to_user_id == sender_id))) &
        (Relationship.status == 'approved') &
        (Relationship.is_bidirectional == True)
    ).first()

    if not relationship:
        return jsonify({"error": "You can only message people you're connected with"}), 403

    # Create the message
    message = Message(
        sender_id=sender_id,
        recipient_id=recipient_id,
        content=content
    )
    
    db.session.add(message)
    db.session.commit()

    return jsonify({"message": "Message sent successfully!"})

@main_bp.route('/conversations/<int:user_id>', methods=["GET"])
def get_conversations(user_id):
    """Get all conversations for a user"""
    # Get all messages where user is sender or recipient
    messages = Message.query.filter(
        or_(Message.sender_id == user_id, Message.recipient_id == user_id)
    ).order_by(Message.timestamp.desc()).all()

    # Group by conversation partner
    conversations = {}
    for message in messages:
        other_user_id = message.recipient_id if message.sender_id == user_id else message.sender_id
        
        if other_user_id not in conversations:
            other_user = User.query.get(other_user_id)
            conversations[other_user_id] = {
                "user_id": other_user_id,
                "user_name": other_user.name,
                "profile_pic": other_user.profile_pic,
                "last_message": message.content,
                "last_message_time": message.timestamp.isoformat(),
                "is_last_message_from_me": message.sender_id == user_id,
                "unread_count": 0
            }

    # Count unread messages for each conversation
    for conv_user_id in conversations:
        unread_count = Message.query.filter(
            and_(
                Message.sender_id == conv_user_id,
                Message.recipient_id == user_id,
                Message.is_read == False
            )
        ).count()
        conversations[conv_user_id]["unread_count"] = unread_count

    return jsonify(list(conversations.values()))

@main_bp.route('/messages/<int:user_id>/<int:other_user_id>', methods=["GET"])
def get_messages(user_id, other_user_id):
    """Get all messages between two users"""
    # Mark messages from other user as read
    Message.query.filter(
        and_(
            Message.sender_id == other_user_id,
            Message.recipient_id == user_id,
            Message.is_read == False
        )
    ).update({Message.is_read: True})
    db.session.commit()

    # Get all messages between the two users
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user_id, Message.recipient_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.recipient_id == user_id)
        )
    ).order_by(Message.timestamp.asc()).all()

    # Get the other user's info
    other_user = User.query.get(other_user_id)
    if not other_user:
        return jsonify({"error": "User not found"}), 404

    message_list = []
    for message in messages:
        message_list.append({
            "id": message.id,
            "sender_id": message.sender_id,
            "recipient_id": message.recipient_id,
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "is_read": message.is_read,
            "is_from_me": message.sender_id == user_id
        })

    return jsonify({
        "other_user": {
            "id": other_user.id,
            "name": other_user.name,
            "profile_pic": other_user.profile_pic
        },
        "messages": message_list
    })

@main_bp.route('/unread_message_count/<int:user_id>', methods=["GET"])
def get_unread_message_count(user_id):
    """Get total unread message count for a user"""
    count = Message.query.filter(
        and_(
            Message.recipient_id == user_id,
            Message.is_read == False
        )
    ).count()
    
    return jsonify({"unread_count": count})
