"""
CampScout API Backend using camply library
"""
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime, date, timedelta
import logging
import jwt
import bcrypt
import secrets
import uuid
import sqlite3
import os
from contextlib import contextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==============================================================================
# TEMPORARY DEBUGGING - ADD THESE LINES
# ==============================================================================
print("--- APPLICATION SCRIPT IS STARTING TO EXECUTE ---") 
logging.basicConfig(level=logging.INFO) # Temporarily force INFO level logging
logger = logging.getLogger(__name__)

# This will print the raw value from the environment, or None if it's not found
raw_cors_env = os.getenv("CORS_ORIGINS")
print(f"--- RAW VALUE FROM os.getenv('CORS_ORIGINS'): {raw_cors_env} ---")
# ==============================================================================


# Import camply for real campsite data
from camply import RecreationDotGov, SearchRecreationDotGov, SearchWindow

class RecAreaSearchRequest(BaseModel):
    search_string: str
    state: Optional[str] = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CampScout API",
    description="API for campsite availability monitoring using camply library",
    version="1.0.0"
)

# Configuration from environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-here-change-this-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_HOURS", "24"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30"))
DATABASE_PATH = os.getenv("DATABASE_PATH", "campscout.db")

# CORS Configuration with better error handling
try:
    # Hardcode CORS origins as a list for testing
    CORS_ORIGINS = ["https://campscout-demo.surge.sh"]
    
    # Log environment and CORS configuration
    logger.warning(f"Environment: {ENVIRONMENT}")
    logger.warning(f"CORS allowed origins configured as: {CORS_ORIGINS}") 
    
    # In production, warn if still using localhost
    if ENVIRONMENT == "production" and any("localhost" in origin for origin in CORS_ORIGINS):
        logger.error("WARNING: Production environment detected but CORS origins still contain localhost!")
        
except Exception as e:
    # Log any error that happens during the CORS setup
    logger.error(f"ERROR setting up CORS: {e}")
    CORS_ORIGINS = ["http://localhost:5173"]  # Fallback

logger.info(f"Final CORS allowed origins: {CORS_ORIGINS}")

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def init_database():
    """Initialize SQLite database with required tables"""
    with sqlite3.connect(DATABASE_PATH) as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                campground_name TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                site_type TEXT DEFAULT 'any',
                party_size INTEGER DEFAULT 1,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        conn.commit()
        logger.info("Database initialized successfully")

@contextmanager
def get_db_connection():
    """Get database connection with context manager"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    try:
        yield conn
    finally:
        conn.close()

# Initialize database on startup
init_database()

# Pydantic models
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    created_at: datetime

class CampsiteSearchRequest(BaseModel):
    location: Optional[str] = ""
    activity: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    nights: Optional[int] = 1
    weekend_only: Optional[bool] = False
    limit: Optional[int] = 20
    rec_area_id: Optional[List[str]] = []

class AvailabilityRequest(BaseModel):
    start_date: str
    end_date: str
    nights: int = 1

class CampsiteInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    state: Optional[str] = ""
    city: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    activities: Optional[List[str]] = []
    phone: Optional[str] = ""
    email: Optional[str] = ""
    reservation_url: Optional[str] = ""
    recreation_gov_id: Optional[str] = ""

class AlertCreate(BaseModel):
    start_date: str
    end_date: str
    site_type: Optional[str] = "any"
    party_size: Optional[int] = 1

class Alert(BaseModel):
    id: str
    campground_name: str
    start_date: str
    end_date: str
    site_type: str
    party_size: int
    is_active: bool
    notification_sent: bool
    created_at: datetime
    updated_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Query user from database
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, first_name, last_name, email, created_at 
                FROM users WHERE id = ?
            """, (user_id,))
            user_row = cursor.fetchone()
            
            if user_row is None:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Convert to dict for easier access
            user = {
                "id": user_row["id"],
                "first_name": user_row["first_name"],
                "last_name": user_row["last_name"],
                "email": user_row["email"],
                "created_at": user_row["created_at"]
            }
            return user
            
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Health endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "CampScout API is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "campscout-api"
    }

