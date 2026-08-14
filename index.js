// 모바일 웹 화면 끌림 / 스크롤 완전 방지
document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

(() => {
  // ================= [Firebase 초기화 & Top 10 제어] =================
  const firebaseConfig = {
    apiKey: "AIzaSyACFXrDzGWmGCi84MIdoo_S4aLMWQX_brs",
    authDomain: "watermelon-game-3109f.firebaseapp.com",
    projectId: "watermelon-game-3109f",
    storageBucket: "watermelon-game-3109f.firebasestorage.app",
    messagingSenderId: "633308554874",
    appId: "1:633308554874:web:893dccbb17199bf6a17dc3"
  };

  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = (typeof firebase !== "undefined") ? firebase.firestore() : null;

  const rankModal = document.getElementById("leaderboardModal");
  const rankBtn = document.getElementById("rankToggleBtn");
  const closeBtn = document.getElementById("closeModalBtn");

  const nicknameModal = document.getElementById("nicknameModal");
  const nicknameInput = document.getElementById("nicknameInput");
  const submitScoreBtn = document.getElementById("submitScoreBtn");
  const finalScoreText = document.getElementById("finalScoreText");

  // Top 10 불러오기 함수
  function loadTopScores(callback) {
    if (!db) return;
    db.collection("scores")
      .orderBy("score", "desc")
      .limit(10)
      .get()
      .then((snapshot) => {
        const rankListEl = document.getElementById("rankList");
        if (rankListEl) {
          rankListEl.innerHTML = "";

          if (snapshot.empty) {
            rankListEl.innerHTML = "<li>기록 없음</li>";
          } else {
            snapshot.forEach((doc) => {
              const data = doc.data();
              const li = document.createElement("li");
              li.textContent = `${data.name || "익명"}: ${data.score}점`;
              rankListEl.appendChild(li);
            });
          }
        }

        if (callback) callback(snapshot);
      })
      .catch((err) => {
        console.error("랭킹 불러오기 실패:", err);
      });
  }

  // 점수 저장 함수
  function saveScore(nickname, currentScore) {
    if (!db) return;
    if (!nickname || nickname.trim() === "") {
      nickname = "익명";
    }

    db.collection("scores")
      .add({
        name: nickname.trim(),
        score: currentScore,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        alert("점수가 등록되었습니다!");
        if (nicknameModal) nicknameModal.style.display = "none";
        loadTopScores(() => {
          if (rankModal) rankModal.style.display = "flex";
        });
      })
      .catch((err) => {
        console.error("점수 등록 실패:", err);
        alert("점수 등록 중 오류가 발생했습니다.");
      });
  }

  // Top 10 팝업 버튼 처리
  if (rankBtn && rankModal) {
    rankBtn.addEventListener("click", () => {
      loadTopScores();
      rankModal.style.display = "flex";
    });
  }

  if (closeBtn && rankModal) {
    closeBtn.addEventListener("click", () => {
      rankModal.style.display = "none";
    });
  }

  if (rankModal) {
    rankModal.addEventListener("click", (e) => {
      if (e.target === rankModal) {
        rankModal.style.display = "none";
      }
    });
  }

  // 닉네임 제출 버튼 및 엔터 키 처리
  if (submitScoreBtn) {
    submitScoreBtn.addEventListener("click", () => {
      const val = nicknameInput ? nicknameInput.value : "";
      saveScore(val, score);
    });
  }

  if (nicknameInput) {
    nicknameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveScore(nicknameInput.value, score);
      }
    });
  }

  // =====================================================================

  const Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Composite = Matter.Composite;

  const parent = document.getElementById("game");
  const canvas = document.getElementById("canvas");
  var gameOverlayer = document.getElementById("overlay");
  const floor = document.getElementById("floor");

  const ctx = canvas.getContext("2d");

  const engine = Engine.create();

  const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: 480,
      height: 720,
      wireframes: false,
    },
  });

  const times = [];
  let fps = 100;

  let mousePos;
  let isClicking = false;
  let isMouseOver = false;
  let newSize = 1;
  let ball = null;

  let isGameOver = false;
  let score = 0;

  let isLineEnable = false;

  const background = Bodies.rectangle(240, 360, 480, 720, {
    isStatic: true,
    render: { fillStyle: "#fe9" },
  });
  background.collisionFilter = {
    group: 0,
    category: 1,
    mask: -2,
  };
  const ground = Bodies.rectangle(400, 1220, 810, 1000, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  const wallLeft = Bodies.rectangle(-50, 500, 100, 1000, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  const wallRight = Bodies.rectangle(530, 500, 100, 1000, {
    isStatic: true,
    render: { fillStyle: "transparent" },
  });
  World.add(engine.world, [wallLeft, wallRight, ground, background]);

  Engine.run(engine);
  Render.run(render);

  resize();

  refreshLoop();

  init();

  window.addEventListener("resize", resize);

  addEventListener("mousedown", () => {
    if (isGameOver) return;
    isClicking = isMouseOver;
  });

  addEventListener("touchstart", (e) => {
    if (isGameOver) return;
    isClicking = true;
    const rect = canvas.getBoundingClientRect();
    mousePos = (e.touches[0].clientX - rect.left) / parent.style.zoom;
  }, { passive: true });

  addEventListener("mouseup", () => {
    if (isGameOver) return;
    isClicking = false;
  });

  addEventListener("touchend", () => {
    if (isGameOver) return;
    isClicking = false;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = {
        group: 0,
        category: 1,
        mask: -1,
      };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);

      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  addEventListener("mousemove", (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    mousePos = (e.clientX - rect.left) / parent.style.zoom;
  });

  addEventListener("touchmove", (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    mousePos = (e.touches[0].clientX - rect.left) / parent.style.zoom;
  }, { passive: true });

  addEventListener("click", () => {
    if (isGameOver || !isMouseOver) return;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = {
        group: 0,
        category: 1,
        mask: -1,
      };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);

      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  canvas.addEventListener("mouseover", () => {
    isMouseOver = true;
  });

  canvas.addEventListener("mouseout", () => {
    isMouseOver = false;
  });

  Events.on(engine, "beforeUpdate", () => {
    if (isGameOver) return;

    if (ball != null) {
      const gravity = engine.world.gravity;
      Body.applyForce(ball, ball.position, {
        x: -gravity.x * gravity.scale * ball.mass,
        y: -gravity.y * gravity.scale * ball.mass,
      });

      if (isClicking && mousePos !== undefined) {
        ball.position.x = mousePos;

        if (mousePos > 455) ball.position.x = 455;
        else if (mousePos < 25) ball.position.x = 25;
      }

      ball.position.y = 50;
    }

    isLineEnable = false;
    const bodies = Composite.allBodies(engine.world);
    for (let i = 4; i < bodies.length; i++) {
      let currentBody = bodies[i];

      if (currentBody.position.y < 100) {
        if (
          currentBody !== ball &&
          Math.abs(currentBody.velocity.x) < 0.2 &&
          Math.abs(currentBody.velocity.y) < 0.2
        ) {
          gameOver();
        }
      } else if (currentBody.position.y < 150) {
        if (
          currentBody !== ball &&
          Math.abs(currentBody.velocity.x) < 0.5 &&
          Math.abs(currentBody.velocity.y) < 0.5
        ) {
          isLineEnable = true;
        }
      }
    }
  });

  Events.on(engine, "collisionActive", collisionEvent);
  Events.on(engine, "collisionStart", collisionEvent);

  function collisionEvent(e) {
    if (isGameOver) return;

    e.pairs.forEach((collision) => {
      let bodies = [collision.bodyA, collision.bodyB];

      if (bodies[0].size === undefined || bodies[1].size === undefined) return;

      if (bodies[0].size === bodies[1].size) {
        let allBodies = Composite.allBodies(engine.world);
        if (allBodies.includes(bodies[0]) && allBodies.includes(bodies[1])) {
          if (
            (Date.now() - bodies[0].createdAt < 100 ||
              Date.now() - bodies[1].createdAt < 100) &&
            bodies[0].createdAt != 0 &&
            bodies[1].createdAt != 0
          ) {
            return;
          }

          World.remove(engine.world, bodies[0]);
          World.remove(engine.world, bodies[1]);

          // 맥스레벨 14 유지 처리
          const nextSize = bodies[0].size >= 14 ? 14 : bodies[0].size + 1;

          World.add(
            engine.world,
            newBall(
              (bodies[0].position.x + bodies[1].position.x) / 2,
              (bodies[0].position.y + bodies[1].position.y) / 2,
              nextSize
            )
          );

          score += bodies[0].size;

          var audio = new Audio("assets/pop.wav");
          audio.play().catch(() => {});
        }
      }
    });
  }

  Events.on(render, "afterRender", () => {
    if (isGameOver) {
      ctx.fillStyle = "#ffffff55";
      ctx.fillRect(0, 0, 480, 720);

      writeText("Game Over", "center", 240, 280, 50);
      writeText("Score: " + score, "center", 240, 320, 30);
    } else {
      writeText(score, "start", 25, 60, 40);

      if (isLineEnable) {
        ctx.strokeStyle = "#f55";
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(480, 100);
        ctx.stroke();
      }
    }
  });

  function writeText(text, textAlign, x, y, size) {
    ctx.font = `${size}px NanumSquare`;
    ctx.textAlign = textAlign;
    ctx.lineWidth = size / 8;

    ctx.strokeStyle = "#000";
    ctx.strokeText(text, x, y);

    ctx.fillStyle = "#fff";
    ctx.fillText(text, x, y);
  }

  function resize() {
    canvas.height = 720;
    canvas.width = 480;

    // 화면 비율에 맞춘 깔끔한 줌 스케일링 계산 (상단 짤림 방지)
    const availableHeight = window.innerHeight - 60; // 바닥 패널 여유 공간 확보
    const scaleX = window.innerWidth / 480;
    const scaleY = availableHeight / 720;
    
    let zoom = Math.min(scaleX, scaleY);
    if (zoom > 1.2) zoom = 1.2; // 너무 커지는 것 방지용 제한

    parent.style.zoom = zoom;
    parent.style.top = "0px";

    Render.setPixelRatio(render, zoom * 2);
  }

  function refreshLoop() {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      refreshLoop();
    });
  }

  function init() {
    isGameOver = false;
    ball = null;
    engine.timing.timeScale = 1;
    score = 0;

    gameOverlayer.style.display = "none";

    while (engine.world.bodies.length > 4) {
      engine.world.bodies.pop();
    }

    createNewBall(1);
  }

  // ===== 게임 오버 처리 & Top 10 진입 여부 판별 =====
  function gameOver() {
    if (isGameOver) return;
    
    isGameOver = true;
    engine.timing.timeScale = 0;

    gameOverlayer.style.display = "flex";

    if (ball != null) World.remove(engine.world, ball);

    if (!db) return;
    loadTopScores((snapshot) => {
      let isTop10 = false;

      if (!snapshot || snapshot.docs.length < 10) {
        isTop10 = true;
      } else {
        const tenthScore = snapshot.docs[snapshot.docs.length - 1].data().score || 0;
        if (score > tenthScore) {
          isTop10 = true;
        }
      }

      setTimeout(() => {
        if (isTop10) {
          if (finalScoreText) finalScoreText.textContent = `최종 점수: ${score}점`;
          if (nicknameInput) nicknameInput.value = "";
          if (nicknameModal) nicknameModal.style.display = "flex";
        } else {
          if (rankModal) rankModal.style.display = "flex";
        }
      }, 300);
    });
  }

  function createNewBall(size) {
    ball = newBall(render.options.width / 2, 50, size);
    ball.collisionFilter = {
      group: -1,
      category: 2,
      mask: 0,
    };

    World.add(engine.world, ball);
  }

  function newBall(x, y, size) {
    let ballBody = Bodies.circle(x, y, size * 10, {
      render: {
        sprite: {
          texture: `assets/img/${size}.png`,
          xScale: size / 12.75,
          yScale: size / 12.75,
        },
      },
    });
    ballBody.size = size;
    ballBody.createdAt = Date.now();
    ballBody.restitution = 0.3;
    ballBody.friction = 0.1;

    return ballBody;
  }
})();