// main.js
// DAMA web entry point.
// Pyodide runs only the game logic.
// Canvas2D handles all rendering and input.

// ============================================================
// DOM
// ============================================================

const canvas =
  document.getElementById("game-canvas");

const ctx =
  canvas.getContext("2d", {
    alpha: false
  });

const statusEl =
  document.getElementById("status");

let bridge = null;

let mouse = {
  x: -1,
  y: -1
};

let hitTargets = {};

let lastState = null;

let lastTime =
  performance.now();

let bootFinished = false;

let lastTouchTime = 0;


// ============================================================
// TUTORIAL TEXT SCROLL STATE
// ============================================================

let tutorialScroll = 0;

let tutorialScrollKey = null;

let scrollDrag = null;


function clampTutorialScroll() {

  const area =
    hitTargets.tutorialTextArea;


  if (!area) {
    return;
  }


  const maxScroll =
    area.maxScroll || 0;


  tutorialScroll =
    Math.max(
      0,
      Math.min(
        maxScroll,
        tutorialScroll
      )
    );
}


// ============================================================
// VIEWPORT
// ============================================================

function getViewportSize() {

  // Telegram / mobile WebView can expose a
  // more accurate visible viewport through
  // visualViewport.

  if (window.visualViewport) {

    const width =
      Math.max(
        1,
        Math.round(
          window.visualViewport.width
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          window.visualViewport.height
        )
      );

    return {
      width,
      height
    };
  }


  return {
    width:
      Math.max(
        1,
        window.innerWidth
      ),

    height:
      Math.max(
        1,
        window.innerHeight
      )
  };
}


// ============================================================
// CANVAS / VIEWPORT
// ============================================================

function resizeCanvas() {

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  const viewport =
    getViewportSize();


  const w =
    viewport.width;


  const h =
    viewport.height;


  // ----------------------------------------------------------
  // Keep the canvas physically fixed to the visible viewport.
  // ----------------------------------------------------------

  canvas.style.position =
    "fixed";

  canvas.style.left =
    "0px";

  canvas.style.top =
    "0px";

  canvas.style.right =
    "auto";

  canvas.style.bottom =
    "auto";

  canvas.style.width =
    `${w}px`;

  canvas.style.height =
    `${h}px`;

  canvas.style.margin =
    "0";

  canvas.style.padding =
    "0";

  canvas.style.transform =
    "none";


  // ----------------------------------------------------------
  // Internal drawing buffer
  // ----------------------------------------------------------

  const pixelWidth =
    Math.max(
      1,
      Math.floor(
        w * dpr
      )
    );

  const pixelHeight =
    Math.max(
      1,
      Math.floor(
        h * dpr
      )
    );


  if (
    canvas.width !== pixelWidth ||
    canvas.height !== pixelHeight
  ) {

    canvas.width =
      pixelWidth;

    canvas.height =
      pixelHeight;
  }


  // ----------------------------------------------------------
  // Canvas coordinate system stays in CSS pixels.
  // ----------------------------------------------------------

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  // ----------------------------------------------------------
  // Re-render immediately after viewport changes.
  // ----------------------------------------------------------

  if (
    lastState &&
    window.DamaRenderer
  ) {

    mouse.tutorialScroll =
      tutorialScroll;


    hitTargets =
      window.DamaRenderer.render(
        ctx,
        w,
        h,
        lastState,
        mouse
      );


    clampTutorialScroll();
  }
}


// Normal browser resize
window.addEventListener(
  "resize",
  resizeCanvas,
  {
    passive: true
  }
);


// Telegram / mobile WebView viewport resize
if (window.visualViewport) {

  window.visualViewport.addEventListener(
    "resize",
    resizeCanvas,
    {
      passive: true
    }
  );

  window.visualViewport.addEventListener(
    "scroll",
    resizeCanvas,
    {
      passive: true
    }
  );
}


resizeCanvas();


// ============================================================
// POINTER COORDINATES
// ============================================================

