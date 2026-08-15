// ============================================================
// renderer.js
// Pure Canvas2D renderer for DAMA.
// No pygame / pygbag rendering.
// ============================================================


// ============================================================
// COLORS
// ============================================================

const C = {
  bg_top: "#10131f",
  bg_bottom: "#090b12",

  panel_top: "#1e2538",
  panel_bottom: "#131826",
  panel_border: "#485470",

  gold: "#e8b860",
  gold_bright: "#fad080",
  gold_dim: "#9c7a40",

  text_light: "#f0f1f6",
  text_muted: "#969eb2",

  board_light: "#e7c89c",
  board_dark: "#68422a",
  board_border: "#e8b860",
  board_frame: "#0e1119",

  btn_top: "#2a324a",
  btn_bottom: "#1b2133",
  btn_border: "#4c5874",

  btn_hover_top: "#384360",
  btn_hover_bottom: "#232b41",
  btn_hover_border: "#e8b860",

  reset_top: "#a83636",
  reset_bottom: "#762020",
  reset_border: "#de786e",

  confirm_top: "#349e68",
  confirm_bottom: "#1e704a",
  confirm_border: "#78e0a8",

  move_dot: "#e8b860",
  move_dot_ring: "#ffe0a0",

  preview_dot: "#60dc94",
  capture_dot: "#e86060",

  select_ring: "#ffe082",

  white_ring: "#c9c5b9",
  black_ring: "#666b73"
};


// ============================================================
// ASSETS
// ============================================================

const images = {
  crown: new Image(),

  mainMenu: new Image(),
  undo: new Image(),
  restart: new Image(),
  separator: new Image(),

  whitePiece: new Image(),
  blackPiece: new Image(),

  whiteKing: new Image(),
  blackKing: new Image()
};


const assetPaths = {
  crown: "data/crown.png",

  mainMenu: "data/main_menu.png",
  undo: "data/undo.png",
  restart: "data/restart.png",
  separator: "data/seperator.png",

  whitePiece: "data/white_peice2.png",
  blackPiece: "data/black_peice2.png",

  whiteKing: "data/white_king.png",
  blackKing: "data/black_king.png"
};


for (const [name, path] of Object.entries(assetPaths)) {

  images[name].src = path;

  images[name].onerror = () => {

    console.error(
      `DAMA asset could not be loaded: ${path}`
    );

  };
}


// ============================================================
// HELPERS
// ============================================================

function lerp(a, b, t) {
  return a + (b - a) * t;
}


function clamp01(v) {

  return Math.max(
    0,
    Math.min(
      1,
      Number(v) || 0
    )
  );

}


function easeInOut(t) {

  t = clamp01(t);

  return t * t * (3 - 2 * t);

}


function roundRect(
  ctx,
  x,
  y,
  w,
  h,
  r
) {

  r = Math.max(
    0,
    Math.min(
      r,
      w / 2,
      h / 2
    )
  );

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    r
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    r
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    r
  );

  ctx.closePath();
}


function pointIn(
  rect,
  x,
  y
) {

  if (!rect) {
    return false;
  }

  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );

}


function imageReady(image) {

  return (
    image &&
    image.complete &&
    image.naturalWidth > 0 &&
    image.naturalHeight > 0
  );

}


function drawImageContain(
  ctx,
  image,
  x,
  y,
  w,
  h
) {

  if (!imageReady(image)) {
    return;
  }

  const scale = Math.min(
    w / image.naturalWidth,
    h / image.naturalHeight
  );

  const dw =
    image.naturalWidth * scale;

  const dh =
    image.naturalHeight * scale;

  const dx =
    x + (w - dw) / 2;

  const dy =
    y + (h - dh) / 2;

  ctx.drawImage(
    image,
    dx,
    dy,
    dw,
    dh
  );
}


// ============================================================
// LAYOUT
// ============================================================

function computeLayout(w, h) {

  const isMobile =
    w < 800 ||
    h > w;


  // ==========================================================
  // MOBILE
  // ==========================================================

  if (isMobile) {

    /*
     * MOBILE LAYOUT
     *
     * The whole game section is intentionally pushed
     * slightly lower so that it does not stick to the
     * top of the phone screen.
     */

    const topBar = 84;

    const bottomArea = 175;

    const horizontalPad = 10;


    const availableWidth =
      w -
      horizontalPad * 2;


    const availableHeight =
      h -
      topBar -
      bottomArea -
      10;


    let square = Math.floor(
      Math.min(
        availableWidth,
        availableHeight
      ) / 8
    );


    square = Math.max(
      20,
      square
    );


    const boardSize =
      square * 8;


    const boardX =
      Math.floor(
        (w - boardSize) / 2
      );


    /*
     * IMPORTANT:
     *
     * Board moved down compared to previous version.
     */
    const boardY =
      topBar + 50;


    return {

      isMobile: true,

      w,
      h,

      topBar,
      bottomBar: bottomArea,

      pad: horizontalPad,

      square,
      boardSize,

      boardX,
      boardY,


      // ------------------------------------------------------
      // UNDO
      // ------------------------------------------------------

      undoBtn: {
        x: 10,
        y: 20,
        w: 72,
        h: 43
      },


      // ------------------------------------------------------
      // MENU
      // ------------------------------------------------------

      backBtn: {
        x: w - 82,
        y: 20,
        w: 72,
        h: 43
      },


      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      restartBtn: {
        x: 12,
        y: h - 59,
        w: w - 24,
        h: 40
      }
    };
  }


  // ==========================================================
  // DESKTOP
  // ==========================================================

  const leftWidth =
    Math.min(
      350,
      Math.max(
        300,
        w * 0.23
      )
    );


  const rightWidth =
    Math.min(
      350,
      Math.max(
        300,
        w * 0.23
      )
    );


  const centerWidth =
    w -
    leftWidth -
    rightWidth;


  const boardAvailableWidth =
    centerWidth - 30;


  const boardAvailableHeight =
    h - 70;


  let square = Math.floor(
    Math.min(
      boardAvailableWidth,
      boardAvailableHeight
    ) / 8
  );


  square = Math.max(
    30,
    square
  );


  const boardSize =
    square * 8;


  const boardX =
    leftWidth +
    Math.floor(
      (
        centerWidth -
        boardSize
      ) / 2
    );


  const boardY =
    Math.floor(
      (
        h -
        boardSize
      ) / 2
    );


  const buttonX = 50;

  const buttonW =
    leftWidth - 70;


  return {

    isMobile: false,

    w,
    h,

    topBar: 0,
    bottomBar: 0,

    pad: 24,

    leftWidth,
    rightWidth,
    centerWidth,

    square,
    boardSize,

    boardX,
    boardY,


    undoBtn: {
      x: buttonX,
      y: 240,
      w: buttonW,
      h: 106
    },


    restartBtn: {
      x: buttonX,
      y: 362,
      w: buttonW,
      h: 106
    },


    backBtn: {
      x: buttonX,
      y: h - 152,
      w: buttonW,
      h: 106
    }
  };
}


// ============================================================
// BOARD COORDINATES
// ============================================================

function boardToScreen(
  L,
  row,
  col,
  flipped
) {

  if (!flipped) {

    return [
      L.boardX +
        col * L.square,

      L.boardY +
        (7 - row) *
        L.square
    ];
  }


  return [
    L.boardX +
      (7 - col) *
      L.square,

    L.boardY +
      row * L.square
  ];
}


// ============================================================
// BACKGROUND
// ============================================================

