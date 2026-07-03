import os
from flask import Flask
from config import Config
from database import db
from routes import web_bp, api_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Custom template filters for parsing JSON inside templates
    @app.template_filter('from_json')
    def from_json_filter(value):
        try:
            import json
            return json.loads(value)
        except Exception:
            return {}

    # Initialize Database Tables
    with app.app_context():
        try:
            db.create_all()
            print("Database tables initialized successfully.")
        except Exception as e:
            print(f"Error initializing database: {str(e)}")

    return app

app = create_app()

if __name__ == '__main__':
    # Determine port and host for local vs production environments
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
