import math
import time
import random
import asyncio

MATE_SCORE = 1_000_000

DEFAULT_WEIGHTS = {
    "material": 1.0,
    "center": 1.0,
    "advance": 1.0,
    "mobility": 0.0,
    "safety": 0.0,
    "aggression": 0.0,
    "breakthrough": 0.0,
}


class TimeUp(Exception):
    pass


class AI:

    def __init__(self, depth=6, time_limit=0.5, yield_every=32,
                 weights=None, blunder_chance=0.0, blunder_free_below=None,
                 endgame_boost=None, endgame_time=None):
        self.depth = depth
        self.time_limit = time_limit
        self.tt = {}
        self.killer = {}
        self.node_count = 0
        self.deadline = 0
        self.yield_every = yield_every

        self._yield_time_budget = 0.012  # ~12ms
        self._last_yield = time.monotonic()

        self.weights = dict(DEFAULT_WEIGHTS)
        if weights:
            self.weights.update(weights)

        self.blunder_chance = blunder_chance
        self.blunder_free_below = blunder_free_below
        self.endgame_boost = dict(endgame_boost) if endgame_boost else {}
        self.endgame_time = dict(endgame_time) if endgame_time else {}

    def _total_pieces(self, board):
        total = 0
        for r in range(8):
            for c in range(8):
                if board.get_square(r, c) is not None:
                    total += 1
        return total

    def _effective_depth(self, board):
        if not self.endgame_boost:
            return self.depth
        total = self._total_pieces(board)
        for threshold in sorted(self.endgame_boost):
            if total <= threshold:
                return self.depth + self.endgame_boost[threshold]
        return self.depth

    def _effective_time_limit(self, board):
        if not self.endgame_time:
            return self.time_limit
        total = self._total_pieces(board)
        for threshold in sorted(self.endgame_time):
            if total <= threshold:
                return self.endgame_time[threshold]
        return self.time_limit

    def _effective_blunder_chance(self, board):
        if not self.blunder_chance:
            return 0.0
        if self.blunder_free_below is None:
            return self.blunder_chance
        total = self._total_pieces(board)
        if total <= self.blunder_free_below:
            return 0.0
        return self.blunder_chance

    async def choose_move(self, board):
        self.tt.clear()
        self.node_count = 0
        self._last_yield = time.monotonic()
        best_move = None

        depth_limit = self._effective_depth(board)
        self.deadline = time.monotonic() + self._effective_time_limit(board)

        for d in range(1, depth_limit + 1):
            try:
                _, move = await self.minimax(
                    board, d, -math.inf, math.inf, False
                )
            except TimeUp:
                break

            if move is not None:
                best_move = move

            if time.monotonic() >= self.deadline:
                break

        effective_blunder_chance = self._effective_blunder_chance(board)
        if best_move is not None and effective_blunder_chance:
            if random.random() < effective_blunder_chance:
                legal_moves = board.all_moves("black")
                if legal_moves:
                    best_move = random.choice(legal_moves)

        return best_move

    async def minimax(self, board, depth, alpha, beta, maximizing):
        self.node_count += 1

        now = time.monotonic()
        if (self.node_count % self.yield_every == 0
                or (now - self._last_yield) >= self._yield_time_budget):
            self._last_yield = now
            await asyncio.sleep(0)
            if time.monotonic() >= self.deadline:
                raise TimeUp()

        key = (board.hash(), depth, maximizing)
        tt_entry = self.tt.get(key)
        tt_move = None

        if tt_entry is not None:
            tt_score, tt_move, tt_flag = tt_entry
            if tt_flag == "EXACT":
                return tt_score, tt_move
            if tt_flag == "LOWER" and tt_score >= beta:
                return tt_score, tt_move
            if tt_flag == "UPPER" and tt_score <= alpha:
                return tt_score, tt_move

        moves = board.all_moves("white" if maximizing else "black")

        if not moves:
            mate_score = MATE_SCORE + depth
            return (-mate_score if maximizing else mate_score), None

        if depth == 0:
            q_score = await self.quiescence(board, alpha, beta, maximizing)
            return q_score, None

        original_alpha = alpha
        original_beta = beta

        killer = self.killer.get(depth)
        if killer is not None and killer in moves:
            moves.remove(killer)
            moves.insert(0, killer)

        moves.sort(key=lambda m: self.move_score(board, m), reverse=True)

        if tt_move is not None and tt_move in moves:
            moves.remove(tt_move)
            moves.insert(0, tt_move)

        if maximizing:
            best_score = -math.inf
            best_move = moves[0]

            for move in moves:
                new_board = board.apply_move(move)
                score, _ = await self.minimax(
                    new_board, depth - 1, alpha, beta, False
                )

                if score > best_score:
                    best_score = score
                    best_move = move

                alpha = max(alpha, best_score)
                if alpha >= beta:
                    self.killer[depth] = move
                    break
        else:
            best_score = math.inf
            best_move = moves[0]

            for move in moves:
                new_board = board.apply_move(move)
                score, _ = await self.minimax(
                    new_board, depth - 1, alpha, beta, True
                )

                if score < best_score:
                    best_score = score
                    best_move = move

                beta = min(beta, best_score)
                if alpha >= beta:
                    self.killer[depth] = move
                    break

        if best_score <= original_alpha:
            flag = "UPPER"
        elif best_score >= original_beta:
            flag = "LOWER"
        else:
            flag = "EXACT"

        self.tt[key] = (best_score, best_move, flag)
        return best_score, best_move

    async def quiescence(self, board, alpha, beta, maximizing, q_depth=3):
        self.node_count += 1
        now = time.monotonic()
        if (self.node_count % self.yield_every == 0
                or (now - self._last_yield) >= self._yield_time_budget):
            self._last_yield = now
            await asyncio.sleep(0)
            if time.monotonic() >= self.deadline:
                raise TimeUp()

        stand_pat = self.evaluate_board(board)

        if q_depth == 0:
            return stand_pat

        if maximizing:
            if stand_pat >= beta:
                return beta
            alpha = max(alpha, stand_pat)

            captures = [
                m for m in board.all_moves("white") if m.get("captured")
            ]
            for move in captures:
                new_board = board.apply_move(move)
                score = await self.quiescence(
                    new_board, alpha, beta, False, q_depth - 1
                )
                if score >= beta:
                    return beta
                alpha = max(alpha, score)
            return alpha
        else:
            if stand_pat <= alpha:
                return alpha
            beta = min(beta, stand_pat)

            captures = [
                m for m in board.all_moves("black") if m.get("captured")
            ]
            for move in captures:
                new_board = board.apply_move(move)
                score = await self.quiescence(
                    new_board, alpha, beta, True, q_depth - 1
                )
                if score <= alpha:
                    return alpha
                beta = min(beta, score)
            return beta

    def evaluate_board(self, board):
        w = self.weights
        score = 0.0

        for r in range(8):
            for c in range(8):
                piece = board.get_square(r, c)
                if piece is None:
                    continue

                val = (300 if piece.king else 100) * w["material"]
                center_bonus = (10 - abs(3.5 - r) * 2 - abs(3.5 - c) * 2) * w["center"]
                val += center_bonus

                if not piece.king:
                    if piece.color == "white":
                        val += r * 5 * w["advance"]
                    else:
                        val += (7 - r) * 5 * w["advance"]

                if piece.color == "white":
                    score += val
                else:
                    score -= val

        if w.get("mobility"):
            white_mobility = len(board.all_moves("white"))
            black_mobility = len(board.all_moves("black"))
            score += (white_mobility - black_mobility) * 6 * w["mobility"]

        if w.get("safety"):
            white_hanging = self._hanging_count(board, "white")
            black_hanging = self._hanging_count(board, "black")
            # مهره‌ی در معرض خطرِ خودی بد است، مهره‌ی در معرض خطرِ حریف خوب.
            score += (black_hanging - white_hanging) * 40 * w["safety"]

        if w.get("aggression"):
            white_threats = self._threat_count(board, "white")
            black_threats = self._threat_count(board, "black")
            score += (white_threats - black_threats) * 15 * w["aggression"]

        if w.get("breakthrough"):
            white_runway = self._runway_score(board, "white")
            black_runway = self._runway_score(board, "black")
            score += (white_runway - black_runway) * 8 * w["breakthrough"]

        return score

    def _hanging_positions(self, board, color):
        enemy = "black" if color == "white" else "white"
        hanging = set()

        for r in range(8):
            for c in range(8):
                piece = board.get_square(r, c)
                if piece is None or piece.color != enemy:
                    continue

                for cap in board.piece_captures(r, c):
                    for (er, ec) in cap["captured"]:
                        target = board.get_square(er, ec)
                        if target is not None and target.color == color:
                            hanging.add((er, ec))

        return hanging

    def _hanging_count(self, board, color):
        return len(self._hanging_positions(board, color))

    def _runway_score(self, board, color):
        hanging = self._hanging_positions(board, color)
        promote_row = 7 if color == "white" else 0
        step = 1 if color == "white" else -1

        total = 0.0
        for r in range(8):
            for c in range(8):
                piece = board.get_square(r, c)
                if piece is None or piece.color != color or piece.king:
                    continue
                if (r, c) in hanging:
                    continue

                distance = abs(promote_row - r)
                if distance == 0:
                    continue

                clear = True
                rr = r + step
                while 0 <= rr < 8:
                    if board.get_square(rr, c) is not None:
                        clear = False
                        break
                    rr += step

                if not clear:
                    continue

                edge_factor = 1.6 if c in (0, 7) else 1.0
                total += edge_factor * (8 - distance)

        return total

    def _threat_count(self, board, color):
        count = 0
        for r in range(8):
            for c in range(8):
                piece = board.get_square(r, c)
                if piece is None or piece.color != color:
                    continue
                count += len(board.piece_captures(r, c))
        return count

    def move_score(self, board, move):
        score = 0
        score += len(move.get("captured", [])) * 2000

        sr, sc = move["start"]
        lr, lc = move["landing"]
        piece = board.get_square(sr, sc)

        if piece and not piece.king:
            if piece.color == "white" and lr == 7:
                score += 800
            if piece.color == "black" and lr == 0:
                score += 800

        return score