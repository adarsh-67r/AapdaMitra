import math

EARTH_RADIUS_KM = 6371

# No distance ceiling by default: the allocator always answers with the nearest
# available resource, however far that is. A ceiling was tried and removed by
# product decision — refusing on distance stalled dispatch in regions with sparse
# coverage, and an operator would rather see "nearest is 460 km" and decide than
# be told nothing is available. Callers may still pass max_km to bound a search.
#
# Kept as the threshold at which a dispatch is flagged as unusually distant, so
# distance is surfaced rather than enforced.
FAR_DISPATCH_KM = 150.0

# How much further an operator should be willing to send a better-suited unit.
# Expressed in kilometres so the trade-off stays legible: for a critical report,
# a rescue team up to ~20 km further out beats a shelter next door.
TYPE_PREFERENCE_BONUS_KM = 20.0

# Capacity breaks near-ties only. A resource that can take 400 people is worth a
# couple of kilometres over one that can take 5 — never more than that, or the
# allocator would start sending distant depots to nearby incidents.
MAX_CAPACITY_BONUS_KM = 3.0
CAPACITY_REFERENCE = 200.0

SEVERE = {"critical", "high"}


def haversine_km(a: dict, b: dict) -> float:
    lat1, lng1 = math.radians(a["lat"]), math.radians(a["lng"])
    lat2, lng2 = math.radians(b["lat"]), math.radians(b["lng"])
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(h))


def preferred_type_for(severity: str | None) -> str | None:
    """A life-threatening report wants people, not a building."""
    return "rescue_team" if severity in SEVERE else None


def _capacity_bonus(capacity) -> float:
    if capacity is None:
        return 0.0
    return min(float(capacity) / CAPACITY_REFERENCE, 1.0) * MAX_CAPACITY_BONUS_KM


def _is_eligible(resource: dict, resource_type: str | None) -> bool:
    if resource.get("status") != "available":
        return False
    if resource_type and resource.get("type") != resource_type:
        return False
    # A capacity of zero means full in all but name. Absent capacity is unknown,
    # not zero — rescue teams often carry no figure — so it stays eligible.
    capacity = resource.get("capacity")
    if capacity is not None and capacity <= 0:
        return False
    return True


def pick_best_resource(
    report: dict,
    resources: list[dict],
    resource_type: str | None = None,
    max_km: float | None = None,
) -> tuple[dict | None, float | None]:
    """Choose which resource to send, and say how far it has to travel.

    Scored in kilometres throughout: the score is the real travel distance,
    discounted for a resource that suits the report better or has more room.
    Keeping every term in the same unit means the weightings can be argued about
    in plain language instead of being opaque tuning constants.

    Returns (resource, distance_km), or (None, None) when nothing qualifies.
    """
    preferred = resource_type or preferred_type_for(report.get("severity"))

    best = None
    best_score = float("inf")
    best_distance = None

    for resource in resources:
        if not _is_eligible(resource, resource_type):
            continue

        distance = haversine_km(report, resource)
        if max_km is not None and distance > max_km:
            continue

        score = distance - _capacity_bonus(resource.get("capacity"))
        if preferred and resource.get("type") == preferred:
            score -= TYPE_PREFERENCE_BONUS_KM

        if score < best_score:
            best_score = score
            best = resource
            best_distance = distance

    return best, best_distance


def pick_nearest_available(
    point: dict, resources: list[dict], resource_type: str | None = None
) -> dict | None:
    """Backwards-compatible wrapper returning only the chosen resource."""
    return pick_best_resource(point, resources, resource_type)[0]
