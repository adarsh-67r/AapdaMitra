import math

EARTH_RADIUS_KM = 6371


def haversine_km(a: dict, b: dict) -> float:
    lat1, lng1 = math.radians(a["lat"]), math.radians(a["lng"])
    lat2, lng2 = math.radians(b["lat"]), math.radians(b["lng"])
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(h))


def pick_nearest_available(point: dict, resources: list[dict], resource_type: str | None = None) -> dict | None:
    best = None
    best_distance = float("inf")
    for r in resources:
        if r["status"] != "available":
            continue
        if resource_type and r["type"] != resource_type:
            continue
        d = haversine_km(point, r)
        if d < best_distance:
            best_distance = d
            best = r
    return best
