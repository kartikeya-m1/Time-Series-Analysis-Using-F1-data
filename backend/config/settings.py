"""
Backend configuration settings
"""
import os

class Config:
    # Flask settings
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # CORS settings
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001"]
    
    # Fast-F1 settings
    CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'cache')
    
    # API settings
    API_VERSION = "v1"
    API_PREFIX = f"/api/{API_VERSION}"
    
    # Default F1 settings
    DEFAULT_SEASON = 2024
    DEFAULT_EVENT = "Monaco Grand Prix"
    DEFAULT_SESSION = "Q"
