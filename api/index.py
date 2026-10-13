import sys
import os

# Add root directory to sys.path so backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

# Vercel looks for the WSGI/ASGI 'app' object
