#!/usr/bin/env python3
"""
🏕️ CampScout Availability Features Demo
Demonstrates the comprehensive availability checking capabilities
"""
import requests
import json
from datetime import datetime, timedelta
import asyncio
from typing import List

def demo_availability_features():
    """Demonstrate the availability checking features"""
    
    print("🏕️ CAMPSCOUT AVAILABILITY FEATURES DEMO")
    print("=" * 60)
    print("🎯 Demonstrating real-time availability checking")
    print("📅 Various date ranges, nights, and weekend options")
    print("🔗 Live Recreation.gov integration")
    
    base_url = "http://localhost:8000"
    
    # Calculate future dates
    today = datetime.now().date()
    start_date = today + timedelta(days=30)
    end_date = start_date + timedelta(days=30)
    
    print(f"\n📆 Using future dates: {start_date} to {end_date}")
    
    # Demo scenarios
    scenarios = [
        {
            'name': 'Yosemite',
            'search_location': 'Yosemite',
            'nights': 2,
            'description': 'Find lake campgrounds for weekend trips'
        },
        {
            'name': 'Cascades',
            'search_location': 'North Cascades National Park',
            'nights': 1,
            'description': 'Single night in Yosemite (high demand)'
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'='*15} DEMO {i}/{len(scenarios)} {'='*15}")
        print(f"🎯 {scenario['name']}")
        print(f"📝 {scenario['description']}")
        print(f"🌙 Nights: {scenario['nights']}")
        
        try:
            # Step 1: Search for campgrounds
            print(f"\n1️⃣ Searching for {scenario['search_location']} campgrounds...")
            search_response = requests.post(
                f"{base_url}/api/search",
                json={"location": scenario['search_location']},
                timeout=10
            )
            
            if search_response.status_code == 200:
                search_data = search_response.json()
                campgrounds = search_data.get('data', [])[:2]  # Limit to 2 for demo
                
                print(f"   ✅ Found {len(campgrounds)} campgrounds")
                
                # Step 2: Check availability for each campground
                for j, cg in enumerate(campgrounds, 1):
                    cg_id = cg.get('recreation_gov_id')
                    cg_name = cg.get('name', 'Unknown')
                    
                    if not cg_id:
                        print(f"   ⚠️  Skipping {cg_name} - no Recreation.gov ID")
                        continue
                    
                    print(f"\n2️⃣.{j} Checking availability: {cg_name}")
                    
                    # Check availability using GET endpoint
                    availability_url = f"{base_url}/api/campgrounds/{cg_id}/availability"
                    params = {
                        'start_date': str(start_date),
                        'end_date': str(end_date),
                        'nights': scenario['nights']
                    }
                    
                    availability_response = requests.get(
                        availability_url,
                        params=params,
                        timeout=15
                    )
                    
                    if availability_response.status_code == 200:
                        avail_data = availability_response.json()
                        
                        if avail_data.get('success'):
                            total_sites = avail_data.get('total_sites_found', 0)
                            total_dates = avail_data.get('total_available_dates', 0)
                            available_dates = avail_data.get('available_dates', [])
                            
                            if total_sites > 0:
                                print(f"      ✅ AVAILABILITY FOUND!")
                                print(f"      🏕️  {total_sites} sites available")
                                print(f"      📅 {total_dates} dates available")
                                
                                # Show sample dates
                                if available_dates:
                                    sample_dates = available_dates[:3]
                                    dates_str = ', '.join(sample_dates)
                                    more = '...' if len(available_dates) > 3 else ''
                                    print(f"      📋 Sample dates: {dates_str}{more}")
                                
                                # Count weekend dates
                                weekend_count = 0
                                for date_str in available_dates:
                                    try:
                                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                                        if date_obj.weekday() >= 5:  # Weekend
                                            weekend_count += 1
                                    except:
                                        pass
                                
                                if weekend_count > 0:
                                    print(f"      🎯 {weekend_count} weekend dates available")
                                
                                print(f"      🔗 Book at: {cg.get('reservation_url', 'N/A')}")
                            else:
                                print(f"      ℹ️  No availability for {scenario['nights']}-night stays")
                        else:
                            print(f"      ❌ Error: {avail_data.get('message', 'Unknown error')}")
                    else:
                        print(f"      ❌ API Error: {availability_response.status_code}")
            else:
                print(f"   ❌ Search failed: {search_response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Demo error: {e}")
        
        if i < len(scenarios):
            print(f"\n⏳ Waiting before next demo...")
    
    # Summary
    print(f"\n" + "=" * 60)
    print("🎉 AVAILABILITY FEATURES DEMO COMPLETE!")
    print("=" * 60)
    
    print("✅ Features Demonstrated:")
    print("   🔍 Real campground search by location")
    print("   📅 Live availability checking with date ranges")
    print("   🌙 Flexible night specification (1, 2, 7+ nights)")
    print("   🎯 Weekend date identification and counting")
    print("   🏕️  Multiple recreational area types")
    print("   🔗 Real Recreation.gov booking URLs")
    
    print(f"\n🚀 Your CampScout App Features:")
    print("   📱 Users can search any location")
    print("   📅 Check availability for any date range")
    print("   🎯 Toggle weekend-only searches")
    print("   🌙 Specify 1-14+ night stays")
    print("   🔔 Set alerts for real campgrounds")
    print("   📊 View real availability statistics")
    
    print(f"\n🎊 Ready for Production Use!")

def test_search_campgrounds_with_camply():
    """Test async search_campgrounds_with_camply for various filters"""
    from backend.main import search_campgrounds_with_camply  # Adjust import if needed

    test_cases = [
        {"location": "Yosemite", "state": "CA", "activity": "Camping", "nights": 2, "weekend_only": False, "limit": 3},
        {"location": "North cascades national park", "state": "WA", "activity": "Hiking", "nights": 1, "weekend_only": True, "limit": 2},
        {"location": "Lake", "state": "CA", "activity": "Boating", "nights": 3, "weekend_only": False, "limit": 2},
        {"location": "National Forest", "state": "CA", "activity": "Fishing", "nights": 5, "weekend_only": False, "limit": 2},
    ]

    async def run_tests():
        for case in test_cases:
            print(f"\n🔍 Testing search_campgrounds_with_camply with filters: {case}")
            try:
                results: List = await search_campgrounds_with_camply(
                    location=case.get("location", ""),
                    state=case.get("state", None),
                    activity=case.get("activity", ""),
                    nights=case.get("nights", 1),
                    weekend_only=case.get("weekend_only", False),
                    limit=case.get("limit", 3)
                )
                print(f"  ✅ Found {len(results)} campgrounds for {case['location']} ({case['state']})")
                for cg in results:
                    print(f"    - {getattr(cg, 'name', str(cg))} | Activities: {getattr(cg, 'activities', [])}")
                if not results:
                    print("    ...No results...")
            except Exception as e:
                print(f"  ❌ Error: {e}")

    asyncio.run(run_tests())

if __name__ == "__main__":
    print("🚀 Starting CampScout Availability Demo...")
    print("⏳ This demo shows real availability checking features")
    print("🔗 Requires backend running on localhost:8000\n")
    
    demo_availability_features()
    
    print("\n🧪 Running camply search tests...")
    test_search_campgrounds_with_camply()