function drawBackground(
  ctx,
  w,
  h
) {

  const grad =
    ctx.createLinearGradient(
      0,
      0,
      0,
      h
    );


  grad.addColorStop(
    0,
    C.bg_top
  );


  grad.addColorStop(
    1,
    C.bg_bottom
  );


  ctx.fillStyle =
    grad;


  ctx.fillRect(
    0,
    0,
    w,
    h
  );
}


// ============================================================
// BUTTON
// ============================================================

function drawButton(
  ctx,
  rect,
  label,
  hovered,
  colors,
  mobile
) {

  if (!rect) {
    return;
  }


  const {
    x,
    y,
    w,
    h
  } = rect;


  const top =
    hovered
      ? colors.hoverTop
      : colors.top;


  const bottom =
    hovered
      ? colors.hoverBottom
      : colors.bottom;


  const border =
    hovered
      ? colors.hoverBorder
      : colors.border;


  const grad =
    ctx.createLinearGradient(
      0,
      y,
      0,
      y + h
    );


  grad.addColorStop(
    0,
    top
  );


  grad.addColorStop(
    1,
    bottom
  );


  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    mobile ? 8 : 14
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    mobile
      ? 1.5
      : 2;


  ctx.strokeStyle =
    border;


  ctx.stroke();


  if (label) {

    ctx.save();

    ctx.fillStyle =
      C.text_light;

    ctx.font =
      mobile
        ? "bold 12px Arial, sans-serif"
        : "bold 28px Arial, sans-serif";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    ctx.fillText(
      label,
      x + w / 2,
      y + h / 2 + 1
    );


    ctx.restore();
  }
}


// ============================================================
// IMAGE BUTTON
// ============================================================

function drawImageButton(
  ctx,
  rect,
  image,
  label,
  hovered,
  colors,
  mobile
) {

  if (!rect) {
    return;
  }


  const {
    x,
    y,
    w,
    h
  } = rect;


  const top =
    hovered
      ? colors.hoverTop
      : colors.top;


  const bottom =
    hovered
      ? colors.hoverBottom
      : colors.bottom;


  const border =
    hovered
      ? colors.hoverBorder
      : colors.border;


  const grad =
    ctx.createLinearGradient(
      0,
      y,
      0,
      y + h
    );


  grad.addColorStop(
    0,
    top
  );


  grad.addColorStop(
    1,
    bottom
  );


  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    mobile ? 8 : 14
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    mobile
      ? 1.5
      : 2;


  ctx.strokeStyle =
    border;


  ctx.stroke();


  // ==========================================================
  // MOBILE
  // ==========================================================

  if (mobile) {

    /*
     * IMPORTANT:
     *
     * If there is NO text:
     *     icon is exactly centered.
     *
     * If there IS text:
     *     icon + text are treated as ONE GROUP
     *     and the entire group is centered.
     *
     * This fixes the Reset button.
     */

    const iconSize =
      Math.min(
        h * 0.58,
        24
      );


    const gap = 8;


    // --------------------------------------------------------
    // ICON ONLY
    // --------------------------------------------------------

    if (!label) {

      drawImageContain(
        ctx,
        image,

        x +
          (w - iconSize) / 2,

        y +
          (h - iconSize) / 2,

        iconSize,
        iconSize
      );


      return;
    }


    // --------------------------------------------------------
    // ICON + TEXT
    // --------------------------------------------------------

    ctx.save();


    ctx.font =
      "bold 14px Arial, sans-serif";


    const textWidth =
      ctx.measureText(
        label
      ).width;


    const groupWidth =
      iconSize +
      gap +
      textWidth;


    const groupX =
      x +
      (w - groupWidth) / 2;


    const centerY =
      y +
      h / 2;


    // Icon
    drawImageContain(
      ctx,
      image,

      groupX,

      centerY -
        iconSize / 2,

      iconSize,
      iconSize
    );


    // Text
    ctx.fillStyle =
      C.text_light;


    ctx.textAlign =
      "left";


    ctx.textBaseline =
      "middle";


    ctx.fillText(
      label,

      groupX +
        iconSize +
        gap,

      centerY + 1
    );


    ctx.restore();


    return;
  }


  // ==========================================================
  // DESKTOP
  // ==========================================================

  const iconSize =
    Math.min(
      42,
      h * 0.42
    );


  drawImageContain(
    ctx,
    image,

    x + 22,

    y +
      (h - iconSize) / 2,

    iconSize,
    iconSize
  );


  ctx.save();


  ctx.fillStyle =
    C.text_light;


  ctx.font =
    "bold 28px Arial, sans-serif";


  ctx.textAlign =
    "left";


  ctx.textBaseline =
    "middle";


  ctx.fillText(
    label || "",
    x + 80,
    y + h / 2
  );


  ctx.restore();
}


// ============================================================
// BOARD
// ============================================================

function drawBoard(
  ctx,
  L
) {

  ctx.save();


  roundRect(
    ctx,

    L.boardX - 8,
    L.boardY - 8,

    L.boardSize + 16,
    L.boardSize + 16,

    L.isMobile
      ? 10
      : 16
  );


  ctx.fillStyle =
    C.board_frame;


  ctx.fill();


  ctx.lineWidth =
    L.isMobile
      ? 2
      : 3;


  ctx.strokeStyle =
    C.board_border;


  ctx.stroke();


  for (
    let row = 0;
    row < 8;
    row++
  ) {

    for (
      let col = 0;
      col < 8;
      col++
    ) {

      const dark =
        (row + col) % 2 === 0;


      ctx.fillStyle =
        dark
          ? C.board_dark
          : C.board_light;


      ctx.fillRect(

        L.boardX +
          col * L.square,

        L.boardY +
          (7 - row) *
          L.square,

        L.square,
        L.square
      );
    }
  }


  ctx.restore();
}


// ============================================================
// PIECE IMAGE
// ============================================================

function getPieceImage(
  color,
  king
) {

  if (color === "white") {

    return king
      ? images.whiteKing
      : images.whitePiece;
  }


  return king
    ? images.blackKing
    : images.blackPiece;
}


function drawPieceImage(
  ctx,
  L,
  row,
  col,
  color,
  king,
  selected,
  flipped
) {

  const [
    x,
    y
  ] =
    boardToScreen(
      L,
      row,
      col,
      flipped
    );


  const image =
    getPieceImage(
      color,
      king
    );


  const padding =
    L.square *
    0.035;


  if (imageReady(image)) {

    ctx.save();


    ctx.shadowColor =
      "rgba(0,0,0,0.45)";


    ctx.shadowBlur =
      Math.max(
        2,
        L.square * 0.035
      );


    ctx.shadowOffsetY =
      Math.max(
        1,
        L.square * 0.02
      );


    drawImageContain(
      ctx,
      image,

      x + padding,
      y + padding,

      L.square -
        padding * 2,

      L.square -
        padding * 2
    );


    ctx.restore();
  }


  if (selected) {

    ctx.save();


    ctx.beginPath();


    ctx.arc(
      x + L.square / 2,
      y + L.square / 2,

      L.square *
        0.44,

      0,
      Math.PI * 2
    );


    ctx.lineWidth =
      Math.max(
        2,
        L.square * 0.025
      );


    ctx.strokeStyle =
      C.select_ring;


    ctx.stroke();


    ctx.restore();
  }
}


// ============================================================
// TUTORIAL HIGHLIGHTS
// ============================================================
// A soft pulsing gold ring drawn over the square(s) the current
// tutorial step wants the player to look at / tap first.

