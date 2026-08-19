/* ROOMI Groq AI brain */
(() => {
  const WORKER_URL =
    "https://roomi-ai.akakal9213.workers.dev";

  function setBrainStatus(text, badgeText) {
    const status =
      document.querySelector("#brainStatus");

    const badge =
      document.querySelector("#brainBadge");

    if (status) {
      status.textContent = text;
    }

    if (badge && badgeText) {
      badge.textContent = badgeText;
    }
  }

  function charData(c) {
    return {
      id: c?.id || "",
      name: c?.name || "캐릭터",
      speech:
        c?.speech || "자연스럽게 말함",
      bio: c?.bio || "",
      status: c?.status || "",
      country:
        c?.country || "대한민국",
      loc:
        c?.loc || "서울"
    };
  }

  function threadMessages(
    context = {},
    c
  ) {
    const out = [];
    const post = context.post;

    if (post?.text) {
      const postAuthor =
        post.char === "me"
          ? "사용자"
          : (
              getChar(post.char)?.name ||
              "다른 친구"
            );

      out.push({
        role: "user",
        content:
          `[현재 SNS 원글 / 작성자 ${postAuthor}]\n${post.text}` +
          (
            post.reason
              ? `\n원글 배경: ${post.reason}`
              : ""
          )
      });
    }

    const thread =
      Array.isArray(context.thread)
        ? context.thread.slice(-10)
        : [];

    for (const item of thread) {
      if (!item?.text) {
        continue;
      }

      if (item.who === "me") {
        out.push({
          role: "user",
          content: item.text
        });
      } else if (item.who === c?.id) {
        out.push({
          role: "assistant",
          content: item.text
        });
      } else {
        const other =
          getChar(item.who)?.name ||
          "다른 친구";

        out.push({
          role: "user",
          content:
            `[${other}의 댓글] ${item.text}`
        });
      }
    }

    return out;
  }

  function dmMessages(c) {
    return (
      state.chats?.[c.id] || []
    )
      .filter(
        (m) =>
          !m.pending &&
          m?.text
      )
      .slice(-12)
      .map((m) => ({
        role:
          m.me
            ? "user"
            : "assistant",
        content: m.text
      }));
  }

  function memoryContext(c) {
    const memories =
      (
        state.memories?.[c.id] || []
      ).slice(-8);

    const ownPosts =
      (state.posts || [])
        .filter(
          (p) =>
            p.char === c.id
        )
        .slice(-3)
        .map(
          (p) => p.text
        );

    const parts = [];

    if (memories.length) {
      parts.push(
        "[최근 기억]\n- " +
        memories.join("\n- ")
      );
    }

    if (ownPosts.length) {
      parts.push(
        "[최근 본인 게시물]\n- " +
        ownPosts.join("\n- ")
      );
    }

    return parts.join("\n\n");
  }

  async function askWorker(
    c,
    userText,
    context = {}
  ) {
    const mode =
      context.channel ===
      "autonomous_post"
        ? "post"
        : "chat";

    const messages = [];

    const memory =
      memoryContext(c);

    if (memory) {
      messages.push({
        role: "user",
        content: memory
      });
    }

    if (
      context.channel === "dm"
    ) {
      messages.push(
        ...dmMessages(c)
      );
    } else {
      messages.push(
        ...threadMessages(
          context,
          c
        )
      );
    }

    if (
      context.targetComment?.text
    ) {
      const who =
        getChar(
          context.targetComment.who
        )?.name ||
        "상대";

      messages.push({
        role: "user",
        content:
          "[지금 사용자가 답글을 단 대상]\n" +
          who +
          ": " +
          context.targetComment.text
      });
    }

    if (context.weatherText) {
      messages.push({
        role: "user",
        content:
          "[참고용 현재 상황]\n" +
          context.weatherText +
          "\n관련 있을 때만 사용해."
      });
    }

    const last =
      messages[
        messages.length - 1
      ];

    if (
      !last ||
      last.role !== "user" ||
      last.content !== userText
    ) {
      messages.push({
        role: "user",
        content: userText
      });
    }

    const response =
      await fetch(
        WORKER_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              mode: mode,
              character:
                charData(c),
              messages: messages
            })
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (
      !response.ok ||
      !data?.ok ||
      !data?.reply
    ) {
      const detail =
        data?.details
          ?.error
          ?.message ||
        data?.error ||
        (
          "HTTP " +
          response.status
        );

      throw new Error(detail);
    }

    return String(
      data.reply
    ).trim();
  }

  window.ROOMIBrain = {
    version: "groq-1.0",
    workerUrl: WORKER_URL,
    askWorker: askWorker
  };

  window.callBrain =
    async function(
      c,
      userText,
      context = {}
    ) {
      try {
        setBrainStatus(
          "Groq AI 연결됨 · 실제 언어모델이 문맥을 읽고 답변",
          "Groq AI"
        );

        return await askWorker(
          c,
          userText,
          context
        );

      } catch (error) {
        console.error(
          "ROOMI Groq AI error:",
          error
        );

        setBrainStatus(
          "Groq 연결 실패 · 임시 경량 답변 사용 중",
          "Fallback"
        );

        if (
          typeof lightweightReply ===
          "function"
        ) {
          return lightweightReply(
            c,
            userText,
            context
          );
        }

        return null;
      }
    };

  try {
    callBrain =
      window.callBrain;
  } catch (error) {
  }

  fetch(WORKER_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Worker unavailable"
        );
      }

      setBrainStatus(
        "Groq AI 서버 준비됨 · 캐릭터 문맥형 대화 사용",
        "Groq AI"
      );
    })
    .catch(() => {
      setBrainStatus(
        "Groq AI 서버 확인 실패 · 댓글/DM에서 재시도",
        "확인 필요"
      );
    });
})();
