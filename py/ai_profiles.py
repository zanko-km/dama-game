
from ai import AI

PROFILES = {

    "defensive": {
        "depth": 7,
        "time_limit": 0.7,
        "weights": {
            "material": 1.0,
            "center": 0.6,
            "advance": 0.3,
            "mobility": 0.15,
            "safety": 0.6,
            "aggression": 0.0,
            "breakthrough": 0.9,
        },
        "blunder_chance": 0.0,
    },

    "aggressive": {
        "depth": 7,
        "time_limit": 0.7,
        "weights": {
            "material": 1.0,
            "center": 0.6,
            "advance": 0.9,
            "mobility": 0.05,
            "safety": 0.0,
            "aggression": 0.5,
            "breakthrough": 0.25,
        },
        "blunder_chance": 0.0,
    },

    "expert": {
        "depth": 11,
        "time_limit": 1.3,
        "weights": {
            "material": 1.0,
            "center": 1.0,
            "advance": 1.0,
            "mobility": 0.25,
            "safety": 0.3,
            "aggression": 0.2,
            "breakthrough": 0.7,
        },
        "blunder_chance": 0.0,
    },

    "weak": {
        "depth": 2,
        "time_limit": 0.25,
        "weights": {
            "material": 1.0,
            "center": 0.0,
            "advance": 0.0,
            "mobility": 0.0,
            "safety": 0.0,
            "aggression": 0.0,
            "breakthrough": 0.0,
        },
        "blunder_chance": 0.28,
    },

    "trickster": {
        "depth": 5,
        "time_limit": 0.6,
        "weights": {
            "material": 1.0,
            "center": 0.55,
            "advance": 0.45,
            "mobility": 0.2,
            "safety": 0.2,
            "aggression": 0.25,
            "breakthrough": 0.95,
        },
        "blunder_chance": 0.06,
        "blunder_free_below": 10,
        "endgame_boost": {
            20: 1, 18: 2, 16: 3, 14: 4, 12: 5,
            10: 6, 8: 8, 6: 10, 4: 12, 2: 15,
        },
        "endgame_time": {
            20: 0.7, 18: 0.75, 16: 0.85, 14: 0.95, 12: 1.05,
            10: 1.2, 8: 1.35, 6: 1.5, 4: 1.6, 2: 1.7,
        },
    },
}

DEFAULT_PROFILE = "expert"


def build_ai(profile_name, is_mobile=False):
    profile = PROFILES.get(profile_name, PROFILES[DEFAULT_PROFILE])

    depth = profile["depth"]
    time_limit = profile["time_limit"]
    yield_every = 32

    endgame_boost = profile.get("endgame_boost")
    endgame_time = profile.get("endgame_time")
    blunder_free_below = profile.get("blunder_free_below")

    if is_mobile:
        depth = max(2, depth - 2)
        time_limit = max(0.15, time_limit * 0.55)
        yield_every = 8

        if endgame_boost:
            endgame_boost = {k: max(1, v - 2) for k, v in endgame_boost.items()}
        if endgame_time:
            endgame_time = {k: max(0.15, v * 0.55) for k, v in endgame_time.items()}

    return AI(
        depth=depth,
        time_limit=time_limit,
        yield_every=yield_every,
        weights=dict(profile["weights"]),
        blunder_chance=profile.get("blunder_chance", 0.0),
        blunder_free_below=blunder_free_below,
        endgame_boost=endgame_boost,
        endgame_time=endgame_time,
    )