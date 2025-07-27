from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
from models import db 
from auth import auth_bp
from routes import main_bp

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)

app.register_blueprint(auth_bp, url_prefix = "/auth")
app.register_blueprint(main_bp)

@app.route("/")
def home():
    return "Backend is working!"

if __name__ == "__main__":
    app.run(debug=True)
