import math
from typing import Optional

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the distance between two points on Earth using the Haversine formula.
    Returns distance in meters.
    """
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Differences
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    # Haversine formula
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    # Earth's radius in meters
    radius = 6371000

    # Calculate the result
    distance = radius * c

    return distance

def is_within_range(user_lat: float, user_lon: float,
                   company_lat: Optional[float], company_lon: Optional[float],
                   max_distance: float = 100.0) -> tuple[bool, float]:
    """
    Check if user is within the specified range of the company location.

    Args:
        user_lat: User's latitude
        user_lon: User's longitude
        company_lat: Company's latitude (can be None)
        company_lon: Company's longitude (can be None)
        max_distance: Maximum allowed distance in meters (default: 100m)

    Returns:
        Tuple of (is_within_range: bool, actual_distance: float)
    """
    # If company location is not set, allow check-in (backward compatibility)
    if company_lat is None or company_lon is None:
        return True, 0.0

    distance = calculate_distance(user_lat, user_lon, company_lat, company_lon)
    return distance <= max_distance, distance