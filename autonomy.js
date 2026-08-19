/* ROOMI AI autonomous activity */
(() => {
  state.settings ||= {
    autoAi: true,
    activityLevel: "normal",
    catchUpWorld: true,
    lastSimulationAt: Date.now()
  };

  state.settings.lastSimulationAt ||=
    Date.now();

  const autoToggle =
    document.querySelector("#autoAi");

  const levelSelect =
    document.querySelector("#activityLevel");

  const catchToggle =
    document.querySelector("#catchUpWorld");

  if (autoToggle) {
    autoToggle.checked =
      state.settings.autoAi !== false;
  }

  if (levelSelect) {
    levelSelect.value =
      state.settings.activityLevel ||
      "normal";
  }

  if (catchToggle) {
    catchToggle.checked =
      state.settings.catchUpWorld !== false;
  }

  autoToggle?.addEventListener(
    "change",
    () => {
      state.settings.autoAi =
        autoToggle.checked;
      save();
    }
  );

  levelSelect?.addEventListener(
    "change",
    () => {
      state.settings.activityLevel =
        levelSelect.value;
      save();
    }
  );

  catchToggle?.addEventListener(
    "change",
    () => {
      state.settings.catchUpWorld =
        catchToggle.checked;
      save();
    }
  );

  function pick(arr) {
    return arr[
      Math.floor(
        Math.random() * arr.length
      )
    ];
  }

  function localHour(c) {
    try {
      const place =
        placeForCharacter(c);

      const parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone: place.tz,
            hour: "2-digit",
            hour12: false
          }
        ).formatToParts(
          new Date()
        );

      return Number(
        parts.find(
          (x) =>
            x.type === "hour"
        )?.value || 12
      );

    } catch (error) {
      return 12;
    }
  }

  function dayPart(c) {
    const hour = localHour(c);

    if (hour < 6) {
      return "새벽";
    }

    if (hour < 10) {
      return "아침";
    }

    if (hour < 14) {
      return "점심";
    }

    if (hour < 18) {
      return "오후";
    }

    if (hour < 22) {
      return "저녁";
    }

    return "늦은 밤";
  }

  async function autoPost(c) {
    const weather =
      await weatherForCharacter(c);

    const situation =
      "현재 " +
      (c.country || "대한민국") +
      " " +
      (c.loc || "서울") +
      ", " +
      dayPart(c) +
      ". 현지 시각은 " +
      formatCharacterTime(c, true) +
      ". 날씨는 " +
      weather.text +
      ". 현재 상태는 \"" +
      (c.status || "온라인") +
      "\".";

    const instruction =
      "지금은 사용자에게 답하는 중이 아니다. " +
      "SNS를 보다가 스스로 새 글을 올리려고 한다. " +
      c.name +
      " 본인이 실제로 올릴 법한 짧은 게시글 하나만 작성해. " +
      "매번 날씨 이야기만 하지 말고 식사, 일, 휴식, 이동, 취미, " +
      "사소한 생각, 주변 사람, 오늘 있었던 일 등 소재를 다양하게 골라. " +
      "최근에 올린 글과 같은 내용이나 비슷한 문장을 반복하지 마.";

    let text = null;

    try {
      text = await callBrain(
        c,
        instruction,
        {
          channel:
            "autonomous_post",

          weatherText:
            situation
        }
      );
    } catch (error) {
      console.error(
        "ROOMI auto post error",
        error
      );
    }

    if (!text) {
      text =
        dayPart(c) +
        "에 잠깐 쉬는 중. " +
        "오늘은 생각보다 시간이 빨리 가네.";
    }

    const post = {
      id:
        Date.now() +
        Math.random(),

      char: c.id,

      text: text,

      time: "방금",

      likes:
        Math.floor(
          Math.random() * 5
        ),

      comments: [],

      event:
        "자동 일상 활동",

      reason:
        situation
    };

    state.posts.push(post);

    remember(
      c.id,
      'SNS에 "' +
      text +
      '"라고 게시했다.'
    );

    return post;
  }

  async function autoComment(
    post,
    commenter
  ) {
    const owner =
      getChar(post.char);

    if (
      !owner ||
      owner.id === commenter.id
    ) {
      return null;
    }

    let response = null;

    try {
      response =
        await callBrain(
          commenter,

          "이 게시글을 읽고 " +
          commenter.name +
          " 본인이 실제로 댓글을 달 법하다면 자연스럽게 한마디 해. " +
          "게시글 내용에 직접 반응하고 작성자에게 하는 말처럼 써. " +
          "억지로 날씨 이야기로 돌리지 말고 같은 말을 반복하지 마.",

          {
            channel:
              "autonomous_comment",

            post: post,

            thread:
              post.comments
          }
        );

    } catch (error) {
      console.error(
        "ROOMI auto comment error",
        error
      );
    }

    if (!response) {
      return null;
    }

    const existing =
      (post.comments || [])
        .map(
          (item) =>
            item.text
        );

    if (
      existing.some(
        (text) =>
          text === response
      )
    ) {
      return null;
    }

    post.comments.push(
      newComment(
        commenter.id,
        response
      )
    );

    remember(
      commenter.id,

      owner.name +
      '의 게시물 "' +
      post.text +
      '"에 "' +
      response +
      '"라고 댓글을 달았다.'
    );

    return response;
  }

  async function socialReaction(
    post
  ) {
    if (
      state.chars.length < 2
    ) {
      return;
    }

    const candidates =
      state.chars
        .filter(
          (c) =>
            c.id !== post.char
        )
        .sort(
          () =>
            Math.random() - 0.5
        );

    const count =
      Math.random() < 0.3
        ? 2
        : 1;

    for (
      const c of
      candidates.slice(
        0,
        count
      )
    ) {
      if (
        Math.random() < 0.78
      ) {
        await autoComment(
          post,
          c
        );
      }
    }
  }

  async function oneAutonomousAction(
    silent = false
  ) {
    if (
      !state.settings.autoAi ||
      !state.chars.length
    ) {
      return false;
    }

    const recent =
      state.posts.slice(-12);

    const makePost =
      recent.length < 3 ||
      Math.random() < 0.58;

    if (makePost) {
      const c =
        pick(state.chars);

      const post =
        await autoPost(c);

      if (
        Math.random() < 0.85
      ) {
        await socialReaction(
          post
        );
      }

      if (!silent) {
        toast(
          c.name +
          "이 새 글을 올렸어요"
        );
      }

    } else {
      const candidates =
        recent.filter(
          (post) =>
            (
              post.comments || []
            ).length < 8
        );

      if (
        candidates.length
      ) {
        const post =
          pick(candidates);

        const pool =
          state.chars.filter(
            (c) =>
              c.id !==
              post.char
          );

        if (pool.length) {
          const c =
            pick(pool);

          const reply =
            await autoComment(
              post,
              c
            );

          if (
            reply &&
            !silent
          ) {
            toast(
              c.name +
              "이 댓글을 남겼어요"
            );
          }
        }
      }
    }

    state.settings.lastSimulationAt =
      Date.now();

    save();
    renderFeed();

    return true;
  }

  function intervalMinutes() {
    if (
      state.settings.activityLevel ===
      "quiet"
    ) {
      return 90;
    }

    if (
      state.settings.activityLevel ===
      "active"
    ) {
      return 10;
    }

    return 30;
  }

  async function catchUp() {
    if (
      !state.settings.autoAi ||
      !state.settings.catchUpWorld
    ) {
      return;
    }

    const now =
      Date.now();

    const last =
      Number(
        state.settings
          .lastSimulationAt ||
        now
      );

    const elapsed =
      Math.max(
        0,
        now - last
      );

    const slot =
      intervalMinutes() *
      60 *
      1000;

    let count =
      Math.floor(
        elapsed / slot
      );

    count =
      Math.min(
        count,
        6
      );

    if (
      count <= 0
    ) {
      return;
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {
      await oneAutonomousAction(
        true
      );
    }

    state.settings.lastSimulationAt =
      now;

    save();
    renderFeed();

    toast(
      "없는 동안 친구 활동 " +
      count +
      "개가 생겼어요"
    );
  }

  function toast(message) {
    let el =
      document.querySelector(
        ".autonomy-toast"
      );

    if (!el) {
      el =
        document.createElement(
          "div"
        );

      el.className =
        "autonomy-toast";

      document.body.appendChild(
        el
      );
    }

    el.textContent =
      message;

    el.classList.add(
      "show"
    );

    clearTimeout(
      el._timer
    );

    el._timer =
      setTimeout(
        () => {
          el.classList.remove(
            "show"
          );
        },
        2300
      );
  }

  setInterval(
    async () => {
      if (
        document.hidden ||
        !state.settings.autoAi
      ) {
        return;
      }

      const due =
        Date.now() -
        Number(
          state.settings
            .lastSimulationAt ||
          0
        ) >=
        intervalMinutes() *
        60 *
        1000;

      if (due) {
        await oneAutonomousAction();
      }
    },
    60000
  );

  setTimeout(
    catchUp,
    1200
  );

  window.ROOMIAutonomy = {
    tick:
      oneAutonomousAction,

    catchUp:
      catchUp,

    autoPost:
      autoPost,

    autoComment:
      autoComment
  };
})();
