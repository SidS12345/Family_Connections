from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    profile_pic = db.Column(db.Text)  # Changed to Text to support large base64 images

    # New profile fields
    phone = db.Column(db.String(20))
    job = db.Column(db.String(100))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))

    # Privacy settings (True = private, False = public)
    phone_private = db.Column(db.Boolean, default=False)
    job_private = db.Column(db.Boolean, default=False)
    bio_private = db.Column(db.Boolean, default=False)
    location_private = db.Column(db.Boolean, default=False)

class Relationship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    relationship_type = db.Column(db.String(50), nullable=False)
    reverse_relationship_type = db.Column(db.String(50))  # What the receiver calls the sender
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'approved', 'declined'
    is_bidirectional = db.Column(db.Boolean, default=False)  # True when both sides are set

class RelationshipEditRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    relationship_id = db.Column(db.Integer, db.ForeignKey('relationship.id'), nullable=False)
    requesting_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    current_relationship_type = db.Column(db.String(50), nullable=False)
    new_relationship_type = db.Column(db.String(50), nullable=False)
    field_to_change = db.Column(db.String(50), nullable=False)  # 'relationship_type' or 'reverse_relationship_type'
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'approved', 'declined'

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    is_read = db.Column(db.Boolean, default=False)

