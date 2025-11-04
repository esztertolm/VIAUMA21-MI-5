#módosítsátok nyugodtan
from flask import Flask
#from flask_cors import CORS
from dotenv import load_dotenv
import os

# betöltjük a .env-et
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET")

    # Engedélyezzük a frontendet (pl. React: http://localhost:3000)
    #CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    # Route-ok importja itt, hogy a Flask app már létezzen (elvileg bevált Flask pattern?)
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    return app

if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # HTTP engedélyezése fejlesztéshez
    app = create_app()
    app.run("localhost", 8080, debug=True)