function drawTutorialHighlights(
  ctx,
  L,
  state
) {

  const cells =
    state.tutorial_highlight;

  if (
    !Array.isArray(cells) ||
    !cells.length
  ) {
    return;
  }

  const flipped =
    !!state.flipped;

  const pulse =
    0.5 +
    0.5 * Math.sin(Date.now() / 260);

  ctx.save();

  for (const cell of cells) {

    if (
      !Array.isArray(cell) ||
      cell.length !== 2
    ) {
      continue;
    }

    const [row, col] = cell;

    const [x, y] =
      boardToScreen(L, row, col, flipped);

    const cx = x + L.square / 2;
    const cy = y + L.square / 2;

    const radius =
      L.square * (0.46 + 0.06 * pulse);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    ctx.lineWidth =
      Math.max(2, L.square * 0.055);

    ctx.strokeStyle =
      C.gold_bright;

    ctx.globalAlpha =
      0.5 + 0.4 * pulse;

    ctx.shadowColor =
      C.gold_bright;

    ctx.shadowBlur =
      10 + 10 * pulse;

    ctx.stroke();
  }

  ctx.restore();
}


// ============================================================
// DRAW ALL PIECES + ANIMATION
// ============================================================

function drawPieces(
  ctx,
  L,
  state
) {

  const flipped =
    !!state.flipped;


  const anim =
    state.animation;


  let animFromCell =
    null;


  let hiddenCaptured =
    new Set();


  let animPos =
    null;


  let animColor =
    null;


  let animKing =
    false;


  // ==========================================================
  // PREPARE ANIMATION
  // ==========================================================

  if (anim) {

    animColor =
      anim.color;


    animKing =
      !!anim.king;


    const t =
      easeInOut(
        clamp01(
          anim.progress
        )
      );


    // --------------------------------------------------------
    // NORMAL MOVE
    // --------------------------------------------------------

    if (
      anim.type === "move" &&
      Array.isArray(anim.start) &&
      Array.isArray(anim.end)
    ) {

      animFromCell =
        anim.start.join(",");


      const [
        sx,
        sy
      ] =
        boardToScreen(
          L,
          anim.start[0],
          anim.start[1],
          flipped
        );


      const [
        ex,
        ey
      ] =
        boardToScreen(
          L,
          anim.end[0],
          anim.end[1],
          flipped
        );


      animPos = [

        lerp(
          sx,
          ex,
          t
        ) +
          L.square / 2,

        lerp(
          sy,
          ey,
          t
        ) +
          L.square / 2
      ];
    }


    // --------------------------------------------------------
    // CAPTURE
    // --------------------------------------------------------

    else if (
      anim.type === "capture" &&
      Array.isArray(anim.path) &&
      anim.path.length >= 2
    ) {

      animFromCell =
        anim.path[0].join(",");


      if (
        Array.isArray(
          anim.temp_removed
        )
      ) {

        for (
          const cell
          of anim.temp_removed
        ) {

          if (
            Array.isArray(cell)
          ) {

            hiddenCaptured.add(
              cell.join(",")
            );
          }
        }
      }


      let segment =
        Number(
          anim.segment
        ) || 0;


      segment =
        Math.max(
          0,
          Math.min(
            segment,
            anim.path.length - 2
          )
        );


      const p0 =
        anim.path[segment];


      const p1 =
        anim.path[
          segment + 1
        ];


      if (
        Array.isArray(p0) &&
        Array.isArray(p1)
      ) {

        const [
          sx,
          sy
        ] =
          boardToScreen(
            L,
            p0[0],
            p0[1],
            flipped
          );


        const [
          ex,
          ey
        ] =
          boardToScreen(
            L,
            p1[0],
            p1[1],
            flipped
          );


        animPos = [

          lerp(
            sx,
            ex,
            t
          ) +
            L.square / 2,

          lerp(
            sy,
            ey,
            t
          ) +
            L.square / 2
        ];
      }
    }
  }


  // ==========================================================
  // STATIC PIECES
  // ==========================================================

  const board =
    Array.isArray(state.board)
      ? state.board
      : [];


  for (
    let row = 0;
    row < 8;
    row++
  ) {

    for (
      let col = 0;
      col < 8;
      col++
    ) {

      const piece =
        board[row]?.[col];


      if (!piece) {
        continue;
      }


      const key =
        `${row},${col}`;


      if (
        animFromCell === key
      ) {
        continue;
      }


      if (
        hiddenCaptured.has(key)
      ) {
        continue;
      }


      const selected =
        Array.isArray(
          state.selected
        ) &&
        state.selected[0] === row &&
        state.selected[1] === col;


      drawPieceImage(
        ctx,
        L,
        row,
        col,
        piece.color,
        !!piece.king,
        selected,
        flipped
      );
    }
  }


  // ==========================================================
  // MOVING PIECE
  // ==========================================================

  if (
    anim &&
    animPos
  ) {

    const image =
      getPieceImage(
        animColor,
        animKing
      );


    const size =
      L.square *
      0.96;


    ctx.save();


    ctx.shadowColor =
      "rgba(0,0,0,0.55)";


    ctx.shadowBlur =
      Math.max(
        3,
        L.square * 0.05
      );


    ctx.shadowOffsetY =
      Math.max(
        1,
        L.square * 0.025
      );


    drawImageContain(
      ctx,
      image,

      animPos[0] -
        size / 2,

      animPos[1] -
        size / 2,

      size,
      size
    );


    ctx.restore();
  }
}


// ============================================================
// MOVE DOTS
// ============================================================

function drawMoveDots(
  ctx,
  L,
  moves,
  flipped
) {

  if (
    !Array.isArray(moves) ||
    !moves.length
  ) {
    return;
  }


  const r =
    L.square *
    0.13;


  for (
    const move
    of moves
  ) {

    if (
      !Array.isArray(move) ||
      move.length < 2
    ) {
      continue;
    }


    const [
      x,
      y
    ] =
      boardToScreen(
        L,
        move[0],
        move[1],
        flipped
      );


    const cx =
      x + L.square / 2;


    const cy =
      y + L.square / 2;


    ctx.beginPath();


    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );


    ctx.fillStyle =
      C.move_dot;


    ctx.fill();


    ctx.lineWidth =
      Math.max(
        1.5,
        L.square * 0.02
      );


    ctx.strokeStyle =
      C.move_dot_ring;


    ctx.stroke();
  }
}


// ============================================================
// PREVIEW PATH
// ============================================================

function drawPreviewPath(
  ctx,
  L,
  path,
  flipped
) {

  if (
    !Array.isArray(path) ||
    path.length < 2
  ) {
    return;
  }


  const r =
    L.square *
    0.16;


  for (
    const cell
    of path.slice(1)
  ) {

    if (
      !Array.isArray(cell)
    ) {
      continue;
    }


    const [
      x,
      y
    ] =
      boardToScreen(
        L,
        cell[0],
        cell[1],
        flipped
      );


    ctx.beginPath();


    ctx.arc(
      x + L.square / 2,
      y + L.square / 2,
      r,
      0,
      Math.PI * 2
    );


    ctx.fillStyle =
      C.preview_dot;


    ctx.fill();
  }
}


// ============================================================
// LOGO
// ============================================================

