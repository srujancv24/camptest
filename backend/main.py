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
import hashlib
import secrets
import uuid
import sqlite3
import os
from contextlib import contextmanager

# Import camply for real campsite data
from camply import RecreationDotGov, SearchRecreationDotGov, SearchWindow

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CampScout API",
    description="API for campsite availability monitoring using camply library",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"

# Database setup
DATABASE_PATH = "campscout.db"

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
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
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
        user = users_db.get(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

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
            refresh_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(days=30))
            
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
            refresh_token = create_access_token(data={"sub": user_row["id"]}, expires_delta=timedelta(days=30))
            
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
async def search_campgrounds_with_camply(
    location: str = "",
    state: str = None,
    activity: str = "",
    start_date: str = "",
    end_date: str = "",
    nights: int = 1,
    weekend_only: bool = False,
    limit: int = 20,
    rec_area_ids: Optional[List[str]] = None
) -> List[CampsiteInfo]:
    """Search for campgrounds using camply library with advanced filters"""
    try:
        provider = RecreationDotGov()
        # Use rec_area_ids if provided
        if rec_area_ids:
            campgrounds = []
            for rec_id in rec_area_ids:
                campgrounds += provider.find_campgrounds(rec_area_id=[int(rec_id)])
        elif state:
            campgrounds = provider.find_campgrounds(state=state.upper())
        else:
            campgrounds = provider.find_campgrounds(state="CA")  # Default to CA
        # Filter by location, activity, and other filters
        filtered_campgrounds = []
        for cg in campgrounds:
            facility_name_lower = cg.facility_name.lower()
            description_lower = getattr(cg, 'description', '').lower() if hasattr(cg, 'description') else ''
            recreation_area_lower = getattr(cg, 'recreation_area', '').lower() if hasattr(cg, 'recreation_area') else ''
            # Location filter
            location_match = location.lower() in facility_name_lower or location.lower() in description_lower or location.lower() in recreation_area_lower if location else True
            # Activity filter
            activity_match = activity.lower() in (','.join(getattr(cg, 'activities', [])).lower()) if activity else True
            if location_match and activity_match:
                filtered_campgrounds.append(cg)
        campgrounds = filtered_campgrounds
        # TODO: Add date, nights, and weekend_only filtering if needed (requires more advanced logic)
        # Convert to CampsiteInfo
        campsite_infos = []
        for cg in campgrounds[:limit]:
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
        return []

# Campground search endpoints
@app.post("/api/search")
async def search_campsites(request: CampsiteSearchRequest):
    """
    Search for available campsites using camply
    """
    try:
        logger.info(f"Searching campsites for location: {request.location}")
        
        # Extract state from location if possible
        state = None
        if request.location:
            # Simple state extraction (you could make this more sophisticated)
            location_upper = request.location.upper()
            if "CA" in location_upper or "CALIFORNIA" in location_upper:
                state = "CA"
            elif "WA" in location_upper or "WASHINGTON" in location_upper:
                state = "WA"
            elif "OR" in location_upper or "OREGON" in location_upper:
                state = "OR"
            # Add more states as needed
        
        # Search using camply
        campsites = await search_campgrounds_with_camply(request.location or "", state)
        
        # If no results from camply, provide some fallback data
        if not campsites:
            logger.warning("No campsites found via camply, using fallback data")
            campsites = [
                CampsiteInfo(
                    id="fallback-1",
                    name="Popular Campground",
                    description="This campground is currently not available through our search but may have availability. Please check Recreation.gov directly.",
                    state=state or "CA",
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
            "data": campsites,
            "total_count": len(campsites),
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

@app.patch("/api/campgrounds/alerts/{alert_id}")
async def update_alert(
    alert_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an alert"""
    try:
        alert = alerts_db.get(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        if alert["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to update this alert")
        
        # Update alert
        for key, value in update_data.items():
            if key in alert:
                alert[key] = value
        
        alert["updated_at"] = datetime.utcnow()
        alerts_db[alert_id] = alert
        
        return {"success": True, "data": alert}
        
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
    """Delete an alert"""
    try:
        alert = alerts_db.get(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        if alert["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
        
        del alerts_db[alert_id]
        
        return {"success": True, "message": "Alert deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alert: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete alert")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)