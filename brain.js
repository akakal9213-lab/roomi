
/* ROOMI v18 Brain
   1) Desktop Chrome with LanguageModel: real local LLM when available.
   2) Otherwise: context-aware semantic conversation engine, no model download.
*/
(() => {
  const BRAIN_VERSION = '18.0';

  const topicPatterns = [
    ['work_avoid', [/일하기\s*싫/,/일\s*하기\s*싫/,/출근\s*싫/,/회사\s*가기\s*싫/,/야근\s*싫/,/일\s*개싫/]],
    ['food_choice', [/뭐\s*먹/,/뭐먹/,/메뉴/,/먹을까/,/시켜\s*먹/,/배달/,/저녁\s*뭐/,/점심\s*뭐/]],
    ['hungry', [/배고/,/허기/,/꼬르륵/,/배\s*고파/]],
    ['cold', [/추워/,/춥/,/추웡/,/쌀쌀/,/으슬/,/추움/]],
    ['hot', [/더워/,/덥/,/후덥/,/더움/]],
    ['sleepy', [/졸려/,/졸리/,/잠와/,/잠\s*와/,/졸림/]],
    ['tired', [/피곤/,/지쳤/,/지침/,/녹초/,/힘빠/]],
    ['bored', [/심심/,/지루/,/할\s*거\s*없/]],
    ['angry', [/짜증/,/빡쳐/,/화나/,/열받/,/개빡/]],
    ['sad', [/속상/,/슬퍼/,/눈물/,/서러/,/ㅠ/,/ㅜ/]],
    ['sick', [/아파/,/아픔/,/머리\s*아/,/배\s*아/,/몸살/]],
    ['weather_q', [/날씨/,/몇\s*도/,/기온/,/온도/,/비\s*와/,/눈\s*와/]],
    ['rain_feel', [/비.*올.*같/,/비\s*냄새/,/먹구름/,/바람.*비/,/습하/,/눅눅/]],
    ['whatdoing', [/뭐\s*해/,/뭐해/,/뭐하고/,/하고\s*있/]],
    ['where', [/어디야/,/어딨어/,/어디\s*있/]],
    ['why', [/왜/,/어째서/,/이유/]],
    ['correction', [/^아니/,/그게\s*아니/,/내\s*말은/,/라고\s*했잖/,/라니까/,/아니라고/]],
    ['challenge', [/뭔\s*소리/,/무슨\s*말/,/뭘\s*이해/,/뭐가\s*웃/,/왜\s*웃/,/뭔말/]],
    ['confused', [/^\?{2,}$/, /^엥/, /^엣/, /^어\?+/, /^응\?+/]],
    ['laugh', [/ㅋㅋ/,/ㅎㅎ/,/하하/,/웃겨/,/웃김/]],
    ['thanks', [/고마/,/감사/]],
    ['sorry', [/미안/,/죄송/]],
    ['greeting', [/안녕/,/^ㅎㅇ/,/하이/,/헬로/]],
    ['affection', [/보고\s*싶/,/보고싶/,/사랑/,/좋아해/]],
    ['agree', [/맞아/,/그러게/,/그치/,/그렇지/,/^ㅇㅇ$/, /인정/]],
    ['same', [/나도/,/저도/,/나\s*역시/]],
    ['concern', [/괜찮/,/걱정/]],
  ];

  const normalizeText = s => String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  function intentOf(text, ctx={}) {
    const t = normalizeText(text);
    for (const [name, regs] of topicPatterns) if (regs.some(r=>r.test(t))) return name;
    if (/[?？]$/.test(t)) return 'question';
    const target = normalizeText(ctx?.targetComment?.text || '');
    const post = normalizeText(ctx?.post?.text || '');
    if (/배고|먹|밥|식사/.test(target+' '+post)) return 'food_follow';
    if (/일|회사|출근|업무|야근/.test(target+' '+post)) return 'work_follow';
    if (/추워|춥|더워|덥|날씨|비|눈/.test(target+' '+post)) return 'weather_follow';
    return 'statement';
  }

  function persona(c) {
    const all = `${c?.bio||''} ${c?.speech||''}`;
    return {
      formal: /존댓|예의|격식/.test(all) || c?.id==='jeonghun',
      playful: /장난|농담|활발|유쾌|사교/.test(all),
      blunt: /무뚝뚝|직설|과묵|짧게|핵심/.test(all),
      warm: /다정|배려|따뜻|온화|친절/.test(all),
    };
  }
  function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function choose(arr,key){return arr[hash(key)%arr.length]}
  function F(p,a,b){return p.formal?a:b}

  function contextReply(c, text, ctx={}) {
    const p = persona(c), intent=intentOf(text,ctx);
    const target = String(ctx?.targetComment?.text||'');
    const post = String(ctx?.post?.text||'');
    const key = `${c?.id}|${text}|${intent}|${target}`;

    if (intent==='challenge') {
      return target
        ? F(p,`아, 제가 방금 "${target}"라고 한 부분 때문에 그러시는군요. 제가 맥락을 잘못 짚었습니다.`,`아, 내가 방금 "${target}"라고 한 거 때문이지. 내가 맥락을 잘못 짚었네.`)
        : F(p,'제가 방금 말을 이상하게 했군요. 바로 앞 이야기부터 다시 이어가겠습니다.','내가 방금 이상하게 말했네. 바로 앞 얘기부터 다시 이어갈게.');
    }
    if (intent==='correction') return F(p,'제가 앞말을 잘못 알아들었습니다. 방금 정정해주신 뜻을 기준으로 이어가겠습니다.','내가 앞말을 잘못 알아들었네. 방금 정정해준 뜻으로 이어갈게.');
    if (intent==='confused') return target
      ? F(p,`방금 제 답이 엉뚱했군요. "${target}"부터 다시 보고 말씀드리겠습니다.`,`방금 내 답이 엉뚱했네. "${target}"부터 다시 볼게.`)
      : F(p,'제가 이상하게 말했습니까? 다시 제대로 말씀드리겠습니다.','내가 이상하게 말했어? 다시 제대로 말할게.');
    if (intent==='why') {
      if (ctx?.post?.char===c?.id && ctx?.post?.reason) return F(p,`원글의 이유를 물으신 거군요. ${ctx.post.reason}.`,`원글 이유 물어본 거지. ${ctx.post.reason}.`);
      if (target) return F(p,`제가 "${target}"라고 한 이유를 물으신 거군요. 앞말을 그렇게 받아들여서 나온 반응이었습니다.`,`내가 "${target}"라고 한 이유 물어본 거지. 앞말을 그렇게 받아들여서 한 반응이었어.`);
    }

    const table = {
      work_avoid:[
        F(p,'일하기 싫은 날이 있지요. 오늘 특히 지치신 겁니까, 아니면 그냥 손이 안 가는 날입니까?','일하기 싫은 날 있지. 오늘 특히 지친 거야, 아니면 그냥 손이 안 가?'),
        F(p,'오늘 일이 유난히 하기 싫으신가 봅니다. 제일 하기 싫은 게 뭡니까?','오늘 유독 일하기 싫나 보네. 제일 하기 싫은 게 뭐야?'),
        F(p,'그 마음은 이해합니다. 우선 제일 작은 일 하나만 끝내는 건 어떻습니까?','그 마음 알지. 일단 제일 작은 거 하나만 끝내볼래?')
      ],
      hungry:[
        F(p,'배고프십니까? 지금 당기는 음식은 없으십니까?','배고파? 지금 당기는 거 없어?'),
        F(p,'아직 식사 안 하셨습니까? 너무 늦기 전에 뭐라도 드십시오.','아직 안 먹었어? 너무 늦기 전에 뭐라도 먹자.'),
        F(p,'배가 많이 고프신가 봅니다. 든든한 걸 드시는 게 좋겠습니다.','많이 배고픈가 보네. 든든한 거 먹자.')
      ],
      food_choice:[
        F(p,'밥 종류랑 면 종류 중 어느 쪽이 더 당기십니까?','밥이랑 면 중에 뭐가 더 당겨?'),
        F(p,'많이 배고프시면 덮밥처럼 든든한 게 낫고, 가볍게면 라멘도 괜찮겠습니다.','엄청 배고프면 덮밥, 가볍게면 라멘 어때?'),
        F(p,'지금 기분이면 따뜻한 음식이 괜찮아 보입니다.','지금은 따뜻한 거 먹는 게 좋겠다.')
      ],
      cold:[F(p,'춥습니까? 얇게라도 하나 더 걸치십시오.','추워? 뭐라도 하나 더 걸쳐.'),F(p,'생각보다 쌀쌀한가 봅니다. 따뜻한 거라도 드십시오.','생각보다 쌀쌀한가 보네. 따뜻한 거라도 먹어.')],
      hot:[F(p,'덥습니까? 물은 꼭 챙겨 드십시오.','더워? 물 꼭 챙겨.'),F(p,'오늘은 오래 밖에 있으면 힘들겠습니다. 시원한 곳에서 좀 쉬십시오.','오늘 오래 밖에 있으면 힘들겠다. 시원한 데 좀 있어.')],
      sleepy:[F(p,'졸리시면 잠깐이라도 눈을 붙이시는 게 낫겠습니다.','졸려? 잠깐이라도 자.'),F(p,'오늘 잠을 제대로 못 주무셨습니까?','어제 제대로 못 잤어?')],
      tired:[F(p,'많이 피곤하신가 봅니다. 오늘 일이 많았습니까?','많이 피곤한가 보네. 오늘 일 많았어?'),F(p,'가능하면 조금이라도 쉬십시오.','좀 쉬어. 지금은 무리하지 마.')],
      bored:[F(p,'심심하십니까? 저라도 잠깐 상대해드릴까요?','심심해? 그럼 나랑 얘기할래?'),F(p,'할 게 없으신가 봅니다. 뭐라도 같이 정해볼까요?','할 거 없어? 뭐라도 같이 정해볼까?')],
      angry:[F(p,'무슨 일이 있었습니까? 꽤 화가 나신 것 같습니다.','왜, 무슨 일 있었어? 꽤 화난 것 같은데.'),F(p,'누가 뭘 했는지부터 말씀해보십시오.','누가 뭐 했어? 말해봐.')],
      sad:[F(p,'무슨 일이 있었습니까? 괜찮으시면 말씀해주셔도 됩니다.','왜, 무슨 일 있었어? 말해도 돼.'),F(p,'많이 속상하신가 봅니다. 혼자 삼키지는 마십시오.','많이 속상한가 보네. 혼자 참지 마.')],
      sick:[F(p,'많이 불편하십니까? 심하면 참지 말고 쉬십시오.','많이 아파? 심하면 참지 말고 좀 쉬어.')],
      laugh:[F(p,'무슨 일이 그렇게 웃기셨습니까?','뭐가 그렇게 웃겨 ㅋㅋ'),F(p,'갑자기 왜 그렇게 웃으십니까?','갑자기 왜 그렇게 웃어 ㅋㅋ')],
      greeting:[F(p,'안녕하세요. 오늘은 어떠셨습니까?','안녕. 오늘 어땠어?'),F(p,'오셨군요. 뭐 하고 계셨습니까?','왔네. 뭐 하고 있었어?')],
      whatdoing:[F(p,`지금은 ${c.status||'잠깐 쉬고 있습니다'}. 무슨 일 있으십니까?`,`지금은 ${c.status||'좀 쉬고 있어'}. 왜?`)],
      where:[F(p,`지금은 ${c.country||'대한민국'} ${c.loc}에 있습니다.`,`나 지금 ${c.country||'대한민국'} ${c.loc}에 있어.`)],
      rain_feel:[F(p,'그러게요. 공기나 바람이 딱 비 오기 전 같은 때가 있지요.','그러게. 딱 비 오기 전 같은 공기일 때 있지.'),F(p,'비가 당장 안 와도 그런 바람이면 괜히 우산 생각이 납니다.','당장 비 안 와도 그런 바람이면 괜히 우산 생각나지.')],
      thanks:[F(p,'별말씀을요.','뭘. 괜찮아.')],
      sorry:[F(p,'괜찮습니다. 너무 신경 쓰지 마십시오.','괜찮아. 너무 신경 쓰지 마.')],
      affection:[F(p,'그렇게 말씀해주시니 기분이 좋군요.','그렇게 말하니까 좀 좋네.')],
      agree:[F(p,'네, 저도 그렇게 생각합니다.','응, 나도 그렇게 생각해.')],
      same:[F(p,'그러셨군요. 저와 비슷하게 느끼셨나 봅니다.','그래? 너도 비슷하게 느꼈구나.')],
      concern:[F(p,'괜찮습니다. 너무 걱정하지 않으셔도 됩니다.','괜찮아. 너무 걱정 안 해도 돼.')],
      food_follow:[F(p,'아까 먹는 이야기 이어서 하시는 거군요. 지금 뭐가 제일 당기십니까?','아까 먹는 얘기 이어서 하는 거지. 지금 뭐가 제일 당겨?')],
      work_follow:[F(p,'아까 일 이야기 이어서 하시는 거군요. 지금 제일 하기 싫은 부분이 뭡니까?','아까 일 얘기 이어서 하는 거지. 지금 뭐가 제일 하기 싫어?')],
      weather_follow:[F(p,'아까 날씨 이야기 이어서 하시는 거군요. 지금 밖에 계십니까?','아까 날씨 얘기 이어서 하는 거지. 지금 밖이야?')]
    };
    let out = table[intent] ? choose(table[intent],key) : null;
    if (!out) {
      const generic = p.formal
        ? ['그렇군요. 지금은 좀 어떠십니까?','그런 상황이셨군요. 그다음에는 어떻게 됐습니까?','말씀하신 걸 보니 오늘 이런저런 일이 있으셨나 봅니다.']
        : ['아 그렇구나. 지금은 좀 어때?','그런 상황이었네. 그래서 다음엔 어떻게 됐어?','오늘 이런저런 일이 좀 있었나 보네.'];
      out = choose(generic,key);
    }
    if (p.playful && !p.formal && ['hungry','work_avoid','bored','laugh'].includes(intent) && !out.includes('ㅋㅋ')) out += ' ㅋㅋ';
    if (p.blunt && out.length>55) out = out.split(/[.!?]/)[0]+'.';
    return out;
  }

  async function builtInAvailable() {
    try {
      return typeof LanguageModel!=='undefined' && (await LanguageModel.availability({languages:['ko']}))==='available';
    } catch { return false; }
  }

  async function builtInReply(c,userText,context={}) {
    const system = await brainSystem(c,context);
    const thread = (context?.thread||[]).slice(-10).map(x=>`${getChar(x.who)?.name||'사용자'}: ${x.text}`).join('\n');
    const prompt = `${system}\n\n현재 스레드:\n${thread||'(없음)'}\n\n사용자: ${userText}\n${c.name}:`;
    const session = await LanguageModel.create({languages:['ko']});
    try { return (await session.prompt(prompt)).trim(); }
    finally { try{session.destroy()}catch{} }
  }

  window.ROOMIBrain = {version:BRAIN_VERSION, intentOf, contextReply};

  // Override the old brain with the best free engine available.
  window.callBrain = async function(c,userText,context={}) {
    try {
      if (await builtInAvailable()) {
        const el=document.querySelector('#brainStatus'), badge=document.querySelector('#brainBadge');
        if(el)el.textContent='데스크톱 Chrome 내장 AI 사용 중 · 기기에서 직접 처리';
        if(badge)badge.textContent='로컬 LLM';
        return await builtInReply(c,userText,context);
      }
    } catch(e) { console.warn('Built-in AI fallback:',e); }
    const el=document.querySelector('#brainStatus'), badge=document.querySelector('#brainBadge');
    if(el)el.textContent='Android 호환 문맥 엔진 · 댓글 대상/앞 대화/캐릭터 성격을 함께 봄';
    if(badge)badge.textContent='문맥형';
    return contextReply(c,userText,context);
  };

  // Existing functions refer to the lexical global identifier callBrain.
  try { callBrain = window.callBrain; } catch {}
})();