function drawLogo(
  ctx,
  L
) {

  const centerX =
    L.isMobile
      ? L.w / 2
      : L.leftWidth / 2;


  // ==========================================================
  // MOBILE
  // ==========================================================

  if (L.isMobile) {

    const crownSize = 29;


    drawImageContain(
      ctx,
      images.crown,

      centerX -
        crownSize / 2,

      11,

      crownSize,
      crownSize
    );


    ctx.save();


    ctx.textAlign =
      "center";


    ctx.textBaseline =
      "middle";


    ctx.fillStyle =
      C.gold_bright;


    ctx.font =
      "bold 19px Arial, sans-serif";


    ctx.fillText(
      "DAMA",
      centerX,
      59
    );


    ctx.restore();


    return;
  }


  // ==========================================================
  // DESKTOP
  // ==========================================================

  const crownSize =
    58;


  drawImageContain(
    ctx,
    images.crown,

    centerX -
      crownSize / 2,

    40,

    crownSize,
    crownSize
  );


  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.fillStyle =
    C.gold_bright;


  ctx.font =
    "bold 42px Arial, sans-serif";


  ctx.shadowColor =
    "rgba(232,184,96,0.25)";


  ctx.shadowBlur =
    5;


  ctx.fillText(
    "DAMA",
    centerX,
    132
  );


  ctx.restore();


  const separatorW =
    155;


  const separatorH =
    11;


  drawImageContain(
    ctx,
    images.separator,

    centerX -
      separatorW / 2,

    184,

    separatorW,
    separatorH
  );
}


// ============================================================
// TOP BAR
// ============================================================

function drawTopBar(
  ctx,
  L,
  state,
  mouse
) {

  drawLogo(
    ctx,
    L
  );


  // ==========================================================
  // MOBILE
  // ==========================================================

  if (L.isMobile) {

    const buttonColors = {
      top: C.btn_top,
      bottom: C.btn_bottom,
      border: C.btn_border,

      hoverTop: C.btn_hover_top,
      hoverBottom: C.btn_hover_bottom,
      hoverBorder: C.btn_hover_border
    };


    // Undo has no effect during the tutorial, so it's hidden
    // there instead of showing a dead button.
    if (
      state.screen !== "tutorial"
    ) {

      drawImageButton(
        ctx,
        L.undoBtn,
        images.undo,
        "",
        pointIn(
          L.undoBtn,
          mouse.x,
          mouse.y
        ),
        buttonColors,
        true
      );
    }


    drawImageButton(
      ctx,
      L.backBtn,
      images.mainMenu,
      "",
      pointIn(
        L.backBtn,
        mouse.x,
        mouse.y
      ),
      buttonColors,
      true
    );


    return;
  }


  // ==========================================================
  // DESKTOP
  // ==========================================================

  const buttonColors = {
    top: C.btn_top,
    bottom: C.btn_bottom,
    border: C.btn_border,

    hoverTop: C.btn_hover_top,
    hoverBottom: C.btn_hover_bottom,
    hoverBorder: C.btn_hover_border
  };


  const resetColors = {
    top: C.reset_top,
    bottom: C.reset_bottom,
    border: C.reset_border,

    hoverTop: "#b4453f",
    hoverBottom: "#812623",
    hoverBorder: "#f08a79"
  };


  // Undo/Reset have no effect during the tutorial, so they're
  // hidden there instead of showing dead buttons.
  if (
    state.screen !== "tutorial"
  ) {

    drawImageButton(
      ctx,
      L.undoBtn,
      images.undo,
      "Undo",
      pointIn(
        L.undoBtn,
        mouse.x,
        mouse.y
      ),
      buttonColors,
      false
    );


    drawImageButton(
      ctx,
      L.restartBtn,
      images.restart,
      "Reset",
      pointIn(
        L.restartBtn,
        mouse.x,
        mouse.y
      ),
      resetColors,
      false
    );
  }


  drawImageButton(
    ctx,
    L.backBtn,
    images.mainMenu,
    "Menu",
    pointIn(
      L.backBtn,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    false
  );
}


// ============================================================
// MOBILE SCORE
// ============================================================

function drawMobileScore(
  ctx,
  rect,
  name,
  score,
  image
) {

  roundRect(
    ctx,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    7
  );


  const grad =
    ctx.createLinearGradient(
      0,
      rect.y,
      0,
      rect.y + rect.h
    );


  grad.addColorStop(
    0,
    "#202637"
  );


  grad.addColorStop(
    1,
    "#151a27"
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    1.3;


  ctx.strokeStyle =
    "#52627f";


  ctx.stroke();


  const pieceSize =
    19;


  drawImageContain(
    ctx,
    image,

    rect.x + 7,
    rect.y + 8,

    pieceSize,
    pieceSize
  );


  ctx.save();


  ctx.textBaseline =
    "middle";


  ctx.textAlign =
    "left";


  ctx.font =
    "11px Arial, sans-serif";


  ctx.fillStyle =
    C.text_light;


  ctx.fillText(
    name,
    rect.x + 31,
    rect.y +
      rect.h / 2
  );


  ctx.textAlign =
    "right";


  ctx.font =
    "bold 11px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    String(score),
    rect.x +
      rect.w -
      8,
    rect.y +
      rect.h / 2
  );


  ctx.restore();
}


// ============================================================
// MOBILE BOTTOM
// ============================================================

function drawMobileBottom(
  ctx,
  L,
  state,
  mouse,
  hitTargets
) {

  const boardBottom =
    L.boardY +
    L.boardSize;


  // ==========================================================
  // TURN TITLE
  // ==========================================================

  const turnTitleY =
    boardBottom + 28;


  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "bold 11px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    "TURN",
    L.w / 2,
    turnTitleY
  );


  ctx.restore();


  // ==========================================================
  // TURN BOX
  // ==========================================================

  const turnBox = {

    x:
      L.w / 2 - 94,

    y:
      boardBottom + 39,

    w:
      188,

    h:
      35
  };


  roundRect(
    ctx,
    turnBox.x,
    turnBox.y,
    turnBox.w,
    turnBox.h,
    8
  );


  ctx.fillStyle =
    "#151a27";


  ctx.fill();


  ctx.lineWidth =
    1.7;


  ctx.strokeStyle =
    C.gold_dim;


  ctx.stroke();


  const turnImage =
    state.turn === "white"
      ? images.whitePiece
      : images.blackPiece;


  const pieceSize =
    20;


  drawImageContain(
    ctx,
    turnImage,

    turnBox.x + 8,
    turnBox.y + 7,

    pieceSize,
    pieceSize
  );


  ctx.save();


  ctx.textAlign =
    "left";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "11px Arial, sans-serif";


  ctx.fillStyle =
    C.text_light;


  const turnText =
    state.ai_thinking
      ? "AI thinking..."
      : (
          state.turn === "white"
            ? "White to move"
            : "Black to move"
        );


  ctx.fillText(
    turnText,

    turnBox.x + 36,

    turnBox.y +
      turnBox.h / 2
  );


  ctx.restore();


  // ==========================================================
  // SCORES TITLE
  // ==========================================================

  const scoresTitleY =
    turnBox.y +
    turnBox.h +
    16;


  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "bold 10px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    "SCORES",
    L.w / 2,
    scoresTitleY
  );


  ctx.restore();


  // ==========================================================
  // SCORE BOXES
  // ==========================================================

  const gap = 8;


  const scoreWidth =
    (
      L.w -
      36 -
      gap
    ) / 2;


  const scoreY =
    scoresTitleY + 10;


  const scoreH =
    36;


  drawMobileScore(
    ctx,

    {
      x: 18,
      y: scoreY,
      w: scoreWidth,
      h: scoreH
    },

    "White",

    state.white_count ?? 0,

    images.whitePiece
  );


  drawMobileScore(
    ctx,

    {
      x:
        18 +
        scoreWidth +
        gap,

      y: scoreY,

      w: scoreWidth,
      h: scoreH
    },

    "Black",

    state.black_count ?? 0,

    images.blackPiece
  );


  // ==========================================================
  // RESET
  // ==========================================================

  const resetRect = {

    x: 12,

    y:
      L.h - 59,

    w:
      L.w - 24,

    h:
      40
  };


  hitTargets.restartBtn =
    resetRect;


  drawImageButton(
    ctx,
    resetRect,
    images.restart,
    "Reset",
    pointIn(
      resetRect,
      mouse.x,
      mouse.y
    ),
    {
      top: C.reset_top,
      bottom: C.reset_bottom,
      border: C.reset_border,

      hoverTop: "#b4453f",
      hoverBottom: "#812623",
      hoverBorder: "#f08a79"
    },
    true
  );
}


