from board import Board
from piece import Piece
from game_core import Game


class Tutorial:

    def __init__(self):

        self.game = Game()

        self.step = 0
        self.language = "en"

        self.steps = [
            self.setup_step,
            self.movement_step,
            self.king_movement_step,
            self.capture_step,
            self.mandatory_capture_step,
            self.multi_capture_step,
            self.king_capture_step,
            self.promotion_step,
            self.last_piece_standing_step,
            self.draw_step,
            self.summary_step,
        ]

        self.title = ""
        self.text = []
        self.highlight = []

        self.load()

    def is_last_step(self):
        return self.step == len(self.steps) - 1

    def next(self):
        if self.step < len(self.steps) - 1:
            self.step += 1
            self.load()

    def previous(self):
        if self.step > 0:
            self.step -= 1
            self.load()

    def set_language(self, language):
        if language not in ("en", "fa"):
            return
        if language == self.language:
            return
        self.language = language
        self.load()

    def toggle_language(self):
        self.set_language("fa" if self.language == "en" else "en")

    def load(self):
        self.game.restart()
        self.highlight = []
        self.steps[self.step]()

        if self.language == "fa":
            translation = PERSIAN_STEPS[self.step]
            self.title = translation["title"]
            self.text = translation["text"]

    def click(self, r, c):
        self.game.handle_click(r, c)

    def setup_step(self):
        self.game.board = Board()
        self.game.turn = "white"

        self.title = "Welcome to Dama"
        self.text = [
            "Each player starts with 16",
            "pieces, placed on all 64",
            "squares of the board.",
            "",
            "Unlike classic checkers,",
            "pieces move up, down, left",
            "or right — never diagonally.",
            "",
            "White always moves first.",
            "",
            "You win by capturing every",
            "enemy piece, or by trapping",
            "your opponent so they have",
            "no legal move left.",
            "",
            "Tap Next to learn how",
            "pieces move.",
        ]

    def movement_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        piece = Piece("white", "tutorial")
        board.grid[2][2] = piece

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(2, 2)]

        self.title = "Moving a Normal Piece"
        self.text = [
            "A normal piece moves one",
            "square at a time.",
            "",
            "It can move forward, or",
            "sideways (left / right) —",
            "but never backward, and",
            "never diagonally.",
            "",
            "Tap the glowing piece, then",
            "tap a highlighted square",
            "to move it.",
        ]

    def king_movement_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        king = Piece("white")
        king.promote()
        board.grid[4][4] = king

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(4, 4)]

        self.title = "Moving a King"
        self.text = [
            "A king can travel any number",
            "of empty squares in a single",
            "row or column — forward,",
            "backward, left or right.",
            "",
            "It still can never move",
            "diagonally.",
            "",
            "Tap the king, then tap any",
            "highlighted square to see",
            "how far it can travel.",
        ]

    def capture_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        board.grid[3][3] = Piece("white", "tutorial")
        board.grid[4][3] = Piece("black")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(3, 3)]

        self.title = "Capturing"
        self.text = [
            "Capture an enemy piece by",
            "jumping straight over it",
            "into the empty square",
            "right behind it.",
            "",
            "The jumped piece is",
            "removed from the board.",
            "",
            "Tap the white piece, then",
            "tap the highlighted square",
            "to jump over the black",
            "piece.",
        ]

    def mandatory_capture_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        board.grid[2][2] = Piece("white")
        board.grid[3][2] = Piece("black")

        board.grid[2][5] = Piece("white")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(2, 2)]

        self.title = "Capturing Is Mandatory"
        self.text = [
            "If any of your pieces can",
            "capture, you must play a",
            "capturing move that turn —",
            "you can't move another",
            "piece instead.",
            "",
            "Try tapping the piece on",
            "the right first: notice it",
            "has no moves available.",
            "",
            "Now tap the glowing piece",
            "and jump over the black",
            "piece to continue.",
        ]

    def multi_capture_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        board.grid[1][3] = Piece("white", "tutorial")
        board.grid[2][3] = Piece("black")
        board.grid[4][3] = Piece("black")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(1, 3)]

        self.title = "Chaining Captures"
        self.text = [
            "If landing after a jump puts",
            "you next to another enemy",
            "piece, you must keep",
            "capturing in the same turn.",
            "",
            "Tap the white piece, then",
            "tap the far highlighted",
            "square to capture both",
            "black pieces in one move.",
        ]

    def king_capture_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        king = Piece("white")
        king.promote()
        board.grid[4][1] = king

        board.grid[4][4] = Piece("black")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(4, 1)]

        self.title = "King Captures From Afar"
        self.text = [
            "A king can capture an enemy",
            "piece from any distance along",
            "a row or column — it doesn't",
            "need to be right next to it.",
            "",
            "After the jump, a king may",
            "land on any empty square",
            "past the captured piece.",
            "",
            "Tap the king, then choose",
            "where to land.",
            "",
            "(If different jump routes ever",
            "lead to the same square, you'll",
            "be asked to pick which one.)",
        ]

    def promotion_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        board.grid[6][4] = Piece("white")
        board.grid[2][1] = Piece("white")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(6, 4)]

        self.title = "Promotion"
        self.text = [
            "When a normal piece reaches",
            "the far edge of the board —",
            "the side opposite where it",
            "started — it automatically",
            "becomes a king.",
            "",
            "No extra tap is needed.",
            "",
            "Move the glowing piece",
            "forward until it promotes.",
        ]

    def last_piece_standing_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        board.grid[2][2] = Piece("white")
        board.grid[3][4] = Piece("white")

        board.grid[3][2] = Piece("black")
        board.grid[5][2] = Piece("black")

        board.grid[5][5] = Piece("black")

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(2, 2)]

        self.title = "Last Piece Standing"
        self.text = [
            "If a color has only one piece",
            "left anywhere on the board,",
            "it is instantly promoted to",
            "a king — even if it never",
            "reached the far edge.",
            "",
            "Tap the glowing piece and",
            "capture the two black pieces",
            "in its path.",
            "",
            "Watch the one remaining",
            "black piece become a king.",
        ]

    def draw_step(self):
        board = Board()
        board.grid = [[None] * 8 for _ in range(8)]

        king = Piece("white")
        king.promote()
        board.grid[3][3] = king

        bking = Piece("black")
        bking.promote()
        board.grid[6][6] = bking

        self.game.board = board
        self.game.turn = "white"

        self.highlight = [(3, 3), (6, 6)]

        self.title = "The Only Draw"
        self.text = [
            "If only two kings remain —",
            "one white, one black — and",
            "neither can capture the",
            "other, the game ends in",
            "a draw.",
            "",
            "This is the only way a",
            "Dama match can end tied.",
            "",
            "Tap Next to finish the",
            "tutorial.",
        ]

    def summary_step(self):
        self.game.board = Board()
        self.game.turn = "white"

        self.title = "You're Ready to Play!"
        self.text = [
            "Quick recap:",
            "",
            "- Tap a piece, then tap a",
            "  highlighted square to move.",
            "- Capturing is mandatory",
            "  whenever it's available.",
            "- Kings move and capture any",
            "  distance, in straight lines.",
            "- Undo and Restart are always",
            "  available during a game.",
            "",
            "Tap Next to return to the",
            "menu and start playing!",
        ]

    def update(self, dt):
        self.game.update(dt)


