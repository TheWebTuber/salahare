/* Salahare's public livestreams — client-side YouTube Data API v3.
 * Reads channels.list(forHandle), playlistItems.list(uploads), videos.list.
 * Filters for real stream events via liveStreamingDetails, not ordinary uploads.
 * Also reads URLs literally present in the channel's public description.
 * No server, GitHub Actions, or .github directory required.
 */
(()=>{
  'use strict';
  const config=window.SAL_YOUTUBE_CONFIG||{};
  const apiKey=String(config.apiKey||'').trim();
  const hasKey=apiKey.length>15&&!/PASTE|PLACEHOLDER|YOUR_|EXAMPLE/i.test(apiKey);
  const channelHandle=String(config.channelHandle||'Salahare').replace(/^@/,'');
  const limit=Math.min(12,Math.max(1,Number(config.maxStreams)||6));
  const ttl=Math.max(5,Number(config.cacheMinutes)||60)*60*1000;
  const cacheKey='sal-deepsea-streams-v1-'+channelHandle.toLowerCase();
  const grid=document.getElementById('stream-grid');
  const status=document.getElementById('stream-status');
  const updated=document.getElementById('stream-updated');
  const refresh=document.getElementById('refresh-streams');
  const image=document.getElementById('youtube-avatar');
  const more=document.getElementById('extra-links');
  const moreList=document.getElementById('extra-links-list');
  const make=(type,cls,text)=>{let n=document.createElement(type);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  if(image) image.addEventListener('error',()=>{if(!image.src.endsWith('/img/favicon.png'))image.src='img/favicon.png'});
  function relativeTime(date){if(!date||!Number.isFinite(Date.parse(date)))return 'YouTube';return new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
  function safeAvatar(url){if(typeof url!=='string')return false;try{const u=new URL(url);return u.protocol==='https:'&&(/(^|\.)googleusercontent\.com$/.test(u.hostname)||/(^|\.)ytimg\.com$/.test(u.hostname));}catch{return false;}}
  function showAvatar(avatar){if(avatar&&safeAvatar(avatar)&&image)image.src=avatar;}
  function channelDescriptionLinks(description){
    const urls=[...String(description||'').matchAll(/https?:\/\/[^\s<>"'\]\[()]+/gi)].map(m=>m[0].replace(/[.,;!?]+$/,''));
    const seen=new Set();const result=[];
    for(const url of urls){try{const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))continue;if(parsed.hostname.toLowerCase().includes('youtube.com'))continue;const fixed=parsed.href;if(seen.has(fixed))continue;seen.add(fixed);result.push({url:fixed,host:parsed.hostname.replace(/^www\./,'')});}catch{}}
    return result.slice(0,12);
  }
  function renderLinks(links){if(!more||!moreList)return;moreList.replaceChildren();const extras=(links||[]).filter(v=>v&&typeof v.url==='string').slice(0,12);const seen=new Set();for(const item of extras){try{const url=new URL(item.url);if(!['http:','https:'].includes(url.protocol))continue;const host=url.hostname.replace(/^www\./,'');if(seen.has(url.href))continue;seen.add(url.href);const a=make('a','',`${host} ↗`);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.title=url.href;moreList.appendChild(a);}catch{}}more.hidden=moreList.childElementCount===0;}
  function renderStreams(items){
    grid.replaceChildren();
    if(!items.length){showEmpty('There are no recent public livestream archives in the uploads scanned. Visit Sal’s channel to check what is live or coming next.');return;}
    for(const video of items.slice(0,limit)){
      if(!/^[a-zA-Z0-9_-]{11}$/.test(video.id))continue;
      const a=make('a','stream-card');a.href=`https://www.youtube.com/watch?v=${video.id}`;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`Watch ${video.title} on YouTube`);
      const poster=make('div','stream-image');const img=make('img');img.src=video.thumbnail&&video.thumbnail.startsWith('https://')?video.thumbnail:`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;img.alt='';img.loading='lazy';poster.appendChild(img);poster.appendChild(make('span','play-icon','▶'));const tag=make('span','stream-tag'+(video.isLive?' is-live':''),video.isLive?'LIVE NOW':'PAST LIVESTREAM');poster.appendChild(tag);
      const body=make('div','stream-body');body.appendChild(make('h3','',video.title||'Untitled livestream'));const meta=make('div','stream-meta');meta.appendChild(make('span','',relativeTime(video.date)));meta.appendChild(make('span','','Watch ↗'));body.appendChild(meta);a.append(poster,body);grid.appendChild(a);
    }
    if(grid.childElementCount===0)showEmpty('No public streams could be displayed.');
  }
  function showEmpty(message){grid.replaceChildren();const card=make('div','stream-placeholder');card.appendChild(make('span','placeholder-icon','✧'));card.appendChild(make('h3','', 'The viewing deck is quiet for now.'));card.appendChild(make('p','',message));const a=make('a','', 'Check the streams on YouTube ↗');a.href='https://www.youtube.com/@Salahare/streams';a.target='_blank';a.rel='noopener noreferrer';card.appendChild(a);grid.appendChild(card);}
  async function api(resource,params){
    const qs=new URLSearchParams({...params,key:apiKey});
    const res=await fetch(`https://www.googleapis.com/youtube/v3/${resource}?${qs}`,{headers:{Accept:'application/json'}});
    let body;try{body=await res.json()}catch{throw Error(`YouTube returned HTTP ${res.status}.`)}
    if(!res.ok||body.error)throw Error(body?.error?.message||`YouTube error ${res.status}`);
    return body;
  }
  function store(data){try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),data}))}catch{}}
  function getStored(){try{const cache=JSON.parse(localStorage.getItem(cacheKey)||'null');return cache&&Date.now()-cache.time<ttl?cache:null}catch{return null}}
  function apply(data,fromCache){showAvatar(data.avatar);renderLinks(data.links);renderStreams(data.streams||[]);status.textContent=data.streams?.length?`${data.streams.length} latest public livestream${data.streams.length===1?'':'s'} found on @${channelHandle}.`:'The channel is connected, but no public livestreams were found in recent uploads.';updated.textContent=fromCache?'Saved results · up to 1 hour old':`Updated ${new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`;}
  async function load(force=false){
    if(!hasKey){showEmpty('Add your restricted YouTube Data API key to js/youtube-config.js to load Sal’s newest streams automatically.');status.textContent='Live feed needs your YouTube API key to activate.';updated.textContent='';refresh.disabled=true;refresh.title='Add your API key first';return;}
    if(!force){const cached=getStored();if(cached){apply(cached.data,true);return;}}
    refresh.disabled=true;status.textContent='Scanning the ocean for recent streams…';updated.textContent='';
    try{
      const channel=await api('channels',{part:'snippet,contentDetails,brandingSettings',forHandle:channelHandle,maxResults:1});
      const info=channel.items?.[0];if(!info)throw Error('The channel handle could not be found.');
      const thumbs=info.snippet?.thumbnails||{};const avatar=(thumbs.high||thumbs.medium||thumbs.default||{}).url||'';
      const links=channelDescriptionLinks([info.snippet?.description,info.brandingSettings?.channel?.description].filter(Boolean).join('\n'));
      const uploads=info.contentDetails?.relatedPlaylists?.uploads;
      if(!uploads)throw Error('This channel has no public uploads playlist.');
      // Use uploads playlist rather than search.list (search costs 100 units/request).
      let token='';const ids=[];const scanPages=3;
      for(let p=0;p<scanPages;p++){
        const data=await api('playlistItems',{part:'contentDetails',playlistId:uploads,maxResults:50,...(token?{pageToken:token}:{})});
        for(const item of data.items||[]){const id=item.contentDetails?.videoId;if(typeof id==='string'&&id.length===11&&!ids.includes(id))ids.push(id);}
        token=data.nextPageToken||'';if(!token||ids.length>=150)break;
      }
      const videos=[];
      for(let i=0;i<ids.length;i+=50){const out=await api('videos',{part:'snippet,liveStreamingDetails',id:ids.slice(i,i+50).join(',')});videos.push(...(out.items||[]));}
      const streams=videos.filter(v=>{
        const d=v.liveStreamingDetails;return Boolean(d?.actualStartTime)||v.snippet?.liveBroadcastContent==='live';
      }).map(v=>{
        const t=v.snippet?.thumbnails||{};
        return {id:v.id,title:v.snippet?.title||'Livestream',date:v.liveStreamingDetails?.actualStartTime||v.snippet?.publishedAt||'',isLive:v.snippet?.liveBroadcastContent==='live',thumbnail:(t.maxres||t.standard||t.high||t.medium||t.default||{}).url||''};
      }).sort((a,b)=>Number(b.isLive)-Number(a.isLive)||(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,limit);
      const finalData={streams,links,avatar};store(finalData);apply(finalData,false);
    }catch(err){const fallback=getStored();if(fallback){apply(fallback.data,true);status.textContent='YouTube could not be refreshed; showing saved results.';}else{showEmpty('YouTube could not be reached. The channel link still works.');status.textContent='Unable to load videos: '+String(err.message||'Unknown error');}console.warn('Salahare YouTube feed:',err);}
    finally{refresh.disabled=false;}
  }
  refresh.addEventListener('click',()=>load(true));
  load();
})();
