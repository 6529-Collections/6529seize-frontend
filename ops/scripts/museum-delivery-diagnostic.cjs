const { chromium } = require('@playwright/test');
const { writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const mediaHosts = new Set(['media-proxy.artblocks.io', 'core-api.artblocks.io', 'artblocks-mainnet.s3.amazonaws.com']);
const records = [];
const cleanUrl = (value) => { const u = new URL(value); return u.origin + u.pathname; };
const mediaUrl = (value) => { try { return mediaHosts.has(new URL(value).hostname); } catch { return false; } };
const selectedHeaders = (headers) => Object.fromEntries(Object.entries(headers).filter(([key]) => ['content-type','content-length','cache-control','server','x-cache','retry-after','x-content-type-options'].includes(key.toLowerCase())));
(async () => {
 const browser = await chromium.launch();
 try {
  for (let round = 0; round < 4; round++) {
   const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
   const page = await context.newPage();
   const cdp = await context.newCDPSession(page);
   await cdp.send('Network.enable');
   const urls = new Map();
   cdp.on('Network.requestWillBeSent', e => {
    if (!mediaUrl(e.request.url)) return;
    urls.set(e.requestId, e.request.url);
    records.push({ round, event:'request', id:e.requestId, url:cleanUrl(e.request.url), redirect:e.redirectResponse ? { status:e.redirectResponse.status, url:cleanUrl(e.redirectResponse.url), headers:selectedHeaders(e.redirectResponse.headers) } : undefined });
   });
   cdp.on('Network.responseReceivedExtraInfo', e => { if (urls.has(e.requestId)) records.push({round,event:'extra-info',id:e.requestId,status:e.statusCode,headers:selectedHeaders(e.headers)}); });
   cdp.on('Network.responseReceived', e => { if (urls.has(e.requestId)) records.push({round,event:'response',id:e.requestId,status:e.response.status,url:cleanUrl(e.response.url),mime:e.response.mimeType,headers:selectedHeaders(e.response.headers)}); });
   cdp.on('Network.loadingFailed', async e => {
    if (!urls.has(e.requestId)) return;
    const record = {round,event:'failed',id:e.requestId,url:cleanUrl(urls.get(e.requestId)),error:e.errorText,blockedReason:e.blockedReason};
    try { const r = await cdp.send('Network.getResponseBody',{requestId:e.requestId}); const body = Buffer.from(r.body, r.base64Encoded ? 'base64':'utf8'); record.body = {length:body.length,sha256:createHash('sha256').update(body).digest('hex'),prefixClass:body.subarray(0,100).toString().startsWith('<') ? 'markup':'other'}; } catch { record.body = 'unavailable'; }
    records.push(record);
   });
   for (const path of ['/museum/network/collection','/museum/network/acquisitions','/museum/network/artists/casey-reas','/museum/network/gifts/6529NM.2026.001']) {
    await page.goto('https://6529.io'+path,{waitUntil:'domcontentloaded'});
    await page.locator('main').last().waitFor();
    await page.evaluate(async () => { for(let y=0;y<document.body.scrollHeight;y+=700) {scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} });
    await page.waitForTimeout(8000);
    records.push({round,path,event:'images',images:await page.locator('main img').evaluateAll(imgs=>imgs.map(i=>({alt:i.alt,src:i.currentSrc,complete:i.complete,width:i.naturalWidth}))),alerts:await page.locator('main [role=alert]').allTextContents()});
   }
   await context.close();
  }
  // A separate request only: not proof of the body rejected by Chromium.
  const replayUrl='https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png';
  const replay=await fetch(replayUrl);
  records.push({event:'separate-http-replay',status:replay.status,url:cleanUrl(replay.url),headers:selectedHeaders(Object.fromEntries(replay.headers)),length:(await replay.arrayBuffer()).byteLength});
  for(let round=0;round<3;round++) for(const stored of ['true','false']) {
   const context=await browser.newContext({viewport:{width:1440,height:900}});
   const page=await context.newPage();
   await page.addInitScript(s=>sessionStorage.setItem('sidebarCollapsed',s),stored);
   const starts=new Map();
   const timings=[];
   let release; const gate=new Promise(r=>release=r);
   await page.route(/\/_next\/.*\.js(?:\?.*)?$/,async route=>{await gate;await route.continue();});
   page.on('request',r=>{if(r.resourceType()==='script') starts.set(r,Date.now());});
   page.on('requestfinished',r=>{if(starts.has(r)) timings.push({path:new URL(r.url()).pathname,durationMs:Date.now()-starts.get(r)});});
   page.on('pageerror',e=>records.push({event:'pageerror',message:e.message}));
   await page.goto('https://6529.io/',{waitUntil:'commit'});
   await page.locator('[data-sidebar-ready]').waitFor();
   const start=Date.now(); release();
   let hydrated=true;
   try {await page.waitForSelector('[data-sidebar-ready=true]',{timeout:30000});} catch {hydrated=false;}
   records.push({event:'sidebar',round,stored,hydrated,releaseToReadyMs:Date.now()-start,timings});
   await context.close();
  }
 } finally { await browser.close();writeFileSync('diagnostic-results.json',JSON.stringify(records,null,2)); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