// ============================================================
// DESKTOP INFO PANEL
// ============================================================

function drawPanel(
  ctx,
  rect
) {

  roundRect(
    ctx,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    11
  );


  const grad =
    ctx.createLinearGradient(
      0,
      rect.y,
      0,
      rect.y + rect.h
    );


  grad.addColorStop(
    0,
    "#202637"
  );


  grad.addColorStop(
    1,
    "#151a27"
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    2;


  ctx.strokeStyle =
    "#52627f";


  ctx.stroke();
}


function drawDesktopScore(
  ctx,
  rect,
  name,
  score,
  image
) {

  drawPanel(
    ctx,
    rect
  );


  const pieceSize =
    40;


  drawImageContain(
    ctx,
    image,

    rect.x + 11,
    rect.y +
      (rect.h - pieceSize) / 2,

    pieceSize,
    pieceSize
  );


  ctx.save();


  ctx.textBaseline =
    "middle";


  ctx.textAlign =
    "left";


  ctx.font =
    "28px Arial, sans-serif";


  ctx.fillStyle =
    C.text_light;


  ctx.fillText(
    name,
    rect.x + 64,
    rect.y +
      rect.h / 2
  );


  ctx.textAlign =
    "right";


  ctx.font =
    "bold 28px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    String(score),
    rect.x +
      rect.w -
      18,
    rect.y +
      rect.h / 2
  );


  ctx.restore();
}


function drawDesktopInfo(
  ctx,
  L,
  state
) {

  if (L.isMobile) {
    return;
  }


  const x =
    L.w -
    L.rightWidth +
    20;


  const width =
    L.rightWidth -
    50;


  // TURN

  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "bold 21px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    "TURN",
    x + width / 2,
    110
  );


  ctx.restore();


  // TURN BOX

  const turnBox = {
    x,
    y: 135,
    w: width,
    h: 96
  };


  drawPanel(
    ctx,
    turnBox
  );


  const turnImage =
    state.turn === "white"
      ? images.whitePiece
      : images.blackPiece;


  const pieceSize =
    44;


  drawImageContain(
    ctx,
    turnImage,

    turnBox.x + 11,
    turnBox.y +
      (turnBox.h - pieceSize) / 2,

    pieceSize,
    pieceSize
  );


  ctx.save();


  ctx.textAlign =
    "left";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "28px Arial, sans-serif";


  ctx.fillStyle =
    C.text_light;


  const turnText =
    state.ai_thinking
      ? "AI thinking..."
      : (
          state.turn === "white"
            ? "White to move"
            : "Black to move"
        );


  ctx.fillText(
    turnText,
    turnBox.x + 65,
    turnBox.y +
      turnBox.h / 2
  );


  ctx.restore();


  // SCORES TITLE

  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.font =
    "bold 21px Arial, sans-serif";


  ctx.fillStyle =
    C.gold_bright;


  ctx.fillText(
    "SCORES",
    x + width / 2,
    267
  );


  ctx.restore();


  drawDesktopScore(
    ctx,

    {
      x,
      y: 296,
      w: width,
      h: 82
    },

    "White",

    state.white_count ?? 0,

    images.whitePiece
  );


  drawDesktopScore(
    ctx,

    {
      x,
      y: 388,
      w: width,
      h: 82
    },

    "Black",

    state.black_count ?? 0,

    images.blackPiece
  );
}


// ============================================================
// PATH POPUP
// ============================================================

