const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=o=>JSON.parse(JSON.stringify(o));
const defaults={
 chars:[
  {id:'jeonghun',name:'한정훈',handle:'jeonghun',country:'대한민국',loc:'서울',speech:'차분하고 예의를 지키는 존댓말. 질문에는 먼저 직접 답한다.',bio:'조용하고 배려심이 깊다. 사실관계가 없으면 함부로 지어내지 않는다.',avatar:null,status:'집 · 음악 듣는 중'},
  {id:'seonwoo',name:'나선우',handle:'seonwoo',country:'대한민국',loc:'서울',speech:'친근하고 빠른 반말. 핵심을 바로 말한다.',bio:'눈치가 빠르고 챙김이 자연스럽다.',avatar:null,status:'이동 중'},
  {id:'haejin',name:'김해진',handle:'haejin',country:'대한민국',loc:'부산',speech:'차분한 반말. 관찰한 내용을 구체적으로 말한다.',bio:'관찰력이 좋고 기록하는 걸 좋아한다.',avatar:null,status:'카페 · 민혁과 함께'},
  {id:'minhyuk',name:'한민혁',handle:'minhyuk',country:'대한민국',loc:'부산',speech:'장난스러운 반말. 친한 사람에게 가볍게 농담한다.',bio:'사교적이고 농담이 많다.',avatar:null,status:'카페 · 해진과 함께'}
 ],
 posts:[
  {id:1,char:'seonwoo',text:'밖에 생각보다 덥다. 오늘 오래 돌아다닐 사람은 물 챙겨.',time:'42분 전',likes:6,reason:'밖에 나갔는데 체감온도가 높아서',event:'외출 중 더위를 느낌',comments:[{who:'minhyuk',text:'이미 녹는 중'},{who:'jeonghun',text:'저도 곧 들어가겠습니다.'}]},
  {id:2,char:'jeonghun',text:'오늘은 조금 일찍 들어왔습니다. 창문을 열어두니 바람이 생각보다 괜찮군요.',time:'1시간 전',likes:12,reason:'오후 일정 하나가 예상보다 일찍 끝나서',event:'평소보다 이른 퇴근',comments:[{who:'haejin',text:'그래도 에어컨 켜. 오늘 습해.'}]}
 ],
 chats:{jeonghun:[{me:false,text:'오늘은 좀 일찍 들어왔습니다.',topic:'early_home'}],seonwoo:[{me:false,text:'너 오늘 밖에 나갈 거야?'}],haejin:[],minhyuk:[]},
 memories:{jeonghun:['오늘 오후 일정 하나가 예상보다 일찍 끝나 평소보다 일찍 귀가했다.'],seonwoo:[],haejin:[],minhyuk:[]},
 weather:{loc:'서울',country:'대한민국',tz:'Asia/Seoul',temp:null,feel:null,rain:false,text:'날씨 정보 없음'},
 world:{country:'대한민국',city:'서울',tz:'Asia/Seoul'}
};
let state;
try{
  const saved =
    localStorage.getItem('roomiStateV18') ||
    localStorage.getItem('roomiStateV17') ||
    localStorage.getItem('roomiStateV16') ||
    localStorage.getItem('roomiStateV15') ||
    localStorage.getItem('roomiStateV14') ||
    localStorage.getItem('roomiStateV13') ||
    localStorage.getItem('roomiStateV12') ||
    localStorage.getItem('roomiStateV11') ||
    localStorage.getItem('roomiStateV10') ||
    localStorage.getItem('roomiStateV9');
  state=saved?JSON.parse(saved):clone(defaults);
}catch{state=clone(defaults)}
state = state && typeof state==='object' ? state : clone(defaults);
state.chars = Array.isArray(state.chars) ? state.chars : clone(defaults.chars);
state.posts = Array.isArray(state.posts) ? state.posts : clone(defaults.posts);
state.chats = state.chats && typeof state.chats==='object' ? state.chats : clone(defaults.chats);
state.memories ||= clone(defaults.memories); state.weather ||= clone(defaults.weather); state.world ||= clone(defaults.world);
state.settings ||= {autoAi:true,activityLevel:'normal',catchUpWorld:true,lastSimulationAt:Date.now()};
state.chars.forEach(c=>{c.country ||= '대한민국'; state.memories[c.id] ||= [];});
state.posts.forEach(p=>{(p.comments||[]).forEach(c=>{c.id ||= Date.now()+Math.random(); if(c.replyTo===undefined)c.replyTo=null;});});
const replyTargets={};
function newComment(who,text,replyTo=null){return {id:Date.now()+Math.random(),who,text,replyTo};}
function commentById(post,id){return (post?.comments||[]).find(c=>String(c.id)===String(id));}

