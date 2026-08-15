class Piece():
    def __init__(self, color, mode = "normal"):
        self.color = color
        self.king = False
        self.mode = mode
    
    def promote(self):
        if self.mode == "normal":
            self.king = True

    
    def clone(self):
        new_piece = Piece(self.color)
        new_piece.king = self.king
        return new_piece