import asyncio
from board import Board
from ai_profiles import build_ai, DEFAULT_PROFILE

class Game:

    def __init__(self, is_mobile=False, ai_profile=DEFAULT_PROFILE):

        self.board = Board()
        self.mode = "AI"

        self.is_mobile = is_mobile
        self.ai_profile = ai_profile
        self.ai = build_ai(ai_profile, is_mobile=is_mobile)

        self.turn = "white"
        self.selected = None
        self.moves = []
        self.state = "IDLE"

        self.capture_options = {}
        self.path_options = []
        self.history = []
        self.flipped = False
        self.animation = None
        self.preview_path = None
        self.game_over = False
        self.winner = None
        self.ai_pending = False
        self.ai_task = None

        self._count_cache_key = None
        self._count_cache_value = (0, 0)

    def set_ai_profile(self, profile_name):
        self.ai_profile = profile_name
        self.ai = build_ai(profile_name, is_mobile=self.is_mobile)
        if self.ai_task is not None:
            self.ai_task.cancel()
            self.ai_task = None
        self.ai_pending = False

    def apply_ai_move(self, move):
        if move is None:
            return

        self.history.append((self.board.clone(), self.turn))
        start = move["start"]

        if move["captured"]:
            def finish():
                self.board.execute_capture(start, move)
                self.switch_turn()
                self.check_win()

                if not self.game_over:
                    self.check_stuck()

                if not self.game_over:
                    self.check_draw()

            self.start_capture_animation(move, finish)

        else:
            end = move["landing"]

            def finish():
                moved = self.board.move(start, end)
                if moved:
                    self.switch_turn()
                    self.check_win()

                    if not self.game_over:
                        self.check_stuck()

                    if not self.game_over:
                        self.check_draw()

            self.start_animation(start, end, finish)

    def should_flip(self):
        return self.mode == "PVP"

    def count_pieces(self):
        key = (id(self.board), self.board.version)
        if self._count_cache_key == key:
            return self._count_cache_value

        white = 0
        black = 0

        for row in self.board.grid:
            for piece in row:
                if piece is None:
                    continue
                if piece.color == "white":
                    white += 1
                else:
                    black += 1

        self._count_cache_key = key
        self._count_cache_value = (white, black)

        return self._count_cache_value

    def check_win(self):
        white, black = self.count_pieces()
        if white == 0:
            self.game_over = True
            self.winner = "black"
            return

        if black == 0:
            self.game_over = True
            self.winner = "white"
            return

    def check_draw(self):
        white_pieces = []
        black_pieces = []

        for row in self.board.grid:
            for piece in row:
                if piece:
                    if piece.color == "white":
                        white_pieces.append(piece)
                    else:
                        black_pieces.append(piece)

        if len(white_pieces) == 1 and len(black_pieces) == 1:
            if white_pieces[0].king and black_pieces[0].king:
                if not self.has_any_capture("white") and not self.has_any_capture("black"):
                    self.game_over = True
                    self.winner = "draw"

    def check_stuck(self):
        moves = self.board.all_moves(self.turn)
        if len(moves) == 0:
            self.game_over = True
            self.winner = "black" if self.turn == "white" else "white"

    def has_any_capture(self, color):
        for r in range(8):
            for c in range(8):
                piece = self.board.get_square(r, c)
                if piece and piece.color == color:
                    if self.board.piece_captures(r, c):
                        return True
        return False

    def get_moves(self, r, c):
        piece = self.board.get_square(r, c)
        if not piece:
            return []

        if self.has_any_capture(piece.color):
            captures = [
                move for move in self.board.all_moves(piece.color)
                if move["start"] == (r, c)
            ]

            self.capture_options = {}
            for cap in captures:
                landing = cap["landing"]
                if landing not in self.capture_options:
                    self.capture_options[landing] = []
                self.capture_options[landing].append(cap)

            return list(self.capture_options.keys())

        self.capture_options = {}
        return self.board.normal_moves(r, c)

    def handle_click(self, r, c, tutorial=False):
        if self.game_over or self.animation:
            return

        piece = self.board.get_square(r, c)

        if self.state == "IDLE":
            if piece and piece.color == self.turn:
                self.selected = (r, c)
                self.moves = self.get_moves(r, c)
                self.state = "SELECTED"
            return

        if self.state == "SELECTED":
            if (r, c) in self.moves:
                options = self.capture_options.get((r, c), [])

                if len(options) <= 1:
                    start = self.selected
                    end = (r, c)
                    captures = self.capture_options.get((r, c), [])

                    self.history.append((self.board.clone(), self.turn))

                    if captures:
                        capture = captures[0]
                        def finish():
                            self.board.execute_capture(start, capture)
                            if not tutorial:
                                self.switch_turn()
                                self.check_win()
                                if not self.game_over:
                                    self.check_stuck()
                                if not self.game_over:
                                    self.check_draw()
                            self.reset()
                        self.start_capture_animation(capture, finish)

                    else:
                        def finish():
                            moved = self.board.move(start, end)
                            if moved:
                                if not tutorial:
                                    self.switch_turn()
                                    self.check_win()
                                    if not self.game_over:
                                        self.check_stuck()
                                    if not self.game_over:
                                        self.check_draw()
                            self.reset()
                        self.start_animation(start, end, finish)
                    return

                self.path_options = options
                self.state = "CHOOSE_PATH"
                return

            if piece and piece.color == self.turn:
                self.selected = (r, c)
                self.moves = self.get_moves(r, c)
            else:
                self.reset()

    def switch_turn(self):
        self.turn = "black" if self.turn == "white" else "white"

    def flip_board(self):
        self.flipped = not self.flipped

    def reset(self):
        self.selected = None
        self.moves = []
        self.capture_options = {}
        self.path_options = []
        self.state = "IDLE"

    def undo(self):
        if not self.history:
            return

        self.board, self.turn = self.history.pop()
        if self.should_flip():
            self.flipped = (self.turn == "black")
        self.reset()
        self.game_over = False
        self.winner = None

    def restart(self):
        self.board = Board()
        self.turn = "white"
        self.flipped = False
        self.history = []

        self.reset()
        self.preview_path = None
        self.game_over = False
        self.winner = None
        self.ai_pending = False

        if self.ai_task is not None:
            self.ai_task.cancel()
            self.ai_task = None

    def update(self, dt):
        dt = min(dt, 0.033)

        if self.animation is not None:
            self.animation["progress"] += dt * 4.5

            if self.animation["progress"] < 1.0:
                return

            if self.animation["type"] == "move":
                self.animation["finish"]()
                self.animation = None

                if self.mode == "PVP":
                    self.flip_board()

                if self.mode == "AI" and self.turn == "black" and not self.game_over:
                    self.ai_pending = True
                return

            if self.animation["type"] == "capture":
                segment = self.animation["segment"]
                captured = self.animation["captured"]

                if segment < len(captured):
                    r, c = captured[segment]
                    if "temp_removed" not in self.animation:
                        self.animation["temp_removed"] = set()
                    self.animation["temp_removed"].add((r, c))
                    self.animation["last_captured_cell"] = (r, c)

                self.animation["segment"] += 1

                if self.animation["segment"] >= len(self.animation["path"]) - 1:
                    self.animation["finish"]()
                    self.animation = None

                    if self.mode == "PVP":
                        self.flip_board()

                    if self.mode == "AI" and self.turn == "black" and not self.game_over:
                        self.ai_pending = True
                    return

                self.animation["progress"] = 0.0
                return

        if self.ai_pending and self.ai_task is None:
            self.ai_pending = False
            self.ai_task = asyncio.create_task(
                self.ai.choose_move(self.board)
            )
            return

        if self.ai_task is not None:
            if self.ai_task.done():
                move = self.ai_task.result()
                self.ai_task = None
                self.apply_ai_move(move)
            return

    def start_animation(self, start, end, finish_callback):
        piece = self.board.get_square(*start)

        self.animation = {
            "type": "move",
            "piece": piece,
            "start": start,
            "end": end,
            "progress": 0.0,
            "finish": finish_callback
        }

    def confirm_path(self, tutorial=False):
        if not self.preview_path:
            return

        selected_path = self.preview_path
        self.history.append((self.board.clone(), self.turn))
        start = self.selected

        def finish():
            self.board.execute_capture(start, selected_path)

            if not tutorial:
                self.switch_turn()
                self.check_win()

                if not self.game_over:
                    self.check_stuck()

                if not self.game_over:
                    self.check_draw()

            self.reset()

        self.start_capture_animation(selected_path, finish)
        self.preview_path = None

    def cancel_path(self):
        self.preview_path = None
        self.path_options = []
        self.state = "SELECTED"

    def start_capture_animation(self, capture, finish_callback):
        piece = self.board.get_square(*capture["start"])

        self.animation = {
            "type": "capture",
            "piece": piece,
            "path": capture["path"],
            "captured": capture["captured"],
            "segment": 0,
            "progress": 0.0,
            "finish": finish_callback,
            "last_captured_cell": None,
            "temp_removed": set()
        }