function remember(charId,text){
  if(!charId||charId==='me'||!text)return;
  state.memories ||= {};
  state.memories[charId] ||= [];
  state.memories[charId].push(String(text));
  if(state.memories[charId].length>80) state.memories[charId]=state.memories[charId].slice(-80);
}
const save=()=>{
  const payload=JSON.stringify(state);
  localStorage.setItem('roomiStateV18',payload);
  localStorage.setItem('roomiStateV17',payload);
  localStorage.setItem('roomiStateV16',payload);
};
const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const getChar=id=>state.chars.find(c=>c.id===id);
function av(c,sm=false,lg=false){if(!c)return `<div class="avatar ${sm?'sm':''} ${lg?'lg':''}">나</div>`;return c.avatar?`<img class="avatar ${sm?'sm':''} ${lg?'lg':''}" src="${c.avatar}" alt="${esc(c.name)}">`:`<div class="avatar ${sm?'sm':''} ${lg?'lg':''}">${esc(c.name.slice(-1))}</div>`}
function latestPostFor(charId){return [...state.posts].reverse().find(p=>p.char===charId)}
function latestUserMessage(charId){return [...(state.chats[charId]||[])].reverse().find(m=>m.me)}
function normalize(s=''){return s.toLowerCase().replace(/\s+/g,' ').trim()}
function isQuestion(t){
  t=normalize(t);
  return /\?|왜|뭐|무엇|어디|누구|언제|어떻게|몇|맞아\??|했어\??|했나\??|냐고|인지\??/.test(t)
    || /(야|니|냐|까|가)\?$/.test(t);
}
function wantsReason(t){return /왜|이유|어째서|땜에|때문/.test(normalize(t))}
function asksWeather(t){
  t=normalize(t);
  // 날씨 단어가 들어갔다고 무조건 날씨 질문으로 취급하지 않는다.
  // "비 올 것 같은 바람이야" 같은 관찰/감상은 대화로 받아준다.
  const weatherWord=/날씨|기온|온도|습도|몇\s*도|비\s*(와|오니|오냐|와\?|오고|오나)|눈\s*(와|오니|오냐|와\?|오나)|우산\s*(필요|챙겨|가져)/.test(t);
  const explicit=/날씨.*(어때|어떻|알려|몇)|지금.*(몇\s*도|비.*와|눈.*와)|비.*(와\?|오니|오냐|오고 있어\?)|기온.*(몇|어때)/.test(t);
  return isQuestion(t) && (weatherWord || explicit);
}
function isWeatherObservation(t){
  t=normalize(t);
  return /비\s*(올|올것|올 것|올거|올 거).*같|비냄새|비 냄새|바람.*(세|강|심상|축축|차|불)|흐리|먹구름|소나기.*같/.test(t) && !asksWeather(t);
}
function isCorrection(t){
  t=normalize(t);
  return /^(아니|아니야|아니라고|내 말은|그게 아니라)|라고\s*(했|말했)|라니까|잖아/.test(t);
}
function refersEarlyHome(t){return /일찍.*(퇴근|들어|왔|귀가)|왜.*일찍|퇴근.*왜|왜.*퇴근/.test(normalize(t))}
function styleLine(c, formal, casual){return c.id==='jeonghun'?formal:casual}
function recentConversation(charId,n=6){return (state.chats[charId]||[]).slice(-n)}
let localEngine=null, localBrainLoading=null;
function setAiStatus(t){const e=$('#aiStatus');if(e)e.textContent=t}
function detectIntent(raw){
 const t=String(raw||'').trim().toLowerCase(), has=r=>r.test(t);
 if(has(/뭐가\s*웃|뭐가웃|왜\s*웃/))return'challenge_laugh';
 if(has(/아니|그게\s*아니|무슨\s*말|뭘\s*이해|아니라고/))return'correction';
 if(has(/왜|어째서/))return'why';
 if(has(/뭐\s*해|뭐해|하고\s*있/))return'whatdoing';
 if(has(/어디/))return'where';
 if(has(/언제/))return'when';
 if(has(/누구/))return'who';
 if(has(/몇\s*도|날씨|기온|온도/))return'weather';
 if(has(/배고|허기|꼬르륵/))return'hungry';
 if(has(/추워|춥|추웡|쌀쌀|으슬/))return'cold';
 if(has(/더워|덥|더웡|후덥/))return'hot';
 if(has(/졸려|졸리|졸림|잠와|잠 와/))return'sleepy';
 if(has(/피곤|지쳤|지침/))return'tired';
 if(has(/아파|아픔|머리아|배아|속아/))return'sick';
 if(has(/심심|지루/))return'bored';
 if(has(/짜증|빡쳐|화나|열받/))return'angry';
 if(has(/속상|슬퍼|울고|눈물|ㅠ|ㅜ/))return'sad';
 if(has(/무서|겁나/))return'scared';
 if(has(/외로|외롭/))return'lonely';
 if(has(/ㅋㅋ|ㅎㅎ|하하|웃겨|웃김/))return'laugh';
 if(has(/비.*올|비올|비\s*올/))return'rainfeel';
 if(has(/눈.*올|눈올|눈\s*올/))return'snowfeel';
 if(has(/고마|감사/))return'thanks';
 if(has(/미안|죄송/))return'sorry';
 if(has(/안녕|ㅎㅇ|하이|헬로/))return'greeting';
 if(has(/맞아|그러게|그치|그렇지|ㅇㅇ/))return'agree';
 if(has(/나도|저도/))return'same';
 if(has(/괜찮|걱정/))return'concern';
 if(has(/사랑|좋아해|보고싶|그리워/))return'affection';
 if(has(/축하|생일/))return'celebrate';
 if(has(/도와|어쩌지|어떻게\s*해/))return'help';
 if(/[?？]$/.test(t))return'question';
 return'statement';
}
function lightweightReply(c,userText,context={}){
 const raw=String(userText||'').trim(), intent=detectIntent(raw);
 const thread=(context?.thread||[]);
 const lastOwn=[...thread].reverse().find(x=>x.who===c?.id)?.text||'';
 const targetText=context?.targetComment?.text||'';
 const parentText=context?.parentComment?.text||'';
 const formal=(c?.speech||'').includes('존댓')||c?.id==='jeonghun';
 const F=(a,b)=>formal?a:b;
 const post=context?.post, tc=context?.targetComment;
 if(tc){
   const quoted=String(tc.text||'');
   if(intent==='statement' && raw.length<=30){
     if(/일하|근무|출근/.test(raw)) return F('아, 지금 일하고 계시는군요. 많이 바쁘십니까?','아, 지금 일하는 중이구나. 많이 바빠?');
     if(/먹|밥|식사/.test(raw)) return F('아, 지금 드시는 중이군요. 무엇을 드십니까?','아, 지금 먹는 중이구나. 뭐 먹어?');
     if(/집|퇴근|들어왔/.test(raw)) return F('아, 지금은 집에 계시는군요. 오늘 고생 많으셨습니다.','아, 지금 집이구나. 오늘 고생했네.');
   }
   if(intent==='challenge_laugh')return F(`아, 제가 방금 "${quoted}"라고 한 걸 말씀하시는군요. 그 표현이 웃겼다는 뜻으로 쓴 건데, 이상하게 들렸다면 제가 말을 잘못했습니다.`,`아, 내가 방금 "${quoted}"라고 한 거 말하는 거지. 그 표현이 좀 웃겼다는 뜻이었는데 이상하게 들렸으면 내가 말을 잘못했네.`);
   if(intent==='correction')return F(`제가 방금 "${quoted}"라고 한 뒤에 말씀하신 뜻을 잘못 알아들었습니다. 바로 앞 댓글 기준으로 다시 보겠습니다.`,`내가 방금 "${quoted}"라고 한 뒤에 네 말을 잘못 알아들었네. 바로 앞 댓글 기준으로 다시 볼게.`);
   if(intent==='why')return F(`제가 방금 "${quoted}"라고 한 이유를 물으신 거군요. 그 댓글을 그렇게 받아들여서 한 말이었습니다.`,`내가 방금 "${quoted}"라고 한 이유 물어본 거지. 그 댓글을 그렇게 받아들여서 한 말이었어.`);
   if(intent==='agree')return F('네, 방금 그 말씀에 동의한 겁니다.','응, 방금 그 말에 동의한 거야.');
   if(intent==='same')return F('그러셨군요. 저와 비슷하게 느끼셨나 봅니다.','그래? 너도 비슷하게 느꼈구나.');
 }
 if(post&&post.char===c?.id&&intent==='why'){
   if(post.reason)return F(`아, 원글의 이유를 물으신 거였군요. ${post.reason}.`,`아, 원글 이유 물어본 거구나. ${post.reason}.`);
   return F('아, 원글의 이유를 물으신 거군요. 특별한 이유까지는 적지 않았습니다.','아, 원글 이유 물어본 거구나. 특별한 이유까진 안 적었어.');
 }
 const map={
  hungry:F('배고프십니까? 아직 식사 안 하셨으면 뭐라도 챙겨 드십시오.','배고파? 아직 안 먹었으면 뭐라도 먹자.'),
  cold:F('춥습니까? 얇게라도 하나 더 걸치십시오.','추워? 뭐라도 하나 더 걸쳐.'),
  hot:F('덥습니까? 물은 꼭 챙겨 드십시오.','더워? 물 꼭 챙겨.'),
  sleepy:F('졸리시면 조금이라도 쉬시는 게 좋겠습니다.','졸려? 잠깐이라도 자.'),
  tired:F('많이 피곤하신가 봅니다. 가능하면 조금 쉬십시오.','많이 피곤한가 보네. 좀 쉬어.'),
  sick:F('많이 불편하십니까? 심하면 참지 말고 쉬십시오.','많이 아파? 심하면 참지 말고 좀 쉬어.'),
  bored:F('심심하십니까? 저라도 잠깐 상대해드릴까요?','심심해? 그럼 나랑 좀 얘기할래?'),
  angry:F('무슨 일이 있었습니까? 꽤 화가 나신 것 같습니다.','왜, 무슨 일 있었어? 꽤 화난 것 같은데.'),
  sad:F('무슨 일이 있었습니까? 괜찮으시면 말씀해주셔도 됩니다.','왜, 무슨 일 있었어? 말해도 돼.'),
  scared:F('무서운 일이 있었습니까? 혼자 참지는 마십시오.','무서운 일 있었어? 혼자 참지 마.'),
  lonely:F('외로우셨군요. 지금은 제가 이야기 상대가 되어드리겠습니다.','외로웠어? 지금은 내가 얘기 상대 해줄게.'),
  laugh:F('무슨 일이 그렇게 웃기셨습니까?','뭐가 그렇게 웃겼어 ㅋㅋ'),
  rainfeel:F('그러게요. 딱 비가 올 것 같은 공기나 바람일 때가 있지요.','그러게. 딱 비 올 것 같은 느낌 날 때 있지.'),
  snowfeel:F('눈이 올 것 같은 분위기라는 말씀이군요.','눈 올 것 같은 느낌이라는 거지.'),
  thanks:F('별말씀을요.','뭘. 괜찮아.'),
  sorry:F('괜찮습니다. 너무 신경 쓰지 마십시오.','괜찮아. 너무 신경 쓰지 마.'),
  greeting:F('안녕하세요. 오늘은 어떠셨습니까?','안녕. 오늘 어땠어?'),
  agree:F('네, 저도 그렇게 생각합니다.','응, 나도 그렇게 생각해.'),
  same:F('그러셨군요. 비슷하게 느끼셨나 봅니다.','그래? 너도 비슷하게 느꼈구나.'),
  concern:F('괜찮습니다. 너무 걱정하지 않으셔도 됩니다.','괜찮아. 너무 걱정 안 해도 돼.'),
  affection:F('그렇게 말씀해주시니 기분이 좋군요.','그렇게 말하니까 좀 좋네.'),
  celebrate:F('축하할 일이군요. 정말 잘됐습니다.','오, 축하할 일이네. 잘됐다.'),
  help:F('어떤 부분이 가장 곤란한지 말씀해주시면 같이 생각해보겠습니다.','뭐가 제일 곤란한지 말해봐. 같이 생각해보자.'),
  whatdoing:F(`지금은 ${c.status||'잠깐 쉬고 있습니다'}. 무슨 일 있으십니까?`,`지금은 ${c.status||'좀 쉬고 있어'}. 왜?`),
  where:F(`지금은 ${c.country||'대한민국'} ${c.loc}에 있습니다.`,`나 지금 ${c.country||'대한민국'} ${c.loc}에 있어.`),
  when:F('어느 일을 말씀하시는지 알려주시면 시간부터 확인해보겠습니다.','어느 일 말하는 거야?'),
  who:F('누구를 말씀하시는지 앞 상황을 조금만 더 알려주십시오.','누구 말하는 거야?'),
  weather:F(`${c.loc} 쪽 날씨를 기준으로 보고 있습니다.`,`${c.loc} 쪽 날씨 보고 있어.`),
  correction:F('제가 방금 잘못 알아들었습니다. 다시 말씀해주신 뜻으로 이해하겠습니다.','내가 방금 잘못 알아들었네. 다시 말해준 뜻으로 이해할게.')
 };
 if(map[intent])return map[intent];
 if(intent==='why')return F('바로 앞에서 어떤 말을 두고 물으시는지 확인해보겠습니다.','바로 앞에서 뭐 때문에 그런지 묻는 거지?');
 if(intent==='question')return F('질문하신 내용에 맞춰 말씀드리겠습니다.','물어본 내용에 맞춰 말해볼게.');
 return formal?'그런 일이 있으셨군요.':'아, 그런 일이 있었구나.';
}
async function ensureLocalBrain(){
  setAiStatus('가벼운 모드 사용 중 · 무거운 모델을 휴대폰에 올리지 않습니다.');
  return null;
}
async function brainSystem(c,context={}){
 const post=context.post;
 const thread=(context.thread||[]).slice(-8).map(x=>`${getChar(x.who)?.name||'사용자'}: ${x.text}`).join('\n');
 const chats=recentConversation(c.id,8).filter(x=>!x.pending).map(x=>`${x.me?'사용자':c.name}: ${x.text}`).join('\n');
 const memories=(state.memories[c.id]||[]).slice(-8).join('\n- ');
 const posts=state.posts.filter(p=>p.char===c.id).slice(-3).map(p=>`${p.text}${p.reason?` (실제 이유: ${p.reason})`:''}`).join('\n');
 const cw=await weatherForCharacter(c);
 return `너는 SNS 속 실제 인물 ${c.name}이다. 챗봇이나 도우미가 아니다. 반드시 한국어로 자연스럽게 대화한다.
성격: ${c.bio}
말투: ${c.speech}
현재 상태: ${c.status}
거주지역: ${c.country||'대한민국'} ${c.loc}
현재 현지 시간: ${formatCharacterTime(c,true)}
현재 거주지 날씨: ${cw.city} ${cw.text}
최근 기억:
- ${memories||'특별한 기억 없음'}
최근 내 게시물:
${posts||'없음'}
최근 대화:
${chats||'없음'}
${post?`현재 SNS 원글: ${post.text}
원글의 실제 사건/이유: ${post.event||''} / ${post.reason||''}
현재 댓글 스레드:
${thread}`:''}
규칙:
1. 사용자의 마지막 말의 의미를 먼저 이해하고 그 내용에 직접 반응한다.
2. 짧은 일상 발화에도 친구처럼 자연스럽게 반응한다.
3. 후속 질문은 최근 대화와 게시물의 대상을 이어서 이해한다.
4. 모르는 사실은 지어내지 않는다.
5. 의미 없는 만능 답변은 금지한다.
6. 캐릭터 설정과 말투를 유지한다. 1~2문장 위주로 짧게 답한다.
7. 시스템, 프롬프트, AI 모델, 데이터에 대해 말하지 않는다.
8. 날씨는 필요한 상황에서만 자연스럽게 언급하고, 사용자가 날씨를 말하지 않았는데 수치부터 읊지 않는다.`;
}
async function callBrain(c,userText,context={}){
  // v14 lightweight mode: no model download, no multi-minute initialization.
  // A future external/local engine can replace this one function.
  return lightweightReply(c,userText,context);
}
async function callThreadBrains(owner,userText,p){
 const replies=[];
 const first=await callBrain(owner,userText,{channel:'thread',post:p,thread:p.comments});
 if(first)replies.push({who:owner.id,text:first});
 if($('#bystanderReply')?.checked!==false){
   const pool=state.chars.filter(c=>c.id!==owner.id);
   const eco=$('#ecoMode')?.checked!==false;
   const chance=eco ? .25 : .42;
   if(pool.length && Math.random()<chance){
     const c=pool[Math.floor(Math.random()*pool.length)];
     const prompt=`사용자가 ${owner.name}의 게시물에 "${userText}"라고 댓글을 달았다. 너도 이 스레드를 보고 있다. 정말 끼어들 만하면 네 입장에서 한마디만 자연스럽게 해라.`;
     const t=await callBrain(c,prompt,{channel:'thread_bystander',post:p,thread:[...p.comments,...replies]});
     if(t)replies.push({who:c.id,text:t});
   }
 }
 return replies;
}
function renderFeed(){
 $('#feedList').innerHTML=state.posts.slice().reverse().map(p=>{
   const c=getChar(p.char);
   const target=replyTargets[p.id];
   return `<article class="post">${av(c)}<div class="post-main">
   <div class="post-meta"><b>${c?esc(c.name):'나'}</b><span class="handle">@${c?esc(c.handle):'me'}</span><span class="time">· ${esc(p.time)}</span>${!c ? `<button class="more" data-post-menu="${p.id}">···</button>` : ''}</div>
   <div class="post-text">${esc(p.text)}</div>
   <div class="actions"><button class="action">♡ ${p.likes||0}</button><button class="action">◯ ${(p.comments||[]).length}</button><button class="action">↗</button><button class="action">⌑</button></div>
   <div class="comments">
   ${(p.comments||[]).map(x=>{const cc=getChar(x.who);const parent=x.replyTo?commentById(p,x.replyTo):null;const pc=parent?getChar(parent.who):null;return `<div class="comment ${x.replyTo?'replying':''}">${av(cc,true)}<div class="comment-body">${parent?`<div class="reply-context">↳ ${esc(pc?.name||'나')}에게 답글</div>`:''}<div class="comment-line"><b>${cc?esc(cc.name):'나'}</b>${esc(x.text)}</div>${x.who!=='me'?`<div class="comment-actions"><button class="comment-reply-btn" data-comment-reply="${p.id}" data-comment-id="${x.id}">답글</button></div>`:''}</div></div>`}).join('')}
   ${p.replyStatus?`<div class="thread-status">${p.replyStatus==='loading'?'친구들이 답글을 생각하는 중…':'답글을 만들지 못했어요.'}</div>`:''}
   ${target?`<div class="reply-target">@${esc(getChar(target.who)?.name||'친구')}에게 답글 중 · <button class="comment-reply-btn" data-cancel-reply="${p.id}">취소</button></div>`:''}
   <div class="replybox"><input data-post="${p.id}" placeholder="${target?`@${esc(getChar(target.who)?.name||'친구')}에게 답글`:'답글 게시하기'}"><button data-reply="${p.id}">답글</button></div>
   </div></div></article>`;
 }).join('');
$$('[data-post-menu]').forEach(b=>b.onclick=(e)=>{
  e.stopPropagation();

  const id=Number(b.dataset.postMenu);
  const p=state.posts.find(x=>x.id===id);

  if(!p || p.char!=='me') return;

  document.querySelectorAll('.post-manage-menu')
    .forEach(x=>x.remove());

  const menu=document.createElement('div');
  menu.className='post-manage-menu';

  menu.innerHTML=`
    <button type="button" data-edit-post>수정</button>
    <button type="button" data-delete-post class="delete">삭제</button>
  `;

  b.parentElement.style.position='relative';
  b.parentElement.appendChild(menu);

  menu.querySelector('[data-edit-post]').onclick=(ev)=>{
    ev.stopPropagation();
    menu.remove();

    const text=prompt('게시물 수정',p.text);

    if(text!==null && text.trim()){
      p.text=text.trim();
      p.time='수정됨';
      save();
      renderFeed();
    }
  };

  menu.querySelector('[data-delete-post]').onclick=(ev)=>{
    ev.stopPropagation();
    menu.remove();

    if(confirm('이 게시물을 삭제할까요?')){
      state.posts=state.posts.filter(x=>x.id!==id);
      delete replyTargets[id];
      save();
      renderFeed();
    }
  };
});
 $$('[data-reply]').forEach(b=>b.onclick=()=>replyToPost(Number(b.dataset.reply)));
 $$('[data-comment-reply]').forEach(b=>b.onclick=()=>{
   const pid=Number(b.dataset.commentReply), cid=b.dataset.commentId;
   const p=state.posts.find(x=>x.id===pid), target=commentById(p,cid);
   if(!target)return;
   replyTargets[pid]=target; renderFeed();
   const input=$(`input[data-post="${pid}"]`); if(input){input.focus();input.scrollIntoView({behavior:'smooth',block:'center'});}
 });
 $$('[data-cancel-reply]').forEach(b=>b.onclick=()=>{delete replyTargets[Number(b.dataset.cancelReply)];renderFeed();});
 $$('input[data-post]').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing)replyToPost(Number(i.dataset.post));});
}
function replyToPost(id){
 const p=state.posts.find(x=>x.id===id); if(!p)return;
 const input=$(`input[data-post="${id}"]`), text=input?.value.trim(); if(!text)return;
 let target=replyTargets[id]||null;
if(!target){
  target=[...(p.comments||[])].reverse().find(x=>x.who!=='me')||null;
}
 const mine=newComment('me',text,target?.id||null);
 p.comments.push(mine); input.value=''; save(); renderFeed();
 if(target&&target.who!=='me'){
   const tc=getChar(target.who);
   if(tc) setTimeout(()=>aiReplyToSpecificComment(p,mine,target,tc),250);
 }else{
   setTimeout(()=>aiReplyToPost(p,text),250);
 }
 delete replyTargets[id];
}
async function aiReplyToSpecificComment(p,mine,target,targetChar){
 p.replyStatus='loading';save();renderFeed();
 try{
   const reply=await callBrain(targetChar,mine.text,{channel:'comment_reply',post:p,thread:p.comments,targetComment:target,parentComment:target.replyTo?commentById(p,target.replyTo):null});
   delete p.replyStatus;
   let finalReply=reply;

if(!finalReply){
  finalReply=lightweightReply(
    targetChar,
    mine.text,
    {
      channel:'comment_reply',
      post:p,
      thread:p.comments,
      targetComment:target
    }
  );
}

if(!finalReply){
  finalReply='응, 듣고 있어.';
}

p.comments.push(
  newComment(targetChar.id,finalReply,mine.id)
);

remember(
  targetChar.id,
  `내 댓글 "${target.text}"에 사용자가 "${mine.text}"라고 답했고 나는 "${finalReply}"라고 답했다.`
);
   const owner=getChar(p.char);
   if(owner&&owner.id!==targetChar.id&&owner.id!=='me'&&$('#bystanderReply')?.checked!==false&&Math.random()<.18){
     const extra=await callBrain(owner,mine.text,{channel:'thread_bystander',post:p,thread:p.comments,targetComment:target});
     if(extra)p.comments.push(newComment(owner.id,extra,mine.id));
   }
 }catch(e){
  console.error(e);
  delete p.replyStatus;

  const fallback=lightweightReply(
    targetChar,
    mine.text,
    {
      channel:'comment_reply',
      post:p,
      thread:p.comments,
      targetComment:target
    }
  );

  if(fallback){
    p.comments.push(
      newComment(targetChar.id,fallback,mine.id)
    );
  }
 }
 save();renderFeed();
}
async function aiReplyToPost(p,userText){
 const owner=getChar(p.char);
 if(!owner){
   delete p.replyStatus; save(); renderFeed(); return;
 }
 p.replyStatus='loading'; save(); renderFeed();
 try{
   const replies=await callThreadBrains(owner,userText,p);
   delete p.replyStatus;
   if(Array.isArray(replies)){
     for(const r of replies){
       if(!r?.who||!r?.text)continue;
       p.comments.push(newComment(r.who,r.text));
       remember(r.who,`게시물 스레드에서 사용자가 "${userText}"라고 말했고 나는 "${r.text}"라고 답했다.`);
     }
   }
 }catch(e){
   console.error(e);
   delete p.replyStatus;
   // 경량 모드는 실패하더라도 작성자가 한 마디는 반드시 남김
   const fallback=lightweightReply(owner,userText,{channel:'thread',post:p,thread:p.comments});
   if(fallback)p.comments.push(newComment(owner.id,fallback));
 }
 save(); renderFeed();
}
function renderFriends(){
 $('#friendGrid').innerHTML=state.chars.length?state.chars.map(c=>`<button class="friend-card" data-edit-friend="${esc(c.id)}" style="text-align:left;background:#fff;border-top:0;border-left:0;cursor:pointer;width:100%"><div class="top">${av(c,false,true)}<div style="flex:1"><b>${esc(c.name)}</b><div class="handle">@${esc(c.handle)} · ${esc(c.country||'대한민국')} ${esc(c.loc)}</div></div><span class="handle">수정 ›</span></div><div class="bio">${esc(c.bio||'설정된 소개가 없습니다.')}</div><span class="pill">${esc(c.status||'상태 없음')}</span></button>`).join(''):`<div style="padding:34px 18px;color:var(--muted);grid-column:1/-1;text-align:center">아직 친구가 없어요.<br>+ 친구 추가로 첫 캐릭터를 만들어보세요.</div>`;
 $('#statusList').innerHTML=state.chars.map(c=>`<div class="person">${av(c,true)}<div class="person-copy"><b>${esc(c.name)}</b><span>${esc(c.status||'')}</span></div><i class="dot"></i></div>`).join('');
 $$('[data-edit-friend]').forEach(x=>x.onclick=()=>openFriendEditor(x.dataset.editFriend));
}
let activeChat=null;
function renderChats(){
 $('#chatList').innerHTML=state.chars.map(c=>`<div class="chat-person ${activeChat===c.id?'active':''}" data-chat="${c.id}">${av(c,true)}<div class="person-copy"><b>${esc(c.name)}</b><span>${esc((state.chats[c.id]||[]).slice(-1)[0]?.text||'대화를 시작해보세요.')}</span></div></div>`).join('');
 $$('[data-chat]').forEach(x=>x.onclick=()=>{activeChat=x.dataset.chat;renderChats();renderMessages()})
}
function renderMessages(){const c=getChar(activeChat);$('#chatHeader').textContent=c?`${c.name}  @${c.handle}`:'대화를 선택하세요';$('#chatInput').disabled=!c;$('#sendChatBtn').disabled=!c;$('#messages').innerHTML=c?(state.chats[c.id]||[]).map(m=>`<div class="msgrow ${m.me?'me':''}">${m.me?'':av(c,true)}<div class="msg">${esc(m.text)}</div></div>`).join(''):'';$('#messages').scrollTop=$('#messages').scrollHeight}
async function sendChat(){
 if(!activeChat)return;const i=$('#chatInput'),text=i.value.trim();if(!text)return;
 const cid=activeChat;(state.chats[cid]||=[]).push({me:true,text,time:Date.now()});i.value='';save();renderMessages();renderChats();
 const c=getChar(cid);
 (state.chats[cid]||=[]).push({me:false,text:'생각 중…',pending:true,time:Date.now()});renderMessages();
 const answer=await callBrain(c,text,{channel:'dm',post:latestPostFor(cid)});
 const arr=state.chats[cid]||[];const pending=[...arr].reverse().find(m=>m.pending);
 if(answer){
   if(pending){pending.text=answer;delete pending.pending}else arr.push({me:false,text:answer,time:Date.now()});
   remember(cid,`사용자가 \"${text}\"라고 말했고 나는 \"${answer}\"라고 답했다.`);
 }else if(pending){pending.text='답변을 불러오지 못했어요 · 무료 AI 상태를 확인해 주세요.';pending.system=true;delete pending.pending}
 save();if(activeChat===cid)renderMessages();renderChats();
}
function nav(view){$$('.nav-btn,.mnav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$$('.view').forEach(v=>v.classList.remove('active'));$(`#${view}View`).classList.add('active');const names={feed:'홈',chats:'메시지',friends:'친구',world:'세계 설정'};$('#pageTitle').textContent=names[view];window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-btn,.mnav').forEach(b=>b.onclick=()=>nav(b.dataset.view));
$('#mobileCreate').onclick=$('#desktopCreate').onclick=()=>{nav('feed');setTimeout(()=>$('#postInput').focus(),80)};
$('#postBtn').onclick=()=>{const text=$('#postInput').value.trim();if(!text)return;state.posts.push({id:Date.now(),char:'me',text,time:'방금',likes:0,comments:[],event:'사용자 게시물'});$('#postInput').value='';save();renderFeed();setTimeout(async()=>{
 const p=state.posts[state.posts.length-1];
 const pool=[...state.chars].sort(()=>Math.random()-.5);
 const count=Math.min(pool.length, Math.random()<.35?2:1);
 p.replyStatus='loading';renderFeed();
 try{
   for(const who of pool.slice(0,count)){
     const first=await callBrain(who,text,{channel:'user_post',post:p,thread:p.comments});
     if(first){p.comments.push(newComment(who.id,first));remember(who.id,`사용자가 "${text}"라고 게시했고 나는 "${first}"라고 답글을 달았다.`);}
   }
 }finally{
   delete p.replyStatus;save();renderFeed();
 }
},450)};
$('#sendChatBtn').onclick=sendChat;$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)sendChat()});
let avatarData=null;
function fillFriendCountries(selected='대한민국'){
 const el=$('#friendCountry'); if(!el)return;
 el.innerHTML=Object.keys(worldPlaces).map(c=>`<option ${c===selected?'selected':''}>${c}</option>`).join('');
 fillFriendCities(selected);
}
function fillFriendCities(country,selected=null){
 const el=$('#friendLocation'); if(!el)return;
 const arr=worldPlaces[country]||worldPlaces['대한민국'];
 const city=selected&&arr.some(p=>p.city===selected)?selected:arr[0].city;
 el.innerHTML=arr.map(p=>`<option ${p.city===city?'selected':''}>${p.city}</option>`).join('');
}
function resetFriendForm(){
 $('#friendForm').reset(); $('#editingId').value=''; avatarData=null;
 $('#avatarPreview').style.display='none'; $('#avatarPreview').removeAttribute('src'); $('#avatarPlaceholder').style.display='block';
 $('#friendDialogTitle').textContent='캐릭터 추가'; $('#deleteFriendBtn').style.display='none'; fillFriendCountries('대한민국'); setTimeout(updateFriendWeatherPreview,0);
}
function openFriendEditor(id=null){
 resetFriendForm();
 if(id){
   const c=getChar(id); if(!c)return;
   $('#editingId').value=c.id; $('#friendDialogTitle').textContent='캐릭터 수정'; $('#deleteFriendBtn').style.display='inline-block';
   $('#nameInput').value=c.name||''; $('#handleInput').value=c.handle||''; fillFriendCountries(c.country||'대한민국'); fillFriendCities(c.country||'대한민국',c.loc||'서울'); updateFriendWeatherPreview();
   $('#statusInput').value=c.status||''; $('#speechInput').value=c.speech||''; $('#personalityInput').value=c.bio||'';
   avatarData=c.avatar||null;
   if(avatarData){$('#avatarPreview').src=avatarData;$('#avatarPreview').style.display='block';$('#avatarPlaceholder').style.display='none'}
 }
 $('#friendDialog').showModal();
}
$('#addFriendBtn').onclick=()=>openFriendEditor();
$('#friendCountry').onchange=()=>{fillFriendCities($('#friendCountry').value);updateFriendWeatherPreview();};
$('#friendLocation').onchange=()=>updateFriendWeatherPreview();
function updateFriendWeatherPreview(){
 const el=$('#friendWeatherPreview'); if(!el)return;
 const country=$('#friendCountry')?.value||'대한민국', city=$('#friendLocation')?.value||'서울';
 const arr=worldPlaces[country]||worldPlaces['대한민국'];
 const p=arr.find(x=>x.city===city)||arr[0];
 let local='';
 try{local=new Intl.DateTimeFormat('ko-KR',{timeZone:p.tz,weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date())}catch{}
 el.textContent=`${country} · ${city} · 현지 ${local} · 실제 날씨 자동 반영`;
}
$('#avatarInput').onchange=e=>{
  const f=e.target.files[0];
  if(!f)return;

  const reader=new FileReader();

  reader.onload=()=>{
    const img=new Image();

    img.onload=()=>{
      try{
        const size=320;

        const canvas=document.createElement('canvas');
        canvas.width=size;
        canvas.height=size;

        const ctx=canvas.getContext('2d');

        const scale=Math.max(
          size/img.width,
          size/img.height
        );

        const w=img.width*scale;
        const h=img.height*scale;

        const x=(size-w)/2;
        const y=(size-h)/2;

        ctx.drawImage(img,x,y,w,h);

        avatarData=canvas.toDataURL(
          'image/jpeg',
          0.72
        );

        $('#avatarPreview').src=avatarData;
        $('#avatarPreview').style.display='block';
        $('#avatarPlaceholder').style.display='none';

        const editingId=$('#editingId').value;

        if(editingId){
          const c=getChar(editingId);

          if(c){
            c.avatar=avatarData;

            save();
            renderFriends();
            renderChats();
            renderMessages();
            renderFeed();

            alert('프로필 사진이 저장됐어요.');
          }
        }

      }catch(err){
        console.error(err);
        alert('사진 저장에 실패했어요.');
      }
    };

    img.onerror=()=>{
      alert('이 사진을 불러오지 못했어요.');
    };

    img.src=reader.result;
  };

  reader.readAsDataURL(f);
};
$('#friendForm').addEventListener('submit',e=>{
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();
 const name=$('#nameInput').value.trim(),handle=$('#handleInput').value.trim().replace(/^@/,''); if(!name||!handle)return;
 const editingId=$('#editingId').value;
 if(editingId){
   const c=getChar(editingId); if(!c)return;
   Object.assign(c,{name,handle,country:$('#friendCountry').value,loc:$('#friendLocation').value,speech:$('#speechInput').value.trim()||'자연스럽게 말함',bio:$('#personalityInput').value.trim()||'설정된 성격 설명이 없습니다.',avatar:avatarData,status:$('#statusInput').value.trim()||'온라인'});
 }else{
   const id=handle+'_'+Date.now(); state.chars.push({id,name,handle,country:$('#friendCountry').value,loc:$('#friendLocation').value,speech:$('#speechInput').value.trim()||'자연스럽게 말함',bio:$('#personalityInput').value.trim()||'설정된 성격 설명이 없습니다.',avatar:avatarData,status:$('#statusInput').value.trim()||'온라인'}); state.chats[id]=[]; state.memories[id]=[];
 }
 save(); renderFriends(); renderChats(); renderFeed(); $('#friendDialog').close(); resetFriendForm();
});
$('#deleteFriendBtn').onclick=()=>{
 const id=$('#editingId').value, c=getChar(id); if(!c)return;
 if(!confirm(`${c.name}을(를) 삭제할까요?\n이 캐릭터의 게시물·댓글·DM·기억도 함께 삭제됩니다.`))return;
 state.chars=state.chars.filter(x=>x.id!==id);
 state.posts=state.posts.filter(p=>p.char!==id).map(p=>({...p,comments:(p.comments||[]).filter(cm=>cm.who!==id)}));
 delete state.chats[id]; delete state.memories[id]; if(activeChat===id)activeChat=null;
 save(); renderFriends(); renderChats(); renderMessages(); renderFeed(); $('#friendDialog').close(); resetFriendForm();
};
$('#exportBtn').onclick=()=>{
 const data={roomiVersion:18,exportedAt:new Date().toISOString(),state};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;a.download=`ROOMI-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('#importBtn').onclick=()=>$('#importFile').click();
$('#importFile').onchange=e=>{
 const f=e.target.files[0]; if(!f)return; const r=new FileReader();
 r.onload=()=>{try{const obj=JSON.parse(r.result),incoming=obj.state||obj;if(!Array.isArray(incoming.chars)||!Array.isArray(incoming.posts))throw new Error(); if(!confirm('현재 ROOMI 데이터를 이 백업으로 교체할까요?'))return; state=incoming;state.chats||={};state.memories||={};state.weather||=clone(defaults.weather);save();renderFeed();renderFriends();renderChats();renderMessages();alert('백업을 불러왔어요.')}catch{alert('ROOMI 백업 파일을 읽지 못했어요.')}};r.readAsText(f); e.target.value='';
};
const worldPlaces={
 '대한민국':[
  {city:'서울',lat:37.5665,lon:126.978,tz:'Asia/Seoul'},
  {city:'부산',lat:35.1796,lon:129.0756,tz:'Asia/Seoul'},
  {city:'제주',lat:33.4996,lon:126.5312,tz:'Asia/Seoul'}
 ],
 '일본':[
  {city:'도쿄',lat:35.6762,lon:139.6503,tz:'Asia/Tokyo'},
  {city:'오사카',lat:34.6937,lon:135.5023,tz:'Asia/Tokyo'},
  {city:'삿포로',lat:43.0618,lon:141.3545,tz:'Asia/Tokyo'}
 ],
 '중국':[
  {city:'베이징',lat:39.9042,lon:116.4074,tz:'Asia/Shanghai'},
  {city:'상하이',lat:31.2304,lon:121.4737,tz:'Asia/Shanghai'},
  {city:'광저우',lat:23.1291,lon:113.2644,tz:'Asia/Shanghai'}
 ],
 '대만':[
  {city:'타이베이',lat:25.033,lon:121.5654,tz:'Asia/Taipei'},
  {city:'가오슝',lat:22.6273,lon:120.3014,tz:'Asia/Taipei'}
 ],
 '미국':[
  {city:'뉴욕',lat:40.7128,lon:-74.006,tz:'America/New_York'},
  {city:'로스앤젤레스',lat:34.0522,lon:-118.2437,tz:'America/Los_Angeles'},
  {city:'시카고',lat:41.8781,lon:-87.6298,tz:'America/Chicago'},
  {city:'호놀룰루',lat:21.3069,lon:-157.8583,tz:'Pacific/Honolulu'}
 ],
 '캐나다':[
  {city:'토론토',lat:43.6532,lon:-79.3832,tz:'America/Toronto'},
  {city:'밴쿠버',lat:49.2827,lon:-123.1207,tz:'America/Vancouver'}
 ],
 '영국':[
  {city:'런던',lat:51.5072,lon:-0.1276,tz:'Europe/London'},
  {city:'맨체스터',lat:53.4808,lon:-2.2426,tz:'Europe/London'}
 ],
 '프랑스':[
  {city:'파리',lat:48.8566,lon:2.3522,tz:'Europe/Paris'},
  {city:'니스',lat:43.7102,lon:7.262,tz:'Europe/Paris'}
 ],
 '독일':[
  {city:'베를린',lat:52.52,lon:13.405,tz:'Europe/Berlin'},
  {city:'뮌헨',lat:48.1351,lon:11.582,tz:'Europe/Berlin'}
 ],
 '이탈리아':[
  {city:'로마',lat:41.9028,lon:12.4964,tz:'Europe/Rome'},
  {city:'밀라노',lat:45.4642,lon:9.19,tz:'Europe/Rome'}
 ],
 '스페인':[
  {city:'마드리드',lat:40.4168,lon:-3.7038,tz:'Europe/Madrid'},
  {city:'바르셀로나',lat:41.3874,lon:2.1686,tz:'Europe/Madrid'}
 ],
 '호주':[
  {city:'시드니',lat:-33.8688,lon:151.2093,tz:'Australia/Sydney'},
  {city:'멜버른',lat:-37.8136,lon:144.9631,tz:'Australia/Melbourne'}
 ],
 '싱가포르':[
  {city:'싱가포르',lat:1.3521,lon:103.8198,tz:'Asia/Singapore'}
 ],
 '태국':[
  {city:'방콕',lat:13.7563,lon:100.5018,tz:'Asia/Bangkok'},
  {city:'치앙마이',lat:18.7883,lon:98.9853,tz:'Asia/Bangkok'}
 ],
 '베트남':[
  {city:'하노이',lat:21.0278,lon:105.8342,tz:'Asia/Ho_Chi_Minh'},
  {city:'호찌민',lat:10.8231,lon:106.6297,tz:'Asia/Ho_Chi_Minh'}
 ],
 '필리핀':[
  {city:'마닐라',lat:14.5995,lon:120.9842,tz:'Asia/Manila'},
  {city:'세부',lat:10.3157,lon:123.8854,tz:'Asia/Manila'}
 ]
};
state.world ||= {country:'대한민국',city:state.weather?.loc||'서울',tz:'Asia/Seoul'};
function currentPlace(){
  const arr=worldPlaces[state.world.country]||worldPlaces['대한민국'];
  return arr.find(x=>x.city===state.world.city)||arr[0];
}
function placeForCharacter(c){
  const country=c?.country||'대한민국';
  const arr=worldPlaces[country]||worldPlaces['대한민국'];
  return arr.find(x=>x.city===(c?.loc||''))||arr[0];
}
const weatherCache={};
async function weatherForCharacter(c){
  const p=placeForCharacter(c);
  const key=`${c?.country||'대한민국'}:${p.city}`;
  if(weatherCache[key] && Date.now()-weatherCache[key].at<10*60*1000)return weatherCache[key].data;
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code&timezone=auto`;
    const r=await fetch(url); if(!r.ok)throw new Error('weather');
    const d=await r.json(), x=d.current, code=Number(x.weather_code);
    const rain=(x.precipitation||0)>0 || [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
    const data={city:p.city,country:c?.country||'대한민국',tz:p.tz,temp:x.temperature_2m,feel:x.apparent_temperature,rain,text:`${Math.round(x.temperature_2m)}° · 체감 ${Math.round(x.apparent_temperature)}°${rain?' · 비':' · 비 없음'}`};
    weatherCache[key]={at:Date.now(),data}; return data;
  }catch{
    return {city:p.city,country:c?.country||'대한민국',tz:p.tz,temp:null,feel:null,rain:false,text:'날씨 정보 없음'};
  }
}
function formatCharacterTime(c,long=false){
  const p=placeForCharacter(c);
  try{
    return new Intl.DateTimeFormat('ko-KR',{timeZone:p.tz,...(long?{dateStyle:'full',timeStyle:'short'}:{month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'})}).format(new Date());
  }catch{return new Date().toLocaleString('ko-KR')}
}
function formatWorldTime(long=false){
  const p=currentPlace();
  try{
    return new Intl.DateTimeFormat('ko-KR',{
      timeZone:p.tz,
      ...(long?{dateStyle:'full',timeStyle:'short'}:{month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'})
    }).format(new Date());
  }catch{return new Date().toLocaleString('ko-KR')}
}
function populateCountries(){
  const cs=$('#countrySelect'), ls=$('#locationSelect');
  cs.innerHTML=Object.keys(worldPlaces).map(c=>`<option ${c===state.world.country?'selected':''}>${c}</option>`).join('');
  const arr=worldPlaces[state.world.country]||[];
  if(!arr.some(x=>x.city===state.world.city))state.world.city=arr[0]?.city||'서울';
  ls.innerHTML=arr.map(p=>`<option ${p.city===state.world.city?'selected':''}>${p.city}</option>`).join('');
}
function updateClock(){
  const e=$('#nowWorld');
  if(e)e.textContent=`${state.world.country} · ${formatWorldTime(false)}`;
}
setInterval(updateClock,1000);
async function loadWeather(){
  const p=currentPlace();
  let label='날씨 연결 대기 중';
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code&timezone=auto`;
    const r=await fetch(url);
    if(!r.ok)throw new Error('weather');
    const d=await r.json(),c=d.current;
    const code=Number(c.weather_code);
    const rain=(c.precipitation||0)>0 || [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
    state.weather={
      loc:p.city,country:state.world.country,tz:p.tz,
      temp:c.temperature_2m,feel:c.apparent_temperature,rain,
      text:`${Math.round(c.temperature_2m)}° · 체감 ${Math.round(c.apparent_temperature)}°`
    };
    label=`${rain?'🌧':'☀'} ${p.city} · ${state.weather.text}`;
    save();
  }catch{
    state.weather={loc:p.city,country:state.world.country,tz:p.tz,temp:null,feel:null,rain:false,text:'날씨를 불러오지 못함'};
    label=`◌ ${p.city} · 날씨 연결 실패`;
  }
  $('#weatherPill').textContent=label;
  $('#mobileWeather').textContent=label;
  updateClock();
}
$('#countrySelect').onchange=()=>{
  state.world.country=$('#countrySelect').value;
  const first=worldPlaces[state.world.country][0];
  state.world.city=first.city; state.world.tz=first.tz;
  save(); populateCountries(); loadWeather(); updateClock();
};
$('#locationSelect').onchange=()=>{
  state.world.city=$('#locationSelect').value;
  state.world.tz=currentPlace().tz;
  save(); loadWeather(); updateClock();
};
populateCountries();updateClock();
loadWeather();renderFeed();renderFriends();renderChats();renderMessages();