function getEventPos(e) {

  const rect =
    canvas.getBoundingClientRect();


  let point =
    e;


  if (
    e.touches &&
    e.touches.length
  ) {

    point =
      e.touches[0];
  }


  if (
    e.changedTouches &&
    e.changedTouches.length
  ) {

    point =
      e.changedTouches[0];
  }


  return {

    x:
      point.clientX -
      rect.left,

    y:
      point.clientY -
      rect.top
  };
}


// ============================================================
// MOUSE / TOUCH HOVER
// ============================================================

canvas.addEventListener(
  "mousemove",
  (e) => {

    mouse =
      getEventPos(e);
  }
);


canvas.addEventListener(
  "mouseleave",
  () => {

    mouse = {
      x: -1,
      y: -1
    };
  }
);


canvas.addEventListener(
  "touchmove",
  (e) => {

    if (
      e.touches &&
      e.touches.length
    ) {

      const pos =
        getEventPos(e);


      mouse =
        pos;


      if (scrollDrag) {

        const delta =
          scrollDrag.startY - pos.y;


        if (Math.abs(delta) > 4) {

          scrollDrag.moved = true;
        }


        const maxScroll =
          scrollDrag.area.maxScroll || 0;


        tutorialScroll =
          Math.max(
            0,
            Math.min(
              maxScroll,
              scrollDrag.startScroll + delta
            )
          );
      }
    }
  },
  {
    passive: true
  }
);


// ============================================================
// WHEEL SCROLL (tutorial text panel)
// ============================================================

canvas.addEventListener(
  "wheel",
  (e) => {

    if (
      !lastState ||
      lastState.screen !== "tutorial"
    ) {
      return;
    }


    const area =
      hitTargets.tutorialTextArea;


    if (
      !area ||
      !(area.maxScroll > 0)
    ) {
      return;
    }


    if (
      !isInside(
        area,
        mouse.x,
        mouse.y
      )
    ) {
      return;
    }


    e.preventDefault();


    tutorialScroll =
      Math.max(
        0,
        Math.min(
          area.maxScroll,
          tutorialScroll + e.deltaY
        )
      );
  },
  {
    passive: false
  }
);


// ============================================================
// SAFE HIT TESTING
// ============================================================

function isInside(
  rect,
  x,
  y
) {

  if (
    !rect ||
    typeof rect.x !== "number" ||
    typeof rect.y !== "number" ||
    typeof rect.w !== "number" ||
    typeof rect.h !== "number"
  ) {

    return false;
  }


  return window.DamaRenderer.pointIn(
    rect,
    x,
    y
  );
}


// ============================================================
// POINTER HANDLER
// ============================================================

