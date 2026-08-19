
/* ROOMI v18 autonomous social simulation */
(() => {
  state.settings ||= {autoAi:true,activityLevel:'normal',catchUpWorld:true,lastSimulationAt:Date.now()};
  state.settings.lastSimulationAt ||= Date.now();

  const $auto = document.querySelector('#autoAi');
  const $level = document.querySelector('#activityLevel');
  const $catch = document.querySelector('#catchUpWorld');
  if ($auto) $auto.checked = state.settings.autoAi !== false;
  if ($level) $level.value = state.settings.activityLevel || 'normal';
  if ($catch) $catch.checked = state.settings.catchUpWorld !== false;
  $auto?.addEventListener('change',()=>{state.settings.autoAi=$auto.checked;save()});
  $level?.addEventListener('change',()=>{state.settings.activityLevel=$level.value;save()});
  $catch?.addEventListener('change',()=>{state.settings.catchUpWorld=$catch.checked;save()});

  function hourFor(c) {
    const p=placeForCharacter(c);
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:p.tz,hour:'2-digit',hour12:false}).formatToParts(new Date());
    return Number(parts.find(x=>x.type==='hour')?.value||12);
  }
  function characterMood(c) {
    const h=hourFor(c);
    if(h<6)return'night';
    if(h<10)return'morning';
    if(h<14)return'lunch';
    if(h<18)return'afternoon';
    if(h<22)return'evening';
    return'late';
  }
  function charStyle(c, formal, casual) {
    return (/존댓|예의|격식/.test(`${c.speech} ${c.bio}`)||c.id==='jeonghun')?formal:casual;
  }
  function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
  function niceTime(){return '방금'}

  async function autoPost(c) {
    const w=await weatherForCharacter(c), mood=characterMood(c);
    const rainy=w.rain, hot=Number(w.temp)>=28, cold=Number(w.temp)<=8;
    let lines=[];
    if(rainy) lines=[
      charStyle(c,'밖에 비가 꽤 오는군요. 나가실 분들은 우산 챙기십시오.','비 꽤 오네. 나갈 사람 우산 챙겨.'),
      charStyle(c,'창밖 소리가 계속 들립니다. 오늘은 안에 있는 게 낫겠군요.','비 소리 계속 난다. 오늘은 안에 있는 게 낫겠네.')
    ];
    else if(hot) lines=[
      charStyle(c,'생각보다 많이 덥군요. 오래 밖에 있기는 어렵겠습니다.','생각보다 진짜 덥다. 오래 밖에 못 있겠네.'),
      charStyle(c,'잠깐 나갔다 왔는데 금방 더워졌습니다.','잠깐 나갔다 왔는데 바로 더워짐.')
    ];
    else if(cold) lines=[
      charStyle(c,'밖이 꽤 춥습니다. 옷을 조금 더 챙기는 게 좋겠습니다.','밖 꽤 춥다. 하나 더 입고 나가.'),
      charStyle(c,'공기가 차갑군요. 따뜻한 걸 마시고 싶습니다.','공기 차갑네. 따뜻한 거 마시고 싶다.')
    ];
    else if(mood==='morning') lines=[
      charStyle(c,'오늘은 조금 일찍 움직이게 됐습니다.','오늘 좀 일찍 움직이는 중.'),
      charStyle(c,'아침 공기가 생각보다 괜찮군요.','아침 공기 생각보다 괜찮네.')
    ];
    else if(mood==='lunch') lines=[
      charStyle(c,'점심을 뭘 먹을지 아직 못 정했습니다.','점심 뭐 먹지. 아직 못 정함.'),
      charStyle(c,'슬슬 배가 고프군요.','슬슬 배고프다.')
    ];
    else if(mood==='late') lines=[
      charStyle(c,'이제 슬슬 쉬어야겠습니다.','이제 좀 쉬어야겠다.'),
      charStyle(c,'오늘은 생각보다 길었군요.','오늘 생각보다 길었다.')
    ];
    else lines=[
      charStyle(c,'잠깐 쉬는 중입니다. 생각보다 시간이 빨리 가는군요.','잠깐 쉬는 중. 시간 진짜 빨리 간다.'),
      charStyle(c,'오늘은 크게 특별한 일 없이 지나가고 있습니다.','오늘은 그냥 무난하게 지나가는 중.'),
      charStyle(c,'잠깐 바람 쐬고 왔습니다.','잠깐 바람 쐬고 옴.')
    ];
    const text=pick(lines);
    const p={id:Date.now()+Math.random(),char:c.id,text,time:niceTime(),likes:Math.floor(Math.random()*5),comments:[],event:'자동 일상 활동',reason:`${c.loc}의 현재 시간·날씨와 캐릭터 상태를 바탕으로 한 일상 게시물`};
    state.posts.push(p);
    remember(c.id,`SNS에 "${text}"라고 게시했다.`);
    return p;
  }

  async function autoComment(post, commenter) {
    const owner=getChar(post.char);
    if(!owner || owner.id===commenter.id)return null;
    const response=await callBrain(commenter,post.text,{channel:'autonomous_comment',post,thread:post.comments});
    if(!response)return null;
    const existing=(post.comments||[]).map(x=>x.text);
    if(existing.some(x=>x===response))return null;
    post.comments.push(newComment(commenter.id,response));
    remember(commenter.id,`${owner.name}의 게시물 "${post.text}"에 "${response}"라고 댓글을 달았다.`);
    return response;
  }

  async function socialReaction(post) {
    if(state.chars.length<2)return;
    const candidates=state.chars.filter(c=>c.id!==post.char).sort(()=>Math.random()-.5);
    const count=Math.random()<.28?2:1;
    for(const c of candidates.slice(0,count)) {
      if(Math.random()<.72) await autoComment(post,c);
    }
  }

  async function oneAutonomousAction(silent=false) {
    if(!state.settings.autoAi || !state.chars.length)return false;
    const recent=state.posts.slice(-10);
    const canComment=recent.some(p=>p.char!=='me' || state.chars.length);
    const makePost=Math.random() < (recent.length<3 ? .75 : .52);
    if(makePost) {
      const c=pick(state.chars);
      const p=await autoPost(c);
      if(Math.random()<.8)await socialReaction(p);
      if(!silent)toast(`${c.name}이 새 글을 올렸어요`);
    } else if(canComment) {
      const posts=recent.filter(p=>(p.comments||[]).length<8);
      const p=pick(posts.length?posts:recent);
      const pool=state.chars.filter(c=>c.id!==p.char);
      if(pool.length) {
        const c=pick(pool);
        const r=await autoComment(p,c);
        if(r&&!silent)toast(`${c.name}이 댓글을 남겼어요`);
      }
    }
    state.settings.lastSimulationAt=Date.now();
    save();renderFeed();
    return true;
  }

  function intervalMinutes() {
    return state.settings.activityLevel==='quiet'?120:state.settings.activityLevel==='active'?25:60;
  }

  async function catchUp() {
    if(!state.settings.autoAi || !state.settings.catchUpWorld)return;
    const now=Date.now(), last=Number(state.settings.lastSimulationAt||now);
    const elapsed=Math.max(0,now-last);
    const slot=intervalMinutes()*60*1000;
    let n=Math.floor(elapsed/slot);
    n=Math.min(n,8); // 폭주 방지
    if(n<=0)return;
    for(let i=0;i<n;i++)await oneAutonomousAction(true);
    state.settings.lastSimulationAt=now;save();renderFeed();
    toast(`없는 동안 친구 활동 ${n}개가 생겼어요`);
  }

  function toast(msg) {
    let el=document.querySelector('.autonomy-toast');
    if(!el){el=document.createElement('div');el.className='autonomy-toast';document.body.appendChild(el)}
    el.textContent=msg;el.classList.add('show');
    clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2300);
  }

  // While the page is open, advance based on elapsed time rather than every tick.
  setInterval(async()=>{
    if(document.hidden || !state.settings.autoAi)return;
    const due=Date.now()-Number(state.settings.lastSimulationAt||0) >= intervalMinutes()*60*1000;
    if(due)await oneAutonomousAction();
  }, 60000);

  // First load catch-up.
  setTimeout(catchUp, 900);

  // Expose debug/manual tick for testing without waiting.
  window.ROOMIAutonomy={tick:oneAutonomousAction,catchUp};
})();