PERSIAN_STEPS = [

    {
        "title": "خوش‌آمدید به داما",
        "text": [
            "هر بازیکن با ۱۶ مهره شروع می‌کند",
            "که روی هر ۶۴ خانه‌ی صفحه چیده",
            "شده‌اند.",
            "",
            "برخلاف چکرز کلاسیک، مهره‌ها بالا،",
            "پایین، چپ یا راست حرکت می‌کنند —",
            "هرگز به‌صورت مورب.",
            "",
            "سفید همیشه اول حرکت می‌کند.",
            "",
            "برای برد باید تمام مهره‌های حریف",
            "را بگیرید، یا او را طوری گیر",
            "بیندازید که هیچ حرکت قانونی",
            "نداشته باشد.",
            "",
            "برای یادگیری نحوه‌ی حرکت مهره‌ها",
            "روی «بعدی» بزنید.",
        ],
    },

    {
        "title": "حرکت مهره‌ی معمولی",
        "text": [
            "یک مهره‌ی معمولی هر بار یک خانه",
            "حرکت می‌کند.",
            "",
            "می‌تواند به جلو یا به پهلو (چپ /",
            "راست) حرکت کند — اما هرگز به",
            "عقب، و هرگز به‌صورت مورب.",
            "",
            "روی مهره‌ی درخشان بزنید، سپس روی",
            "یک خانه‌ی هایلایت‌شده بزنید تا",
            "حرکت کند.",
        ],
    },

    {
        "title": "حرکت شاه",
        "text": [
            "یک شاه می‌تواند در یک حرکت، هر",
            "تعداد خانه‌ی خالی را در یک سطر یا",
            "ستون طی کند — به جلو، عقب، چپ",
            "یا راست.",
            "",
            "او هم هرگز نمی‌تواند به‌صورت",
            "مورب حرکت کند.",
            "",
            "روی شاه بزنید، سپس روی هر خانه‌ی",
            "هایلایت‌شده بزنید تا ببینید چقدر",
            "می‌تواند برود.",
        ],
    },

    {
        "title": "گرفتن مهره",
        "text": [
            "برای گرفتن یک مهره‌ی حریف، درست",
            "از روی آن بپرید و در خانه‌ی خالیِ",
            "پشت آن فرود بیایید.",
            "",
            "مهره‌ی پریده‌شده از صفحه حذف",
            "می‌شود.",
            "",
            "روی مهره‌ی سفید بزنید، سپس روی",
            "خانه‌ی هایلایت‌شده بزنید تا از روی",
            "مهره‌ی سیاه بپرید.",
        ],
    },

    {
        "title": "گرفتن مهره اجباری است",
        "text": [
            "اگر هر یک از مهره‌های شما بتواند",
            "مهره‌ای بگیرد، باید همان نوبت",
            "حرکتِ گرفتن را انجام دهید —",
            "نمی‌توانید مهره‌ی دیگری را حرکت",
            "دهید.",
            "",
            "اول روی مهره‌ی سمت راست بزنید:",
            "ببینید که هیچ حرکتی در دسترس",
            "ندارد.",
            "",
            "حالا روی مهره‌ی درخشان بزنید و از",
            "روی مهره‌ی سیاه بپرید تا ادامه",
            "دهید.",
        ],
    },

    {
        "title": "زنجیره‌ی گرفتن‌ها",
        "text": [
            "اگر بعد از یک پرش، کنار مهره‌ی",
            "دیگری از حریف قرار بگیرید، باید",
            "در همان نوبت به گرفتن ادامه",
            "دهید.",
            "",
            "روی مهره‌ی سفید بزنید، سپس روی",
            "دورترین خانه‌ی هایلایت‌شده بزنید",
            "تا هر دو مهره‌ی سیاه را در یک",
            "حرکت بگیرید.",
        ],
    },

    {
        "title": "گرفتن مهره با شاه از فاصله‌ی دور",
        "text": [
            "یک شاه می‌تواند مهره‌ی حریف را از",
            "هر فاصله‌ای در یک سطر یا ستون",
            "بگیرد — لازم نیست درست کنارش",
            "باشد.",
            "",
            "بعد از پرش، شاه می‌تواند در هر",
            "خانه‌ی خالیِ پشت مهره‌ی گرفته‌شده",
            "فرود بیاید.",
            "",
            "روی شاه بزنید، سپس محل فرود را",
            "انتخاب کنید.",
            "",
            "(اگر چند مسیر پرش مختلف به یک",
            "خانه ختم شوند، از شما خواسته",
            "می‌شود یکی را انتخاب کنید.)",
        ],
    },

    {
        "title": "ترفیع",
        "text": [
            "وقتی یک مهره‌ی معمولی به لبه‌ی",
            "دور صفحه برسد — سمتی که مقابل",
            "نقطه‌ی شروعش است — به‌طور",
            "خودکار به شاه تبدیل می‌شود.",
            "",
            "نیازی به ضربه‌ی اضافه نیست.",
            "",
            "مهره‌ی درخشان را به جلو حرکت",
            "دهید تا ترفیع پیدا کند.",
        ],
    },

    {
        "title": "آخرین مهره‌ی باقی‌مانده",
        "text": [
            "اگر از یک رنگ فقط یک مهره در",
            "صفحه باقی بماند، بلافاصله به شاه",
            "ترفیع می‌یابد — حتی اگر هرگز به",
            "لبه‌ی دور نرسیده باشد.",
            "",
            "روی مهره‌ی درخشان بزنید و دو",
            "مهره‌ی سیاه را در مسیرش بگیرید.",
            "",
            "ببینید تنها مهره‌ی سیاه باقی‌مانده",
            "به شاه تبدیل می‌شود.",
        ],
    },

    {
        "title": "تنها حالت مساوی",
        "text": [
            "اگر فقط دو شاه باقی بمانند — یک",
            "سفید، یک سیاه — و هیچ‌کدام",
            "نتواند دیگری را بگیرد، بازی با",
            "نتیجه‌ی مساوی تمام می‌شود.",
            "",
            "این تنها راهی است که یک بازی",
            "داما می‌تواند مساوی شود.",
            "",
            "برای پایان آموزش روی «بعدی»",
            "بزنید.",
        ],
    },

    {
        "title": "آماده‌ی بازی هستید!",
        "text": [
            "مرور سریع:",
            "",
            "- روی یک مهره بزنید، سپس روی یک",
            "  خانه‌ی هایلایت‌شده بزنید تا",
            "  حرکت کند.",
            "- هر وقت گرفتن مهره ممکن باشد،",
            "  اجباری است.",
            "- شاه‌ها هر فاصله‌ای را در خطوط",
            "  مستقیم حرکت و گرفتن می‌کنند.",
            "- بازگشت و شروع دوباره همیشه در",
            "  طول بازی در دسترس‌اند.",
            "",
            "برای بازگشت به منو و شروع بازی،",
            "روی «بعدی» بزنید.",
        ],
    },
]