function handlePointer(pos) {

  if (!bridge) {
    return;
  }


  const state =
    lastState;


  if (!state) {
    return;
  }


  // ----------------------------------------------------------
  // Main menu
  // ----------------------------------------------------------

  if (
    state.screen === "menu"
  ) {

    if (
      isInside(
        hitTargets.playBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.goto_play_menu();

      return;
    }


    if (
      isInside(
        hitTargets.tutorialBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.start_tutorial();

      return;
    }


    return;
  }


  // ----------------------------------------------------------
  // Play menu
  // ----------------------------------------------------------

  if (
    state.screen === "play_menu"
  ) {

    if (
      isInside(
        hitTargets.pvpBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.start_game(
        "PVP"
      );

      return;
    }


    if (
      isInside(
        hitTargets.botBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.goto_bot_menu();

      return;
    }


    if (
      isInside(
        hitTargets.backBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.goto_menu();

      return;
    }


    return;
  }


  // ----------------------------------------------------------
  // Bot persona menu
  // ----------------------------------------------------------

  if (
    state.screen === "bot_menu"
  ) {

    const personas =
      [
        "defensive",
        "aggressive",
        "expert",
        "weak",
        "trickster"
      ];


    for (
      const persona
      of personas
    ) {

      if (
        isInside(
          hitTargets[persona + "Btn"],
          pos.x,
          pos.y
        )
      ) {

        bridge.start_game(
          "AI",
          persona
        );

        return;
      }
    }


    if (
      isInside(
        hitTargets.backBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.goto_play_menu();

      return;
    }


    return;
  }


  // ----------------------------------------------------------
  // Back button
  // ----------------------------------------------------------

  if (
    isInside(
      hitTargets.backBtn,
      pos.x,
      pos.y
    )
  ) {

    bridge.back_to_menu();

    return;
  }


  // ----------------------------------------------------------
  // Game buttons
  // ----------------------------------------------------------

  if (
    state.screen === "game"
  ) {

    if (
      isInside(
        hitTargets.undoBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.undo();

      return;
    }


    if (
      isInside(
        hitTargets.restartBtn,
        pos.x,
        pos.y
      )
    ) {

      bridge.restart();

      return;
    }
  }


  // ----------------------------------------------------------
  // Tutorial buttons
  // ----------------------------------------------------------

  if (
    state.screen === "tutorial"
  ) {

    if (
      isInside(
        hitTargets.tutorialLang,
        pos.x,
        pos.y
      )
    ) {

      bridge.toggle_tutorial_language();

      return;
    }


    if (
      isInside(
        hitTargets.tutorialPrev,
        pos.x,
        pos.y
      )
    ) {

      bridge.tutorial_prev();

      return;
    }


    if (
      isInside(
        hitTargets.tutorialNext,
        pos.x,
        pos.y
      )
    ) {

      bridge.tutorial_next();

      return;
    }
  }


  // ----------------------------------------------------------
  // Capture confirmation
  // ----------------------------------------------------------

  if (
    isInside(
      hitTargets.confirmBtn,
      pos.x,
      pos.y
    )
  ) {

    bridge.confirm_path();

    return;
  }


  if (
    isInside(
      hitTargets.cancelBtn,
      pos.x,
      pos.y
    )
  ) {

    bridge.cancel_path();

    return;
  }


  // ----------------------------------------------------------
  // Multiple capture paths
  // ----------------------------------------------------------

  if (
    Array.isArray(
      hitTargets.pathOptions
    ) &&
    hitTargets.pathOptions.length
  ) {

    for (
      let i = 0;
      i <
      hitTargets.pathOptions.length;
      i++
    ) {

      if (
        isInside(
          hitTargets.pathOptions[i],
          pos.x,
          pos.y
        )
      ) {

        bridge.select_path(i);

        return;
      }
    }


    // When path selector is open,
    // don't pass clicks to the board.

    return;
  }


  // ----------------------------------------------------------
  // Board
  // ----------------------------------------------------------

  if (
    typeof hitTargets.boardHit ===
    "function"
  ) {

    const cell =
      hitTargets.boardHit(
        pos.x,
        pos.y
      );


    if (
      cell &&
      cell.length === 2
    ) {

      bridge.handle_click(
        cell[0],
        cell[1]
      );
    }
  }
}


// ============================================================
// MOUSE CLICK
// ============================================================

canvas.addEventListener(
  "click",
  (e) => {

    // Prevent a mouse click generated immediately
    // after a touchend from executing twice.

    if (
      performance.now() -
      lastTouchTime <
      500
    ) {

      return;
    }


    handlePointer(
      getEventPos(e)
    );
  }
);


// ============================================================
// TOUCH
// ============================================================

canvas.addEventListener(
  "touchstart",
  (e) => {

    if (
      e.touches &&
      e.touches.length
    ) {

      const pos =
        getEventPos(e);


      mouse =
        pos;


      const area =
        hitTargets.tutorialTextArea;


      if (
        lastState &&
        lastState.screen === "tutorial" &&
        area &&
        area.maxScroll > 0 &&
        isInside(area, pos.x, pos.y)
      ) {

        scrollDrag = {
          startY: pos.y,
          startScroll: tutorialScroll,
          moved: false,
          area
        };

      } else {

        scrollDrag = null;
      }
    }
  },
  {
    passive: true
  }
);


canvas.addEventListener(
  "touchend",
  (e) => {

    e.preventDefault();


    lastTouchTime =
      performance.now();


    const pos =
      getEventPos(e);


    mouse =
      pos;


    const wasScrollDrag =
      !!(scrollDrag && scrollDrag.moved);


    scrollDrag =
      null;


    if (!wasScrollDrag) {

      handlePointer(pos);
    }
  },
  {
    passive: false
  }
);


// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener(
  "keydown",
  (e) => {

    if (!bridge) {
      return;
    }


    if (
      e.key === "Escape"
    ) {

      if (
        lastState?.screen ===
        "game"
      ) {

        bridge.back_to_menu();
      }


      return;
    }


    if (
      (
        e.key === "z" ||
        e.key === "Z"
      ) &&
      lastState?.screen ===
        "game"
    ) {

      bridge.undo();
    }


    if (
      lastState?.screen ===
      "tutorial"
    ) {

      const area =
        hitTargets.tutorialTextArea;


      if (area && area.maxScroll > 0) {

        let delta = 0;


        if (e.key === "ArrowDown") {
          delta = 40;
        } else if (e.key === "ArrowUp") {
          delta = -40;
        } else if (e.key === "PageDown") {
          delta = area.h;
        } else if (e.key === "PageUp") {
          delta = -area.h;
        }


        if (delta !== 0) {

          e.preventDefault();


          tutorialScroll =
            Math.max(
              0,
              Math.min(
                area.maxScroll,
                tutorialScroll + delta
              )
            );
        }
      }
    }
  }
);


// ============================================================
// MAIN RENDER LOOP
// ============================================================

function loop(now) {

  const dt =
    Math.min(
      (
        now -
        lastTime
      ) / 1000,
      0.05
    );


  lastTime =
    now;


  if (
    bridge &&
    bootFinished
  ) {

    try {

      bridge.update(dt);


      lastState =
        JSON.parse(
          bridge.get_state()
        );


      if (
        lastState.screen ===
        "tutorial"
      ) {

        const key =
          lastState.tutorial_step +
          ":" +
          lastState.tutorial_language;


        if (
          tutorialScrollKey !== key
        ) {

          tutorialScrollKey =
            key;

          tutorialScroll = 0;
        }

      } else {

        tutorialScrollKey =
          null;

        tutorialScroll = 0;
      }


      mouse.tutorialScroll =
        tutorialScroll;


      const viewport =
        getViewportSize();


      hitTargets =
        window.DamaRenderer.render(
          ctx,
          viewport.width,
          viewport.height,
          lastState,
          mouse
        );


      clampTutorialScroll();

    } catch (err) {

      console.error(
        "DAMA render/update error:",
        err
      );
    }
  }


  requestAnimationFrame(
    loop
  );
}


// ============================================================
// PYTHON / PYODIDE BOOT
// ============================================================

async function boot() {

  try {

    statusEl.textContent =
      "Loading Python runtime...";


    // Wait for renderer assets too.

    if (
      window.DamaRenderer &&
      window.DamaRenderer.assetsPromise
    ) {

      await window.DamaRenderer.assetsPromise;
    }


    statusEl.textContent =
      "Loading game logic...";


    const pyodide =
      await loadPyodide();


    const files = [

      "piece.py",
      "board.py",
      "ai.py",
      "ai_profiles.py",
      "game_core.py",
      "tutorial_core.py",
      "bridge.py"

    ];


    for (
      const file
      of files
    ) {

      const response =
        await fetch(
          `py/${file}`
        );


      if (!response.ok) {

        throw new Error(
          `Could not load py/${file}`
        );
      }


      const source =
        await response.text();


      pyodide.FS.writeFile(
        file,
        source
      );
    }


    statusEl.textContent =
      "Initializing game...";


    await pyodide.runPythonAsync(`
import sys
sys.path.insert(0, ".")
import bridge as _bridge_module
`);


    bridge =
      pyodide.globals.get(
        "_bridge_module"
      ).bridge;


    bootFinished =
      true;


    statusEl.style.display =
      "none";


    lastTime =
      performance.now();


    // Make absolutely sure the canvas
    // has the current Telegram viewport
    // before starting the game.

    resizeCanvas();


    requestAnimationFrame(
      loop
    );

  } catch (err) {

    console.error(
      "DAMA boot error:",
      err
    );


    statusEl.textContent =
      "Failed to load: " +
      (
        err?.message ||
        err
      );
  }
}


// ============================================================
// START
// ============================================================

boot();
