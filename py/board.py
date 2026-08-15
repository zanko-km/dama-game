# (Replace the existing file content with this updated version)

from piece import Piece

WHITE_DIRECTIONS = [(1, 0), (0, 1), (0, -1)]
BLACK_DIRECTIONS = [(-1, 0), (0, 1), (0, -1)]
KING_DIRECTIONS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


class Board:

    def __init__(self):
        self.size = 8
        self.grid = [[None for _ in range(self.size)] for _ in range(self.size)]
        self.version = 0
        self._hash_cache = None
        self._captures_cache = None

        self.setup_peices()

    def _bump_version(self):
        self.version = getattr(self, "version", 0) + 1
        self._invalidate_hash()

    def _invalidate_hash(self):
        self._hash_cache = None
        self._captures_cache = None

    def setup_peices(self):
        for row in [1, 2]:
            for col in range(self.size):
                self.grid[row][col] = Piece("white")

        for row in [5, 6]:
            for col in range(self.size):
                self.grid[row][col] = Piece("black")

        self._bump_version()

    def clone(self):
        new_board = Board.__new__(Board)
        new_board.size = self.size
        new_board.version = self.version
        new_board.grid = [
            [piece.clone() if piece is not None else None for piece in row]
            for row in self.grid
        ]

        new_board._hash_cache = self._hash_cache
        new_board._captures_cache = (
            dict(self._captures_cache) if self._captures_cache is not None else None
        )
        return new_board

    def inside_board(self, row, col):
        return 0 <= row < self.size and 0 <= col < self.size

    def get_square(self, row, col):
        if not self.inside_board(row, col):
            return None
        return self.grid[row][col]

    def peice_directions(self, piece):
        if piece.king:
            return KING_DIRECTIONS
        if piece.color == "white":
            return WHITE_DIRECTIONS
        else:
            return BLACK_DIRECTIONS

    def promote_last_piece(self):
        white_count = 0
        black_count = 0

        last_white = None
        last_black = None

        for row in self.grid:
            for square in row:
                if square is None:
                    continue

                if square.color == "white":
                    white_count += 1
                    last_white = square

                if square.color == "black":
                    black_count += 1
                    last_black = square

        changed = False
        if white_count == 1 and last_white and not last_white.king:
            last_white.promote()
            changed = True

        if black_count == 1 and last_black and not last_black.king:
            last_black.promote()
            changed = True

        if changed:
            self._bump_version()

    def normal_moves(self, row, col):
        piece = self.get_square(row, col)
        if not piece:
            return []

        moves_list = []
        dirs = self.peice_directions(piece)
        grid = self.grid
        inside = self.inside_board

        for direction_row, direction_col in dirs:
            next_row = row + direction_row
            next_col = col + direction_col

            if piece.king:
                while inside(next_row, next_col) and grid[next_row][next_col] is None:
                    moves_list.append((next_row, next_col))
                    next_row += direction_row
                    next_col += direction_col
            else:
                if inside(next_row, next_col) and grid[next_row][next_col] is None:
                    moves_list.append((next_row, next_col))

        return moves_list

    def promote(self, piece, row):
        changed = False
        if piece and piece.color == "white" and row == 7 and not piece.king:
            piece.promote()
            changed = True
        if piece and piece.color == "black" and row == 0 and not piece.king:
            piece.promote()
            changed = True
        if changed:
            self._bump_version()

    def normal_piece_most_captures(self, row, col):
        piece = self.get_square(row, col)
        if not piece:
            return []

        results = []
        grid = self.grid
        size = self.size
        inside = self.inside_board
        dirs = self.peice_directions(piece)
        stack = [(row, col, [r[:] for r in grid], [], [(row, col)])]

        def dfs(current_row, current_col, board_matrix, captured, path):
            found = False
            for direction_row, direction_col in dirs:
                enemy_row = current_row + direction_row
                enemy_col = current_col + direction_col

                if not inside(enemy_row, enemy_col):
                    continue

                enemy = board_matrix[enemy_row][enemy_col]
                if enemy is None or enemy.color == piece.color:
                    continue

                landing_row = enemy_row + direction_row
                landing_col = enemy_col + direction_col

                if not inside(landing_row, landing_col):
                    continue

                if board_matrix[landing_row][landing_col] is not None:
                    continue

                found = True

                new_board = [r[:] for r in board_matrix]
                new_board[current_row][current_col] = None
                new_board[enemy_row][enemy_col] = None
                new_board[landing_row][landing_col] = piece

                dfs(landing_row, landing_col, new_board, captured + [(enemy_row, enemy_col)], path + [(landing_row, landing_col)])

            if not found and captured:
                results.append({
                    "start": (row, col),
                    "landing": (current_row, current_col),
                    "captured": captured,
                    "path": path
                })

        dfs(row, col, grid, [], [(row, col)])

        if not results:
            return []

        best = max(len(item["captured"]) for item in results)
        return [item for item in results if len(item["captured"]) == best]

    def king_most_captures(self, row, col):
        piece = self.get_square(row, col)
        if not piece:
            return []

        results = []
        grid = self.grid
        inside = self.inside_board

        def dfs(current_row, current_col, board_matrix, captured, path):
            found = False
            for direction_row, direction_col in KING_DIRECTIONS:
                next_row = current_row + direction_row
                next_col = current_col + direction_col

                while inside(next_row, next_col):
                    cell = board_matrix[next_row][next_col]
                    if cell is None:
                        next_row += direction_row
                        next_col += direction_col
                        continue

                    if cell.color == piece.color:
                        break

                    enemy_row, enemy_col = next_row, next_col
                    landing_row = enemy_row + direction_row
                    landing_col = enemy_col + direction_col

                    if not inside(landing_row, landing_col):
                        break

                    if board_matrix[landing_row][landing_col] is not None:
                        break

                    found = True
                    final_row = landing_row
                    final_col = landing_col

                    while inside(final_row, final_col) and board_matrix[final_row][final_col] is None:
                        new_board = [r[:] for r in board_matrix]
                        new_board[current_row][current_col] = None
                        new_board[enemy_row][enemy_col] = None
                        new_board[final_row][final_col] = piece

                        dfs(final_row, final_col, new_board, captured + [(enemy_row, enemy_col)], path + [(final_row, final_col)])

                        final_row += direction_row
                        final_col += direction_col

                    break

            if not found and captured:
                results.append({
                    "start": (row, col),
                    "landing": (current_row, current_col),
                    "captured": captured,
                    "path": path
                })

        dfs(row, col, grid, [], [(row, col)])

        if not results:
            return []

        best = max(len(item["captured"]) for item in results)
        return [item for item in results if len(item["captured"]) == best]

    def piece_captures(self, row, col):
        piece = self.get_square(row, col)
        if not piece:
            return []

        if self._captures_cache is None:
            self._captures_cache = {}

        key = (row, col)
        cached = self._captures_cache.get(key)
        if cached is not None:
            return cached

        if piece.king:
            result = self.king_most_captures(row, col)
        else:
            result = self.normal_piece_most_captures(row, col)

        self._captures_cache[key] = result
        return result

    def move(self, start, end):
        row, col = start
        piece = self.get_square(row, col)
        if not piece:
            return False

        for move in self.piece_captures(row, col):
            landing = move["landing"]
            enemies = move["captured"]
            if landing == end:
                for enemy_row, enemy_col in enemies:
                    self.grid[enemy_row][enemy_col] = None

                self.grid[end[0]][end[1]] = piece
                self.grid[row][col] = None

                self.promote(piece, end[0])
                self.promote_last_piece()
                self._bump_version()
                return True

        if end in self.normal_moves(row, col):
            self.grid[end[0]][end[1]] = piece
            self.grid[row][col] = None
            self.promote_last_piece()
            self.promote(piece, end[0])
            self._bump_version()
            return True

        return False

    def execute_capture(self, start, capture):
        row, col = start
        piece = self.grid[row][col]
        self.grid[row][col] = None

        for enemy_row, enemy_col in capture["captured"]:
            self.grid[enemy_row][enemy_col] = None

        landing = capture["landing"]
        self.grid[landing[0]][landing[1]] = piece

        self.promote(piece, landing[0])
        self.promote_last_piece()
        self._bump_version()

    def all_moves(self, color):
        moves = []
        has_capture = False

        for row in range(8):
            for col in range(8):
                piece = self.get_square(row, col)
                if piece is None or piece.color != color:
                    continue

                captures = self.piece_captures(row, col)
                if captures:
                    has_capture = True
                    moves.extend(captures)

        if has_capture:
            best = max(len(move["captured"]) for move in moves)
            return [move for move in moves if len(move["captured"]) == best]

        for row in range(8):
            for col in range(8):
                piece = self.get_square(row, col)
                if piece is None or piece.color != color:
                    continue

                for landing in self.normal_moves(row, col):
                    moves.append({
                        "start": (row, col),
                        "landing": landing,
                        "captured": [],
                        "path": [(row, col), landing]
                    })

        return moves

    def apply_move(self, move):
        board = self.clone()

        current_row, current_col = move["start"]
        landing_row, landing_col = move["landing"]

        piece = board.grid[current_row][current_col]
        board.grid[current_row][current_col] = None

        for enemy_row, enemy_col in move["captured"]:
            board.grid[enemy_row][enemy_col] = None

        board.grid[landing_row][landing_col] = piece

        board.promote(piece, landing_row)
        board.promote_last_piece()

        board._bump_version()
        return board

    def evaluate(self):
        score = 0
        for row_index, row in enumerate(self.grid):
            for col_index, square in enumerate(row):
                if square is None:
                    continue

                center_bonus = (4 - abs(3.5 - col_index)) * 0.03

                if square.king:
                    value = 3.0 + center_bonus
                else:
                    value = 1.0 + center_bonus
                    if square.color == "white":
                        value += row_index * 0.08
                    else:
                        value += (7 - row_index) * 0.08

                if square.color == "white":
                    score += value
                else:
                    score -= value

        return score

    def hash(self):
        if self._hash_cache is not None:
            return self._hash_cache

        result = []
        for row in self.grid:
            for piece in row:
                if piece is None:
                    result.append(0)
                elif piece.color == "white":
                    result.append(2 if piece.king else 1)
                else:
                    result.append(-2 if piece.king else -1)

        self._hash_cache = tuple(result)
        return self._hash_cache