function drawPathPopup(
  ctx,
  L,
  state,
  mouse,
  hitTargets
) {

  const n =
    Number(
      state.path_options_count
    ) || 0;


  const hasPreview =
    !!state.preview_path;


  if (
    !n &&
    !hasPreview
  ) {
    return;
  }


  const optW =
    L.isMobile
      ? 160
      : 200;


  const optH =
    L.isMobile
      ? 36
      : 44;


  const popupW =
    optW + 30;


  const popupH =
    20 +
    Math.max(
      n,
      1
    ) *
      (optH + 8) +
    (
      hasPreview
        ? optH + 16
        : 10
    );


  const popupX =
    L.w / 2 -
    popupW / 2;


  const popupY =
    L.boardY +
    L.boardSize / 2 -
    popupH / 2;


  roundRect(
    ctx,
    popupX,
    popupY,
    popupW,
    popupH,
    10
  );


  const grad =
    ctx.createLinearGradient(
      0,
      popupY,
      0,
      popupY + popupH
    );


  grad.addColorStop(
    0,
    C.panel_top
  );


  grad.addColorStop(
    1,
    C.panel_bottom
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    2;


  ctx.strokeStyle =
    C.gold;


  ctx.stroke();


  ctx.font =
    L.isMobile
      ? "14px Arial, sans-serif"
      : "18px Arial, sans-serif";


  ctx.fillStyle =
    C.text_light;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  let y =
    popupY + 15;


  hitTargets.pathOptions =
    [];


  if (n) {

    for (
      let i = 0;
      i < n;
      i++
    ) {

      const rect = {

        x:
          popupX + 15,

        y,

        w:
          optW,

        h:
          optH
      };


      const hovered =
        pointIn(
          rect,
          mouse.x,
          mouse.y
        );


      roundRect(
        ctx,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        8
      );


      ctx.fillStyle =
        hovered
          ? C.btn_hover_top
          : C.btn_top;


      ctx.fill();


      ctx.strokeStyle =
        hovered
          ? C.gold
          : C.btn_border;


      ctx.lineWidth =
        1.5;


      ctx.stroke();


      ctx.fillStyle =
        C.text_light;


      ctx.fillText(
        `Path ${i + 1}`,
        rect.x +
          rect.w / 2,
        rect.y +
          rect.h / 2
      );


      hitTargets.pathOptions.push(
        rect
      );


      y +=
        optH + 8;
    }
  }


  if (hasPreview) {

    const btnW =
      (optW - 10) / 2;


    const cancelRect = {

      x:
        popupX + 15,

      y:
        y + 8,

      w:
        btnW,

      h:
        optH
    };


    const confirmRect = {

      x:
        popupX +
        15 +
        btnW +
        10,

      y:
        y + 8,

      w:
        btnW,

      h:
        optH
    };


    drawButton(
      ctx,
      cancelRect,
      "Cancel",
      pointIn(
        cancelRect,
        mouse.x,
        mouse.y
      ),
      {
        top: C.reset_top,
        bottom: C.reset_bottom,
        border: C.reset_border,

        hoverTop: "#b4453f",
        hoverBottom: "#812623",
        hoverBorder: "#f08a79"
      },
      L.isMobile
    );


    drawButton(
      ctx,
      confirmRect,
      "Confirm",
      pointIn(
        confirmRect,
        mouse.x,
        mouse.y
      ),
      {
        top: C.confirm_top,
        bottom: C.confirm_bottom,
        border: C.confirm_border,

        hoverTop: C.confirm_top,
        hoverBottom: C.confirm_bottom,
        hoverBorder: C.confirm_border
      },
      L.isMobile
    );


    hitTargets.cancelBtn =
      cancelRect;


    hitTargets.confirmBtn =
      confirmRect;
  }
}


// ============================================================
// GAME OVER
// ============================================================

function drawGameOver(
  ctx,
  L,
  winner
) {

  const text =
    winner === "draw"
      ? "DRAW"
      : `${String(winner || "").toUpperCase()} WINS`;


  ctx.save();


  ctx.font =
    `bold ${
      L.isMobile
        ? 24
        : 40
    }px Arial, sans-serif`;


  const tw =
    ctx.measureText(
      text
    ).width;


  const panelW =
    tw + 60;


  const panelH =
    L.isMobile
      ? 56
      : 80;


  const x =
    L.w / 2 -
    panelW / 2;


  const y =
    L.boardY +
    L.boardSize / 2 -
    panelH / 2;


  drawPanel(
    ctx,
    {
      x,
      y,
      w: panelW,
      h: panelH
    }
  );


  ctx.fillStyle =
    C.gold_bright;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.fillText(
    text,
    L.w / 2,
    y + panelH / 2
  );


  ctx.restore();
}


// ============================================================
// TEXT WRAP
// ============================================================

function wrapText(
  ctx,
  text,
  maxWidth
) {

  if (text === "") {
    return [""];
  }


  const words =
    String(text).split(" ");


  const lines = [];


  let current = "";


  for (
    const word
    of words
  ) {

    const test =
      (
        current +
        " " +
        word
      ).trim();


    if (
      ctx.measureText(
        test
      ).width <= maxWidth
    ) {

      current =
        test;

    } else {

      if (current) {
        lines.push(
          current
        );
      }

      current =
        word;
    }
  }


  if (current) {
    lines.push(
      current
    );
  }


  return lines;
}


// ============================================================
// TUTORIAL
// ============================================================

function drawTutorialPanel(
  ctx,
  L,
  state,
  mouse,
  hitTargets
) {

  // ------------------------------------------------------------
  // MOBILE: horizontal bar below the board, in the space that
  // would otherwise hold the game screen's bottom controls.
  //
  // DESKTOP: vertical panel in the right-hand column, next to
  // the board (mirrors where drawDesktopInfo lives on the
  // normal game screen).
  // ------------------------------------------------------------

  let x, y, w, panelH;

  if (L.isMobile) {

    const boardBottom =
      L.boardY +
      L.boardSize;

    x = L.pad;
    y = boardBottom + 14;
    w = L.w - L.pad * 2;
    panelH = L.h - y - 14;

  } else {

    x =
      L.w -
      L.rightWidth +
      20;

    y = 90;
    w = L.rightWidth - 50;
    panelH = L.h - y - 40;
  }


  roundRect(
    ctx,
    x,
    y,
    w,
    panelH,
    10
  );


  const grad =
    ctx.createLinearGradient(
      0,
      y,
      0,
      y + panelH
    );


  grad.addColorStop(
    0,
    C.panel_top
  );


  grad.addColorStop(
    1,
    C.panel_bottom
  );


  ctx.fillStyle =
    grad;


  ctx.fill();


  ctx.lineWidth =
    1.5;


  ctx.strokeStyle =
    C.panel_border;


  ctx.stroke();


  // ------------------------------------------------------------
  // LANGUAGE TOGGLE
  //
  // Sits in its own strip at the top of the panel so it never
  // collides with the title, whichever direction the title text
  // reads in.
  // ------------------------------------------------------------

  const isFa =
    state.tutorial_language === "fa";


  const langBtnW =
    L.isMobile
      ? 52
      : 62;


  const langBtnH =
    L.isMobile
      ? 20
      : 24;


  const langRect = {

    x:
      x +
      w -
      langBtnW -
      10,

    y:
      y + 6,

    w:
      langBtnW,

    h:
      langBtnH
  };


  drawButton(
    ctx,
    langRect,

    isFa
      ? "EN"
      : "فارسی",

    pointIn(
      langRect,
      mouse.x,
      mouse.y
    ),

    {
      top: C.btn_top,
      bottom: C.btn_bottom,
      border: C.btn_border,

      hoverTop: C.btn_hover_top,
      hoverBottom: C.btn_hover_bottom,
      hoverBorder: C.btn_hover_border
    },

    true
  );


  hitTargets.tutorialLang =
    langRect;


  const topReserve =
    langBtnH + 12;


  ctx.textAlign =
    isFa
      ? "right"
      : "left";


  ctx.direction =
    isFa
      ? "rtl"
      : "ltr";


  ctx.textBaseline =
    "top";


  ctx.font =
    `bold ${
      L.isMobile
        ? 15
        : 20
    }px Arial, sans-serif`;


  ctx.fillStyle =
    C.gold;


  ctx.fillText(
    state.tutorial_title || "",
    isFa
      ? x + w - 14
      : x + 14,
    y + 8 + topReserve
  );


  ctx.font =
    `${
      L.isMobile
        ? 11
        : 14
    }px Arial, sans-serif`;


  ctx.fillStyle =
    C.text_light;


  const textTop =
    y +
    topReserve +
    (
      L.isMobile
        ? 28
        : 36
    );


  const lineH =
    L.isMobile
      ? 13
      : 17;


  // Reserve room for the Prev/Next button row at the bottom of
  // the panel so wrapped text (which can run longer in Farsi)
  // never draws underneath the buttons.

  const bottomReserve =
    (
      L.isMobile
        ? 28
        : 34
    ) + 18;


  const textAreaHeight =
    Math.max(
      0,
      panelH -
        (textTop - y) -
        bottomReserve
    );


  // ------------------------------------------------------------
  // Wrap the FULL text (no truncation). On phones where the
  // panel is too short to fit everything, the excess becomes
  // scrollable instead of being cut off.
  // ------------------------------------------------------------

  const allLines = [];

  for (
    const line
    of (
      state.tutorial_text ||
      []
    )
  ) {

    for (
      const sub
      of wrapText(
        ctx,
        line,
        w - 28
      )
    ) {

      allLines.push(sub);
    }
  }


  const contentHeight =
    allLines.length * lineH;


  const maxScroll =
    Math.max(
      0,
      contentHeight - textAreaHeight
    );


  let scrollOffset =
    Number(
      mouse &&
      mouse.tutorialScroll
    ) || 0;


  scrollOffset =
    Math.max(
      0,
      Math.min(
        maxScroll,
        scrollOffset
      )
    );


  // Clip so text never draws over the buttons or panel edges,
  // then draw only the lines that fall inside the visible band.

  ctx.save();

  ctx.beginPath();

  ctx.rect(
    x + 2,
    textTop,
    w - 4,
    textAreaHeight
  );

  ctx.clip();


  let ty =
    textTop - scrollOffset;


  for (
    const sub
    of allLines
  ) {

    if (
      ty + lineH >= textTop &&
      ty <= textTop + textAreaHeight
    ) {

      ctx.fillText(
        sub,
        isFa
          ? x + w - 14
          : x + 14,
        ty
      );
    }


    ty += lineH;
  }


  ctx.restore();


  // ------------------------------------------------------------
  // Scrollbar + "more content" hint arrows, only shown when the
  // text doesn't fully fit.
  // ------------------------------------------------------------

  if (maxScroll > 0) {

    const trackX =
      x + w - 8;

    ctx.fillStyle =
      "rgba(255,255,255,0.10)";

    roundRect(
      ctx,
      trackX,
      textTop,
      4,
      textAreaHeight,
      2
    );

    ctx.fill();


    const thumbH =
      Math.max(
        18,
        textAreaHeight *
          (textAreaHeight / contentHeight)
      );

    const thumbY =
      textTop +
      (textAreaHeight - thumbH) *
        (scrollOffset / maxScroll);

    ctx.fillStyle =
      C.gold_dim;

    roundRect(
      ctx,
      trackX,
      thumbY,
      4,
      thumbH,
      2
    );

    ctx.fill();


    ctx.save();

    ctx.textAlign = "center";
    ctx.direction = "ltr";

    ctx.font =
      `${L.isMobile ? 10 : 12}px Arial, sans-serif`;

    ctx.fillStyle =
      C.gold_dim;

    if (scrollOffset > 2) {

      ctx.fillText(
        "▲",
        x + w / 2,
        textTop - 12
      );
    }

    if (scrollOffset < maxScroll - 2) {

      ctx.fillText(
        "▼",
        x + w / 2,
        textTop + textAreaHeight + 12
      );
    }

    ctx.restore();
  }


  hitTargets.tutorialTextArea = {
    x: x + 2,
    y: textTop,
    w: w - 4,
    h: textAreaHeight,
    maxScroll,
    contentHeight
  };


  // Text direction only applies to the title/body above; every
  // other draw call in this panel (buttons, etc.) should stay
  // left-to-right regardless of tutorial language.

  ctx.direction =
    "ltr";


  ctx.textAlign =
    "left";


  const btnW =
    L.isMobile
      ? 70
      : 100;


  const btnH =
    L.isMobile
      ? 28
      : 34;


  // In Persian (RTL) the natural reading order is mirrored, so
  // "Next" sits on the left and "Prev" on the right — otherwise
  // the buttons visually fight the right-aligned Farsi text.

  const nearX =
    x +
    w -
    btnW -
    14;


  const farX =
    x +
    w -
    btnW * 2 -
    26;


  const prevRect = {

    x:
      isFa
        ? nearX
        : farX,

    y:
      y +
      panelH -
      btnH -
      8,

    w:
      btnW,

    h:
      btnH
  };


  const nextRect = {

    x:
      isFa
        ? farX
        : nearX,

    y:
      y +
      panelH -
      btnH -
      8,

    w:
      btnW,

    h:
      btnH
  };


  drawButton(
    ctx,
    prevRect,

    isFa
      ? "قبلی"
      : "Prev",

    pointIn(
      prevRect,
      mouse.x,
      mouse.y
    ),
    {
      top: C.btn_top,
      bottom: C.btn_bottom,
      border: C.btn_border,

      hoverTop: C.btn_hover_top,
      hoverBottom: C.btn_hover_bottom,
      hoverBorder: C.btn_hover_border
    },
    L.isMobile
  );


  drawButton(
    ctx,
    nextRect,

    state.tutorial_is_last
      ? (isFa ? "پایان" : "Finish")
      : (isFa ? "بعدی" : "Next"),

    pointIn(
      nextRect,
      mouse.x,
      mouse.y
    ),

    {
      top: C.confirm_top,
      bottom: C.confirm_bottom,
      border: C.confirm_border,

      hoverTop: C.confirm_top,
      hoverBottom: C.confirm_bottom,
      hoverBorder: C.confirm_border
    },

    L.isMobile
  );


  hitTargets.tutorialPrev =
    prevRect;


  hitTargets.tutorialNext =
    nextRect;
}


// ============================================================
// MAIN MENU
// ============================================================

function drawMenuScreen(
  ctx,
  L,
  mouse,
  hitTargets
) {

  const centerX =
    L.w / 2;


  const crownSize =
    L.isMobile
      ? 58
      : 85;


  drawImageContain(
    ctx,
    images.crown,

    centerX -
      crownSize / 2,

    L.h * 0.16,

    crownSize,
    crownSize
  );


  ctx.save();


  ctx.fillStyle =
    C.gold_bright;


  ctx.font =
    `bold ${
      L.isMobile
        ? 38
        : 60
    }px Arial, sans-serif`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.fillText(
    "DAMA",
    centerX,
    L.h * 0.31
  );


  ctx.restore();


  const btnW =
    L.isMobile
      ? 220
      : 260;


  const btnH =
    L.isMobile
      ? 50
      : 66;


  const playRect = {

    x:
      centerX -
      btnW / 2,

    y:
      L.h * 0.44,

    w:
      btnW,

    h:
      btnH
  };


  const tutorialRect = {

    x:
      centerX -
      btnW / 2,

    y:
      L.h * 0.44 +
      btnH +
      20,

    w:
      btnW,

    h:
      btnH
  };


  const buttonColors = {

    top: C.btn_top,
    bottom: C.btn_bottom,
    border: C.btn_border,

    hoverTop: C.btn_hover_top,
    hoverBottom: C.btn_hover_bottom,
    hoverBorder: C.btn_hover_border
  };


  drawButton(
    ctx,
    playRect,
    "Play",
    pointIn(
      playRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  drawButton(
    ctx,
    tutorialRect,
    "Tutorial",
    pointIn(
      tutorialRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  hitTargets.playBtn =
    playRect;


  hitTargets.tutorialBtn =
    tutorialRect;
}


// ============================================================
// PLAY MENU
// ============================================================

function drawPlayMenuScreen(
  ctx,
  L,
  mouse,
  hitTargets
) {

  const centerX =
    L.w / 2;


  ctx.save();


  ctx.fillStyle =
    C.gold_bright;


  ctx.font =
    `bold ${
      L.isMobile
        ? 30
        : 46
    }px Arial, sans-serif`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.fillText(
    "DAMA",
    centerX,
    L.h * 0.22
  );


  ctx.restore();


  const btnW =
    L.isMobile
      ? 220
      : 260;


  const btnH =
    L.isMobile
      ? 50
      : 66;


  const pvpRect = {

    x:
      centerX -
      btnW / 2,

    y:
      L.h * 0.40,

    w:
      btnW,

    h:
      btnH
  };


  const botRect = {

    x:
      centerX -
      btnW / 2,

    y:
      L.h * 0.40 +
      btnH +
      20,

    w:
      btnW,

    h:
      btnH
  };


  const backRect = {

    x: 12,

    y: 12,

    w:
      L.isMobile
        ? 60
        : 90,

    h: 36
  };


  const buttonColors = {

    top: C.btn_top,
    bottom: C.btn_bottom,
    border: C.btn_border,

    hoverTop: C.btn_hover_top,
    hoverBottom: C.btn_hover_bottom,
    hoverBorder: C.btn_hover_border
  };


  drawButton(
    ctx,
    pvpRect,
    "PvP",
    pointIn(
      pvpRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  drawButton(
    ctx,
    botRect,
    "Bot",
    pointIn(
      botRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  drawButton(
    ctx,
    backRect,
    "Back",
    pointIn(
      backRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  hitTargets.pvpBtn =
    pvpRect;


  hitTargets.botBtn =
    botRect;


  hitTargets.backBtn =
    backRect;
}


// ============================================================
// BOT DIFFICULTY / PERSONA MENU
// ============================================================

function drawBotMenuScreen(
  ctx,
  L,
  mouse,
  hitTargets
) {

  const centerX =
    L.w / 2;


  ctx.save();


  ctx.fillStyle =
    C.gold_bright;


  ctx.font =
    `bold ${
      L.isMobile
        ? 24
        : 36
    }px Arial, sans-serif`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  ctx.fillText(
    "Choose Opponent",
    centerX,
    L.h * 0.13
  );


  ctx.restore();


  const options = [
    { key: "weak", label: "Dumb Bob" },
    { key: "aggressive", label: "Mad Bob" },
    { key: "defensive", label: "Stay-Back Bob" },
    { key: "expert", label: "Professor Bob" },
    { key: "trickster", label: "Sneaky Bob" }
  ];


  const btnW =
    L.isMobile
      ? 230
      : 280;


  const btnH =
    L.isMobile
      ? 44
      : 56;


  const gap =
    L.isMobile
      ? 12
      : 16;


  const startY =
    L.h * 0.22;


  const buttonColors = {

    top: C.btn_top,
    bottom: C.btn_bottom,
    border: C.btn_border,

    hoverTop: C.btn_hover_top,
    hoverBottom: C.btn_hover_bottom,
    hoverBorder: C.btn_hover_border
  };


  options.forEach(
    (opt, i) => {

      const rect = {

        x:
          centerX -
          btnW / 2,

        y:
          startY +
          i * (btnH + gap),

        w: btnW,
        h: btnH
      };


      drawButton(
        ctx,
        rect,
        opt.label,
        pointIn(
          rect,
          mouse.x,
          mouse.y
        ),
        buttonColors,
        L.isMobile
      );


      hitTargets[opt.key + "Btn"] =
        rect;
    }
  );


  const backRect = {

    x: 12,

    y: 12,

    w:
      L.isMobile
        ? 60
        : 90,

    h: 36
  };


  drawButton(
    ctx,
    backRect,
    "Back",
    pointIn(
      backRect,
      mouse.x,
      mouse.y
    ),
    buttonColors,
    L.isMobile
  );


  hitTargets.backBtn =
    backRect;
}


// ============================================================
// RENDER
// ============================================================

function render(
  ctx,
  w,
  h,
  state,
  mouse
) {

  drawBackground(
    ctx,
    w,
    h
  );


  const L =
    computeLayout(
      w,
      h
    );


  const hitTargets = {

    layout: L,

    playBtn: null,
    tutorialBtn: null,

    pvpBtn: null,
    botBtn: null,

    defensiveBtn: null,
    aggressiveBtn: null,
    expertBtn: null,
    weakBtn: null,
    tricksterBtn: null,

    backBtn: null,
    undoBtn: null,
    restartBtn: null,

    tutorialPrev: null,
    tutorialNext: null,
    tutorialLang: null,
    tutorialTextArea: null,

    confirmBtn: null,
    cancelBtn: null,

    pathOptions: [],

    boardHit: null
  };


  // ==========================================================
  // MENU
  // ==========================================================

  if (
    state.screen === "menu"
  ) {

    drawMenuScreen(
      ctx,
      L,
      mouse,
      hitTargets
    );


    return hitTargets;
  }


  // ==========================================================
  // PLAY MENU
  // ==========================================================

  if (
    state.screen === "play_menu"
  ) {

    drawPlayMenuScreen(
      ctx,
      L,
      mouse,
      hitTargets
    );


    return hitTargets;
  }


  // ==========================================================
  // BOT PERSONA MENU
  // ==========================================================

  if (
    state.screen === "bot_menu"
  ) {

    drawBotMenuScreen(
      ctx,
      L,
      mouse,
      hitTargets
    );


    return hitTargets;
  }


  // ==========================================================
  // GAME / TUTORIAL
  // ==========================================================

  hitTargets.backBtn =
    L.backBtn;


  hitTargets.undoBtn =
    L.undoBtn;


  drawTopBar(
    ctx,
    L,
    state,
    mouse
  );


  // ==========================================================
  // BOARD
  // ==========================================================

  drawBoard(
    ctx,
    L
  );


  // ==========================================================
  // PIECES
  // ==========================================================

  drawPieces(
    ctx,
    L,
    state
  );


  // ==========================================================
  // TUTORIAL HIGHLIGHTS
  // ==========================================================
  // Drawn right after the pieces so the glow sits on top of the
  // board/pieces but underneath move-dots and the text panel.

  if (
    state.screen === "tutorial"
  ) {

    drawTutorialHighlights(
      ctx,
      L,
      state
    );
  }


  // ==========================================================
  // NON-ANIMATED OVERLAYS
  // ==========================================================

  if (
    !state.animation
  ) {

    if (
      Array.isArray(
        state.moves
      ) &&
      state.moves.length
    ) {

      drawMoveDots(
        ctx,
        L,
        state.moves,
        !!state.flipped
      );
    }


    if (
      state.preview_path
    ) {

      drawPreviewPath(
        ctx,
        L,
        state.preview_path,
        !!state.flipped
      );
    }


    if (
      state.path_options_count ||
      state.preview_path
    ) {

      drawPathPopup(
        ctx,
        L,
        state,
        mouse,
        hitTargets
      );
    }


    if (
      state.game_over
    ) {

      drawGameOver(
        ctx,
        L,
        state.winner
      );
    }
  }


  // ==========================================================
  // TUTORIAL
  // ==========================================================
  // Drawn after the board/pieces/overlays so the panel and its
  // text always render on top, never hidden behind the board.

  if (
    state.screen === "tutorial"
  ) {

    drawTutorialPanel(
      ctx,
      L,
      state,
      mouse,
      hitTargets
    );
  }


  // ==========================================================
  // DESKTOP INFO
  // ==========================================================

  if (
    !L.isMobile &&
    state.screen === "game"
  ) {

    drawDesktopInfo(
      ctx,
      L,
      state
    );
  }


  // ==========================================================
  // MOBILE BOTTOM
  // ==========================================================

  if (
    L.isMobile &&
    state.screen === "game"
  ) {

    drawMobileBottom(
      ctx,
      L,
      state,
      mouse,
      hitTargets
    );
  }


  // ==========================================================
  // BOARD HIT TEST
  // ==========================================================

  hitTargets.boardHit =
    function (
      x,
      y
    ) {

      if (
        x < L.boardX ||
        y < L.boardY ||
        x >=
          L.boardX +
          L.boardSize ||
        y >=
          L.boardY +
          L.boardSize
      ) {

        return null;
      }


      const visualCol =
        Math.floor(
          (
            x -
            L.boardX
          ) /
          L.square
        );


      const visualRow =
        Math.floor(
          (
            y -
            L.boardY
          ) /
          L.square
        );


      if (
        visualCol < 0 ||
        visualCol > 7 ||
        visualRow < 0 ||
        visualRow > 7
      ) {

        return null;
      }


      if (
        !state.flipped
      ) {

        return [
          7 - visualRow,
          visualCol
        ];
      }


      return [
        visualRow,
        7 - visualCol
      ];
    };


  return hitTargets;
}


// ============================================================
// PUBLIC API
// ============================================================

window.DamaRenderer = {

  render,

  computeLayout,

  pointIn
};