# Authentication endpoints
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Create new user
            user_id = str(uuid.uuid4())
            hashed_password = hash_password(user_data.password)
            
            # Insert user into database
            cursor.execute("""
                INSERT INTO users (id, first_name, last_name, email, password, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                user_data.first_name,
                user_data.last_name,
                user_data.email,
                hashed_password,
                datetime.utcnow().isoformat()
            ))
            
            conn.commit()
            
            # Create tokens
            access_token = create_access_token(data={"sub": user_id})
            refresh_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
            
            # Return user data without password
            user_response = User(
                id=user_id,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                email=user_data.email,
                created_at=datetime.utcnow()
            )
            
            logger.info(f"User registered successfully: {user_data.email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_response
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    """Login user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Find user by email
            cursor.execute("""
                SELECT id, first_name, last_name, email, password, created_at 
                FROM users WHERE email = ?
            """, (login_data.email,))
            
            user_row = cursor.fetchone()
            
            if not user_row or not verify_password(login_data.password, user_row["password"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Create tokens
            access_token = create_access_token(data={"sub": user_row["id"]})
            refresh_token = create_access_token(data={"sub": user_row["id"]}, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
            
            # Return user data without password
            user_response = User(
                id=user_row["id"],
                first_name=user_row["first_name"],
                last_name=user_row["last_name"],
                email=user_row["email"],
                created_at=datetime.fromisoformat(user_row["created_at"])
            )
            
            logger.info(f"User logged in successfully: {login_data.email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_response
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/api/auth/google")
async def google_auth(google_token: dict):
    """Authenticate user with Google OAuth token"""
    try:
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        # Import Google auth libraries
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
        
        # Verify the Google token
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                google_token.get('credential'), 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Extract user information
            google_user_id = idinfo['sub']
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                # User exists, log them in
                user_id = existing_user["id"]
                user_data = {
                    "id": user_id,
                    "first_name": existing_user["first_name"],
                    "last_name": existing_user["last_name"],
                    "email": existing_user["email"],
                    "created_at": existing_user["created_at"]
                }
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO users (id, first_name, last_name, email, password, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    first_name,
                    last_name,
                    email,
                    hash_password(f"google_oauth_{google_user_id}"),  # Dummy password for OAuth users
                    datetime.utcnow().isoformat()
                ))
                conn.commit()
                
                user_data = {
                    "id": user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "created_at": datetime.utcnow().isoformat()
                }
            
            # Create tokens
            access_token = create_access_token(data={"sub": user_id})
            refresh_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
            
            # Return user data with tokens
            user_response = User(
                id=user_data["id"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                created_at=datetime.fromisoformat(user_data["created_at"]) if isinstance(user_data["created_at"], str) else user_data["created_at"]
            )
            
            logger.info(f"Google OAuth successful for user: {email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_response
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Google authentication failed")

# Public dashboard endpoint (no authentication required)
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get public dashboard statistics"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get total users count
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()["count"]
            
            # Get total alerts count
            cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE is_active = 1")
            total_alerts = cursor.fetchone()["count"]
            
            # Get recent registrations (last 7 days)
            cursor.execute("""
                SELECT COUNT(*) as count FROM users 
                WHERE created_at >= datetime('now', '-7 days')
            """)
            recent_users = cursor.fetchone()["count"]
            
            return {
                "success": True,
                "data": {
                    "total_users": total_users,
                    "total_active_alerts": total_alerts,
                    "recent_registrations": recent_users,
                    "service_status": "operational",
                    "last_updated": datetime.utcnow().isoformat()
                }
            }
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return {
            "success": True,
            "data": {
                "total_users": 0,
                "total_active_alerts": 0,
                "recent_registrations": 0,
                "service_status": "operational",
                "last_updated": datetime.utcnow().isoformat()
            }
        }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user_response = User(
        id=current_user["id"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )
    return {"user": user_response}

# Helper function to search campgrounds using camply
async def search_campgrounds_with_camply(location: str, state: str = None) -> List[CampsiteInfo]:
    """Search for campgrounds using camply library"""
    try:
        provider = RecreationDotGov()
        
        # Search for campgrounds
        if state:
            campgrounds = provider.find_campgrounds(state=state.upper())
        else:
            # If no state specified, try to extract from location or default to popular states
            campgrounds = provider.find_campgrounds(state="CA")  # Default to CA for now
        
        # Filter by location if specified (more flexible matching)
        if location:
            location_lower = location.lower()
            # Create search terms from location
            search_terms = location_lower.split()
            
            filtered_campgrounds = []
            for cg in campgrounds:
                facility_name_lower = cg.facility_name.lower()
                description_lower = getattr(cg, 'description', '').lower() if hasattr(cg, 'description') else ''
                recreation_area_lower = getattr(cg, 'recreation_area', '').lower() if hasattr(cg, 'recreation_area') else ''
                
                # Check if any search term matches facility name, description, or recreation area
                match_found = False
                for term in search_terms:
                    if (term in facility_name_lower or 
                        term in description_lower or
                        term in recreation_area_lower):
                        match_found = True
                        break
                
                # Special handling for common park/location names
                if not match_found:
                    # Check for national park searches
                    if 'national' in search_terms and 'park' in search_terms and 'national park' in recreation_area_lower:
                        match_found = True
                    elif 'park' in search_terms and 'park' in recreation_area_lower:
                        match_found = True
                
                if match_found:
                    filtered_campgrounds.append(cg)
            
            campgrounds = filtered_campgrounds
        
        # Convert to our CampsiteInfo format
        campsite_infos = []
        for cg in campgrounds[:20]:  # Limit to 20 results
            campsite_info = CampsiteInfo(
                id=str(cg.facility_id),
                name=cg.facility_name,
                description=getattr(cg, 'description', '') or f"Campground in {getattr(cg, 'state', 'Unknown')}",
                state=getattr(cg, 'state', ''),
                city=getattr(cg, 'city', ''),
                latitude=getattr(cg, 'latitude', None),
                longitude=getattr(cg, 'longitude', None),
                activities=getattr(cg, 'activities', []) or ["Camping"],
                phone=getattr(cg, 'phone', ''),
                email=getattr(cg, 'email', ''),
                reservation_url=f"https://www.recreation.gov/camping/campgrounds/{cg.facility_id}",
                recreation_gov_id=str(cg.facility_id)
            )
            campsite_infos.append(campsite_info)
        
        return campsite_infos
        
    except Exception as e:
        logger.error(f"Error in camply search: {str(e)}")
        # Return empty list on error rather than failing completely
        return []

# Campground search endpoints
# State name and abbreviation mapping
STATE_ABBREVIATIONS = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
    'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
    'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
    'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
    'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
    'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
    'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY'
}
# National Parks and Rec Areas to state mapping (partial, add more as needed)
NATIONAL_PARKS_TO_STATE = {
    'YELLOWSTONE NATIONAL PARK': 'WY',
    'YOSEMITE NATIONAL PARK': 'CA',
    'GRAND CANYON NATIONAL PARK': 'AZ',
    'ZION NATIONAL PARK': 'UT',
    'GREAT SMOKY MOUNTAINS NATIONAL PARK': 'TN',
    'ROCKY MOUNTAIN NATIONAL PARK': 'CO',
    'ACADIA NATIONAL PARK': 'ME',
    'OLYMPIC NATIONAL PARK': 'WA',
    'GLACIER NATIONAL PARK': 'MT',
    'JOSHUA TREE NATIONAL PARK': 'CA',
    # ... add more as needed ...
}
RECREATION_AREAS_TO_STATE = {
    'LAKE TAHOE': 'CA',
    'LAKE POWELL': 'UT',
    'LAKE MEAD': 'NV',
    'SHASTA LAKE': 'CA',
    # ... add more as needed ...
}
@app.post("/api/search")
async def search_campsites(request: CampsiteSearchRequest):
    """
    Search for available campsites using camply.
    Prioritizes searching by rec_area_id if provided.
    """
    try:
        logger.info(f"Searching campsites with request: {request}")
        provider = RecreationDotGov()
        all_campgrounds = []

        # If rec_area_ids are provided, search within them
        if request.rec_area_id:
            logger.info(f"Searching with rec_area_ids: {request.rec_area_id}")
            campgrounds = provider.find_campgrounds(rec_area_id=[int(rec_id) for rec_id in request.rec_area_id])
            all_campgrounds.extend(campgrounds)

        else: # Fallback to location search if no rec_area_id
            state = None
            location_upper = (request.location or '').strip().upper()
            # Try to extract state from location
            if location_upper in STATE_ABBREVIATIONS:
                state = STATE_ABBREVIATIONS[location_upper]
            elif location_upper in STATE_ABBREVIATIONS.values():
                state = location_upper
            elif location_upper in NATIONAL_PARKS_TO_STATE:
                state = NATIONAL_PARKS_TO_STATE[location_upper]
            elif location_upper in RECREATION_AREAS_TO_STATE:
                state = RECREATION_AREAS_TO_STATE[location_upper]
            else:
                # Try to find state by partial match
                for k, v in STATE_ABBREVIATIONS.items():
                    if k in location_upper or v in location_upper:
                        state = v
                        break
                if not state:
                    for k, v in NATIONAL_PARKS_TO_STATE.items():
                        if k in location_upper:
                            state = v
                            break
                if not state:
                    for k, v in RECREATION_AREAS_TO_STATE.items():
                        if k in location_upper:
                            state = v
                            break
            logger.info(f"Extracted state: {state}")
            # If no state found, broaden search
            states_to_try = [state] if state else ['CA', 'OR', 'WA', 'CO', 'UT', 'AZ', 'NY', 'TX', 'FL', 'MT', 'WY', 'ID', 'NV', 'NM', 'NC', 'TN', 'GA', 'VA', 'PA', 'MI', 'MN', 'WI', 'MO', 'AR', 'SD', 'ND', 'KY', 'OK', 'AL', 'SC', 'LA', 'MD', 'MA', 'NH', 'VT', 'ME', 'AK', 'HI']
            for st in states_to_try:
                campsites = await search_campgrounds_with_camply(request.location or "", st)
                if campsites:
                    all_campgrounds.extend(campsites)
                # If we found enough, break
                if len(all_campgrounds) >= (request.limit or 20):
                    break

        # Convert to our CampsiteInfo format
        campsite_infos = []
        for cg in all_campgrounds:
            campsite_info = CampsiteInfo(
                id=str(cg.facility_id),
                name=cg.facility_name,
                description=getattr(cg, 'description', '') or f"Campground in {getattr(cg, 'state', 'Unknown')}",
                state=getattr(cg, 'state', ''),
                city=getattr(cg, 'city', ''),
                latitude=getattr(cg, 'latitude', None),
                longitude=getattr(cg, 'longitude', None),
                activities=getattr(cg, 'activities', []) or ["Camping"],
                phone=getattr(cg, 'phone', ''),
                email=getattr(cg, 'email', ''),
                reservation_url=f"https://www.recreation.gov/camping/campgrounds/{cg.facility_id}",
                recreation_gov_id=str(cg.facility_id)
            )
            campsite_infos.append(campsite_info)

        seen = set()
        unique_campsites = [c for c in campsite_infos if c.id not in seen and not seen.add(c.id)]


        if not unique_campsites:
            logger.warning("No campsites found via camply, using fallback data")
            unique_campsites = [
                CampsiteInfo(
                    id="fallback-1",
                    name="Popular Campground",
                    description="This campground is currently not available through our search but may have availability. Please check Recreation.gov directly.",
                    state=state if 'state' in locals() else "CA",
                    city="Various Locations",
                    latitude=None,
                    longitude=None,
                    activities=["Camping", "Hiking"],
                    phone="",
                    email="",
                    reservation_url="https://www.recreation.gov",
                    recreation_gov_id=""
                )
            ]

        return {
            "success": True,
            "data": unique_campsites[:request.limit or 20],
            "total_count": len(unique_campsites),
            "source": "recreation.gov via camply"
        }

    except Exception as e:
        logger.error(f"Error searching campsites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching campsites: {str(e)}")


# Availability check endpoint
# Support both GET and POST for availability checking
@app.get("/api/campgrounds/{campground_id}/availability")
@app.post("/api/campgrounds/{campground_id}/availability")
async def check_availability(
    campground_id: str,
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    nights: int = Query(1, description="Number of nights"),
    request: AvailabilityRequest = None
):
    """Check real availability for a specific campground using camply"""
    
    # Handle both GET (query params) and POST (request body)
    if request:
        start_date = request.start_date
        end_date = request.end_date
        nights = request.nights
    
    # Validate required parameters
    if not start_date or not end_date:
        raise HTTPException(
            status_code=400, 
            detail="start_date and end_date are required"
        )
    
    try:
        logger.info(f"Checking availability for campground {campground_id} from {start_date} to {end_date} for {nights} nights")
        
        # Parse and validate dates
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD: {e}")
        
        if start_dt >= end_dt:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        if nights <= 0:
            raise HTTPException(status_code=400, detail="Number of nights must be positive")
        
        # Get campground name first
        campground_name = await get_campground_name(campground_id)
        
        # Create search window
        search_window = SearchWindow(
            start_date=start_dt,
            end_date=end_dt
        )
        
        # Search for availability
        searcher = SearchRecreationDotGov(
            search_window=search_window,
            campgrounds=[int(campground_id)],
            nights=nights
        )
        
        # Get available campsites
        available_sites = searcher.get_all_campsites()
        
        # Convert to our format and collect available dates
        availability_data = []
        available_dates = set()
        
        for site in available_sites:
            booking_date = getattr(site, 'booking_date', None)
            if booking_date:
                available_dates.add(str(booking_date))
            
            availability_data.append({
                "campsite_id": getattr(site, 'campsite_id', ''),
                "campsite_title": getattr(site, 'campsite_title', ''),
                "booking_date": str(booking_date) if booking_date else '',
                "booking_url": getattr(site, 'booking_url', ''),
                "recreation_area": getattr(site, 'recreation_area', ''),
                "facility_name": getattr(site, 'facility_name', ''),
                "booking_nights": getattr(site, 'booking_nights', nights)
            })
        
        # Convert available_dates set to sorted list
        available_dates_list = sorted(list(available_dates))
        
        return {
            "success": True,
            "campground_id": campground_id,
            "campground_name": campground_name,
            "search_parameters": {
                "start_date": start_date,
                "end_date": end_date,
                "nights": nights
            },
            "available_dates": available_dates_list,
            "available_sites": availability_data,
            "total_sites_found": len(availability_data),
            "total_available_dates": len(available_dates_list),
            "source": "Recreation.gov via camply",
            "status": "success" if availability_data else "no_availability",
            "message": f"Found {len(availability_data)} available sites across {len(available_dates_list)} dates" if availability_data else "No available sites found for the specified dates"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "campground_id": campground_id,
            "campground_name": await get_campground_name(campground_id),
            "available_dates": [],
            "available_sites": [],
            "total_sites_found": 0,
            "total_available_dates": 0,
            "source": "Recreation.gov via camply",
            "status": "error",
            "message": f"Error checking availability: {str(e)}"
        }

# Alert endpoints
async def get_campground_name(campground_id: str) -> str:
    """Get campground name from camply"""
    try:
        provider = RecreationDotGov()
        # Try to get campground details
        # Note: This is a simplified approach - in production you might cache this data
        campgrounds = provider.find_campgrounds(state="CA")  # You might need to search multiple states
        
        for cg in campgrounds:
            if str(cg.facility_id) == campground_id:
                return cg.facility_name
        
        # If not found, return a generic name
        return f"Campground {campground_id}"
        
    except Exception as e:
        logger.error(f"Error getting campground name: {str(e)}")
        return f"Campground {campground_id}"

@app.post("/api/campgrounds/{campground_id}/alerts")
async def create_alert(
    campground_id: str,
    alert_data: AlertCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new campsite availability alert (requires authentication)"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get real campground name
            campground_name = await get_campground_name(campground_id)
            
            alert_id = str(uuid.uuid4())
            
            # Insert alert into database
            cursor.execute("""
                INSERT INTO alerts (id, user_id, campground_name, start_date, end_date, site_type, party_size, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert_id,
                current_user["id"],
                campground_name,
                alert_data.start_date,
                alert_data.end_date,
                alert_data.site_type,
                alert_data.party_size,
                1,  # is_active
                datetime.utcnow().isoformat()
            ))
            
            conn.commit()
            
            alert = {
                "id": alert_id,
                "user_id": current_user["id"],
                "campground_id": campground_id,
                "campground_name": campground_name,
                "start_date": alert_data.start_date,
                "end_date": alert_data.end_date,
                "site_type": alert_data.site_type,
                "party_size": alert_data.party_size,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            logger.info(f"Alert created for campground {campground_id} by user {current_user['id']}")
            
            return {"success": True, "data": alert}
        
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create alert")

@app.get("/api/campgrounds/alerts")
async def get_user_alerts(current_user: dict = Depends(get_current_user)):
    """Get all alerts for the current user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, user_id, campground_name, start_date, end_date, site_type, party_size, is_active, created_at
                FROM alerts 
                WHERE user_id = ? AND is_active = 1
                ORDER BY created_at DESC
            """, (current_user["id"],))
            
            alerts = []
            for row in cursor.fetchall():
                alerts.append({
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "campground_name": row["campground_name"],
                    "start_date": row["start_date"],
                    "end_date": row["end_date"],
                    "site_type": row["site_type"],
                    "party_size": row["party_size"],
                    "is_active": bool(row["is_active"]),
                    "created_at": row["created_at"]
                })
            
            return {"success": True, "data": alerts}
        
    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")

@app.post("/api/rec-areas")
async def find_recreation_areas(request: RecAreaSearchRequest):
    """
    Find recreation areas based on a search string.
    """
    try:
        from camply.providers.recreation_dot_gov.recdotgov_provider import RecreationDotGovBase
        from camply.containers.api_responses import RecreationAreaResponse
        from camply.config import RIDBConfig

        class MyRecDotGovProvider(RecreationDotGovBase):
            @property
            def api_search_result_key(self):
                return "RecAreaID"
            @property
            def activity_name(self):
                return "CAMPING"
            @property
            def api_search_result_class(self):
                return RecreationAreaResponse
            @property
            def facility_type(self):
                return "Campground"
            @property
            def resource_api_path(self):
                return RIDBConfig.REC_AREA_API_PATH
            @property
            def api_base_path(self):
                return RIDBConfig.RIDB_BASE_PATH
            @property
            def api_response_class(self):
                return RecreationAreaResponse
            def paginate_recdotgov_campsites(self, facility_id):
                return []

        provider = MyRecDotGovProvider()
        results = provider.find_recreation_areas(search_string=request.search_string, state=request.state)

        rec_areas = []
        for rec_area in results:
            rec_areas.append({
                "id": rec_area.get("RecAreaID"),
                "name": rec_area.get("RecAreaName")
            })

        return {"success": True, "data": rec_areas}

    except Exception as e:
        logging.error(f"Error finding recreation areas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error finding recreation areas: {str(e)}")


@app.patch("/api/campgrounds/alerts/{alert_id}")
async def update_alert(
    alert_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an alert"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get the alert and verify ownership
            cursor.execute("""
                SELECT id, user_id, campground_name, start_date, end_date, site_type, party_size, is_active, created_at
                FROM alerts WHERE id = ? AND is_active = 1
            """, (alert_id,))
            
            alert_row = cursor.fetchone()
            if not alert_row:
                raise HTTPException(status_code=404, detail="Alert not found")
            
            if alert_row["user_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized to update this alert")
            
            # Prepare update fields (only allow certain fields to be updated)
            allowed_fields = ["start_date", "end_date", "site_type", "party_size", "is_active"]
            update_fields = []
            update_values = []
            
            for key, value in update_data.items():
                if key in allowed_fields:
                    update_fields.append(f"{key} = ?")
                    update_values.append(value)
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No valid fields to update")
            
            # Add updated timestamp
            update_fields.append("created_at = ?")  # Using created_at as updated_at for simplicity
            update_values.append(datetime.utcnow().isoformat())
            update_values.append(alert_id)
            
            # Update the alert
            cursor.execute(f"""
                UPDATE alerts SET {', '.join(update_fields)}
                WHERE id = ?
            """, update_values)
            
            conn.commit()
            
            # Return updated alert
            cursor.execute("""
                SELECT id, user_id, campground_name, start_date, end_date, site_type, party_size, is_active, created_at
                FROM alerts WHERE id = ?
            """, (alert_id,))
            
            updated_alert = cursor.fetchone()
            alert_data = {
                "id": updated_alert["id"],
                "user_id": updated_alert["user_id"],
                "campground_name": updated_alert["campground_name"],
                "start_date": updated_alert["start_date"],
                "end_date": updated_alert["end_date"],
                "site_type": updated_alert["site_type"],
                "party_size": updated_alert["party_size"],
                "is_active": bool(updated_alert["is_active"]),
                "created_at": updated_alert["created_at"]
            }
            
            return {"success": True, "data": alert_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating alert: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update alert")

@app.delete("/api/campgrounds/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an alert (soft delete by setting is_active to 0)"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get the alert and verify ownership
            cursor.execute("""
                SELECT id, user_id FROM alerts WHERE id = ? AND is_active = 1
            """, (alert_id,))
            
            alert_row = cursor.fetchone()
            if not alert_row:
                raise HTTPException(status_code=404, detail="Alert not found")
            
            if alert_row["user_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
            
            # Soft delete the alert
            cursor.execute("""
                UPDATE alerts SET is_active = 0 WHERE id = ?
            """, (alert_id,))
            
            conn.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Alert not found")
            
            logger.info(f"Alert {alert_id} deleted by user {current_user['id']}")
            return {"success": True, "message": "Alert deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alert: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete alert")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)