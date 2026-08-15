import json
from game_core import Game
from tutorial_core import Tutorial


class Bridge:

    def __init__(self):
        self.screen = "menu"
        self.game = Game()
        self.tutorial = None
        self.tutorial_language = "en"

    def active_game(self):
        if self.screen == "tutorial" and self.tutorial:
            return self.tutorial.game
        if self.screen == "game":
            return self.game
        return None

    def goto_menu(self):
        self.screen = "menu"

    def goto_play_menu(self):
        self.screen = "play_menu"

    def start_game(self, mode, ai_profile="expert"):
        self.game.mode = mode
        if mode == "AI":
            self.game.set_ai_profile(ai_profile)
        self.game.restart()
        self.screen = "game"

    def goto_bot_menu(self):
        self.screen = "bot_menu"

    def start_tutorial(self):
        self.tutorial = Tutorial()
        self.tutorial.set_language(self.tutorial_language)
        self.screen = "tutorial"

    def tutorial_next(self):
        if not self.tutorial:
            return
        if self.tutorial.is_last_step():
            self.screen = "menu"
        else:
            self.tutorial.next()

    def tutorial_prev(self):
        if self.tutorial:
            self.tutorial.previous()

    def set_tutorial_language(self, language):
        self.tutorial_language = language
        if self.tutorial:
            self.tutorial.set_language(language)

    def toggle_tutorial_language(self):
        self.tutorial_language = (
            "fa" if self.tutorial_language == "en" else "en"
        )
        if self.tutorial:
            self.tutorial.set_language(self.tutorial_language)

    def back_to_menu(self):
        self.game.restart()
        self.screen = "menu"

    def handle_click(self, r, c):
        g = self.active_game()
        if g:
            g.handle_click(r, c, tutorial=(self.screen == "tutorial"))

    def undo(self):
        g = self.active_game()
        if g:
            g.undo()

    def restart(self):
        g = self.active_game()
        if g:
            g.restart()

    def select_path(self, i):
        g = self.active_game()
        if g and 0 <= i < len(g.path_options):
            g.preview_path = g.path_options[i]

    def confirm_path(self):
        g = self.active_game()
        if g:
            g.confirm_path(tutorial=(self.screen == "tutorial"))

    def cancel_path(self):
        g = self.active_game()
        if g:
            g.cancel_path()

    # ---------- loop ----------
    def update(self, dt):
        if self.screen == "game":
            self.game.update(dt)
        elif self.screen == "tutorial" and self.tutorial:
            self.tutorial.update(dt)

    # ---------- state export ----------
    def get_state(self):
        state = {"screen": self.screen}

        if self.screen in ("menu", "play_menu", "bot_menu"):
            return json.dumps(state)

        g = self.active_game()
        if g is None:
            return json.dumps(state)

        board_data = []
        for row in g.board.grid:
            row_data = []
            for p in row:
                row_data.append(None if p is None else {"color": p.color, "king": p.king})
            board_data.append(row_data)

        white_count, black_count = g.count_pieces()

        anim = None
        a = g.animation
        if a:
            if a["type"] == "move":
                anim = {
                    "type": "move",
                    "start": list(a["start"]),
                    "end": list(a["end"]),
                    "progress": min(a["progress"], 1.0),
                    "color": a["piece"].color,
                    "king": a["piece"].king,
                }
            else:
                anim = {
                    "type": "capture",
                    "path": [list(p) for p in a["path"]],
                    "segment": a["segment"],
                    "progress": min(a["progress"], 1.0),
                    "temp_removed": [list(p) for p in a.get("temp_removed", set())],
                    "color": a["piece"].color,
                    "king": a["piece"].king,
                }

        state.update({
            "mode": g.mode,
            "turn": g.turn,
            "board": board_data,
            "selected": list(g.selected) if g.selected else None,
            "moves": [list(m) for m in g.moves],
            "game_state": g.state,
            "path_options_count": len(g.path_options) if g.state == "CHOOSE_PATH" else 0,
            "preview_path": ([list(p) for p in g.preview_path["path"]] if g.preview_path else None),
            "game_over": g.game_over,
            "winner": g.winner,
            "white_count": white_count,
            "black_count": black_count,
            "flipped": g.flipped,
            "animation": anim,
            "ai_thinking": bool(g.ai_pending or g.ai_task is not None),
        })

        if self.screen == "tutorial" and self.tutorial:
            state["tutorial_title"] = self.tutorial.title
            state["tutorial_text"] = self.tutorial.text
            state["tutorial_is_last"] = self.tutorial.is_last_step()
            state["tutorial_step"] = self.tutorial.step
            state["tutorial_total"] = len(self.tutorial.steps)
            state["tutorial_language"] = self.tutorial.language
            state["tutorial_highlight"] = [
                list(cell) for cell in getattr(self.tutorial, "highlight", [])
            ]

        return json.dumps(state)


bridge = Bridge()
