(() => {
  // ================= [Firebase 초기화] =================
  const firebaseConfig = {
    apiKey: "AIzaSyACFXrDzGWmGCi84MIdoo_S4aLMWQX_brs",
    authDomain: "watermelon-game-3109f.firebaseapp.com",
    projectId: "watermelon-game-3109f",
    storageBucket: "watermelon-game-3109f.firebasestorage.app",
    messagingSenderId: "633308554874",
    appId: "1:633308554874:web:893dccbb17199bf6a17dc3"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  let top3Scores = [];

  // Top 3 불러오기 함수
  function loadTopScores() {
    db.collection("scores")
      .orderBy("score", "desc")
      .limit(3)
      .get()
      .then((snapshot) => {
        top3Scores = [];
        const rankListEl = document.getElementById("rankList");
        rankListEl.innerHTML = "";

        if (snapshot.empty) {
          rankListEl.innerHTML = "<li>기록 없음</li>";
          return;
        }

        snapshot.forEach((doc) => {
          const data = doc.data();
          top3Scores.push(data);
          const li = document.createElement("li");
          li.textContent = `${data.name}: ${data.score}점`;
          rankListEl.appendChild(li);
        });
      })
      .catch((err) => {
        console.error("랭킹 불러오기 실패:", err);
      });
  }

  // 게임 시작 시 Top 3 불러오기
  loadTopScores();
  // =====================================================

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
    mousePos = e.touches[0].clientX / parent.style.zoom;
  });

  addEventListener("mouseup", () => {
    if (isGameOver) return;
    isClicking = false;
  });
  addEventListener("touchend", () => {
    if (isGameOver) return;
    isClicking = false;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = { group: 0, category: 1, mask: -1 };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);
      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  addEventListener("mousemove", (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    mousePos = e.clientX / parent.style.zoom - rect.left;
  });
  addEventListener("touchmove", (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    mousePos = e.touches[0].clientX / parent.style.zoom - rect.left;
  });

  addEventListener("click", () => {
    if (isGameOver || !isMouseOver) return;

    if (ball != null) {
      ball.createdAt = 0;
      ball.collisionFilter = { group: 0, category: 1, mask: -1 };
      Body.setVelocity(ball, { x: 0, y: (100 / fps) * 5.5 });
      ball = null;

      newSize = Math.ceil(Math.random() * 3);
      setTimeout(() => createNewBall(newSize), 500);
    }
  });

  // ================= [테스트용 키보드 입력 - 최대 14레벨 매핑] =================
  addEventListener("keydown", (e) => {
    if (isGameOver) return;

    const keyMap = {
      "1": 6,
      "2": 7,
      "3": 8,
      "4": 9,
      "5": 10,
      "6": 11,
      "7": 12,
      "8": 13,
      "9": 14,
    };

    const targetSize = keyMap[e.key];

    if (targetSize) {
      if (ball != null) World.remove(engine.world, ball);

      let spawnX = 240;
      if (mousePos !== undefined && mousePos > 25 && mousePos < 455) {
        spawnX = mousePos;
      }

      const dropBall = newBall(spawnX, 50, targetSize);
      dropBall.createdAt = 0;
      dropBall.collisionFilter = { group: 0, category: 1, mask: -1 };

      World.add(engine.world, dropBall);
      Body.setVelocity(dropBall, { x: 0, y: (100 / fps) * 5.5 });

      ball = null;
      newSize = Math.ceil(Math.random() * 3);
      setTimeout(() => {
        if (ball == null) createNewBall(newSize);
      }, 500);
    }
  });
  // =========================================================

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
      body = bodies[i];

      if (body.position.y < 100) {
        if (
          body !== ball &&
          Math.abs(body.velocity.x) < 0.2 &&
          Math.abs(body.velocity.y) < 0.2
        ) {
          gameOver();
        }
      } else if (body.position.y < 150) {
        if (
          body !== ball &&
          Math.abs(body.velocity.x) < 0.5 &&
          Math.abs(body.velocity.y) < 0.5
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
      bodies = [collision.bodyA, collision.bodyB];

      if (bodies[0].size === undefined || bodies[1].size === undefined) return;

      if (bodies[0].size === bodies[1].size) {
        allBodies = Composite.allBodies(engine.world);
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

          // 최대 14단계로 제한
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
          audio.play();
        }
      }
    });
  }

  Events.on(render, "afterRender", () => {
    if (isGameOver) {
      ctx.fillStyle = "#ffffff55";
      ctx.rect(0, 0, 480, 720);
      ctx.fill();

      writeText("Game Over", "center", 240, 240, 50);
      writeText("Score: " + score, "center", 240, 280, 30);
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

    if (isMobile()) {
      parent.style.zoom = window.innerWidth / 480;
      parent.style.top = "0px";

      floor.style.height = `${
        (window.innerHeight - canvas.height * parent.style.zoom) /
        parent.style.zoom
      }px`;
    } else {
      parent.style.zoom = window.innerHeight / 720 / 1.3;
      parent.style.top = `${(canvas.height * parent.style.zoom) / 15}px`;

      floor.style.height = "50px";
    }

    Render.setPixelRatio(render, parent.style.zoom * 2);
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

  function isMobile() {
    return window.innerHeight / window.innerWidth >= 1.49;
  }

  function init() {
    isGameOver = false;
    ball = null;
    engine.timing.timeScale = 1;
    score = 0;

    gameOverlayer.style.display = "none";
    document.getElementById("scoreInputModal").style.display = "none";

    while (engine.world.bodies.length > 4) {
      engine.world.bodies.pop();
    }

    createNewBall(1);
  }

  function gameOver() {
    isGameOver = true;
    engine.timing.timeScale = 0;

    gameOverlayer.style.display = "flex";

    if (ball != null) World.remove(engine.world, ball);

    // Top 3 랭킹 판정 (3위보다 점수가 높거나, 랭킹에 3명이 미달일 때)
    const isTop3 =
      top3Scores.length < 3 || score > top3Scores[top3Scores.length - 1].score;

    if (isTop3 && score > 0) {
      const modal = document.getElementById("scoreInputModal");
      const submitBtn = document.getElementById("submitScoreBtn");
      modal.style.display = "flex";

      submitBtn.onclick = async () => {
        const nicknameInput = document.getElementById("nicknameInput");
        const nickname = nicknameInput.value.trim() || "AAA";

        submitBtn.disabled = true;
        submitBtn.textContent = "저장 중...";

        try {
          await db.collection("scores").add({
            name: nickname,
            score: score,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          modal.style.display = "none";
          loadTopScores();
        } catch (error) {
          console.error("점수 저장 실패:", error);
          alert("점수 저장에 실패했습니다. Firebase Firestore 규칙(Rule)을 확인해주세요!");
          submitBtn.disabled = false;
          submitBtn.textContent = "기록 남기기";
        }
      };
    }
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
    c = Bodies.circle(x, y, size * 10, {
      render: {
        sprite: {
          texture: `assets/img/${size}.png`,
          xScale: size / 12.75,
          yScale: size / 12.75,
        },
      },
    });
    c.size = size;
    c.createdAt = Date.now();
    c.restitution = 0.3;
    c.friction = 0.1;

    return c;
  }
})();