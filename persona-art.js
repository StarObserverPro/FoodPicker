(() => {
  'use strict';

  const ROOT = '/assets/persona/r3';

  const PERSONAS = Object.freeze({
    'iron-peak-origin': ['iron-gatekeeper', '守门人'],
    'iron-peak-transform': ['iron-inventor', '发明家'],
    'iron-ground-origin': ['iron-mender', '修补匠'],
    'iron-ground-transform': ['iron-architect', '建筑师'],
    'pan-peak-origin': ['pan-receiver', '收信人'],
    'pan-peak-transform': ['pan-director', '导演'],
    'pan-ground-origin': ['pan-lamplighter', '看灯人'],
    'pan-ground-transform': ['pan-weaver', '编织者'],
    'hotpot-peak-origin': ['hotpot-salvager', '打捞人'],
    'hotpot-peak-transform': ['hotpot-alchemist', '炼金师'],
    'hotpot-ground-origin': ['hotpot-witness', '见证人'],
    'hotpot-ground-transform': ['hotpot-diplomat', '外交官'],
    'claypot-peak-origin': ['claypot-keeper', '保管员'],
    'claypot-peak-transform': ['claypot-shipwright', '造船师'],
    'claypot-ground-origin': ['claypot-nightwatch', '守夜人'],
    'claypot-ground-transform': ['claypot-storyteller', '说书人']
  });

  const BACKGROUND_GROUPS = Object.freeze([
    ['dark-bridge', new Set('真相 临界 清醒 直觉 岔路 野心 偏航 逆风 失控'.split(' '))],
    ['light-stage', new Set('心愿 远方 破晓 暗门 序章 彩蛋 浪漫 高光 奇迹 谜底 答案 转机 梦想 冒险'.split(' '))],
    ['dark-lantern', new Set('黄昏 微光 长夜 深夜 失眠 心事 回声 暗流 雨季 退潮 潮汐 秘密 昨日 故乡 旧梦 尾声'.split(' '))],
    ['light-river', new Set('余温 晚班 日常 备用 旧时 后记 底色 后台 归途 周末 慢拍 雾气 余地 后院'.split(' '))]
  ]);

  const ORACLES = Object.freeze({
    'iron-peak-origin': word => `你认门槛，也认东西。哪儿不对，你多半嘴上不说，手已经把线划出来了。今儿浮着「${word}」，该定的定，别拿拖着当稳妥。`,
    'iron-peak-transform': word => `你一见旧办法卡壳，脑子就开始拆墙。别人嫌折腾，你偏觉得这才有点意思。今儿浮着「${word}」，能改局，先别忙着给老规矩面子。`,
    'iron-ground-origin': word => `你嘴上说算了，散掉的东西还是会一件件捡回来。你信手艺，也信余温。今儿浮着「${word}」，把该收的尾收好，别顺手把自己也缝进去。`,
    'iron-ground-transform': word => `你受不了东西总悬着。乱局到了你手里，总得重新搭成一个能过日子的样子。今儿浮着「${word}」，先归位，别再给自己加层。`,
    'pan-peak-origin': word => `你一直给世界留着个收件地址。看着随和，心里其实很会等那一下正好。今儿浮着「${word}」，先接住，别急着追问它为什么现在才来。`,
    'pan-peak-transform': word => `你一看气氛不对，就想换灯、换位、换个说法。日子落到你手里，总要重新排一遍才肯开场。今儿浮着「${word}」，加点戏可以，别把自己也剪没了。`,
    'pan-ground-origin': word => `你不抢着赶路，先看哪儿还有一点亮。越乱的时候，你越知道该守住什么。今儿浮着「${word}」，收一收脚步，别拿硬冲当清醒。`,
    'pan-ground-transform': word => `你会把几件没关系的小事缝成自己的日子。别人催着要答案，你总想先留点余地。今儿浮着「${word}」，松一点，别把每个空白都排满。`,
    'hotpot-peak-origin': word => `你看着能聊，最烦话说半截。人多事杂，你总能捞出那句大家绕着不肯说的。今儿浮着「${word}」，问到底，装糊涂这招今天不灵。`,
    'hotpot-peak-transform': word => `你不怕东西混在一起，只怕混完还是原样。手边有点什么，你就敢炼第二种可能。今儿浮着「${word}」，可以试配，照抄今天没意思。`,
    'hotpot-ground-origin': word => `你记人很少记结论，记的是当时谁坐哪儿，谁忽然没说话。场面里的暗流，你比别人早半拍听见。今儿浮着「${word}」，多听一会儿，别急着替谁收尾。`,
    'hotpot-ground-transform': word => `你天生会给不同的人留位置。桌子只要还没掀，事情就有下一轮。今儿浮着「${word}」，该圆的圆，自己的那口也别让出去。`,
    'claypot-peak-origin': word => `你把要紧的东西收得很深。平时不显山露水，真碰到在意的，护得比谁都严。今儿浮着「${word}」，留一份，别一激动全清空。`,
    'claypot-peak-transform': word => `你恋旧，也真舍得往前走。舍不得的东西，你会给它换个装法，一起带去下一站。今儿浮着「${word}」，该启程了，旧账就别装船。`,
    'claypot-ground-origin': word => `你总会替一些东西多守一会儿。别人散场了，你还在看那盏灯到底灭没灭。今儿浮着「${word}」，该养的养，别把自己熬成灯芯。`,
    'claypot-ground-transform': word => `旧事到了你这儿，总能重新讲到日子接得下去。你记得很多，也知道哪一页该翻。今儿浮着「${word}」，回味可以，别把昨儿又过一遍。`
  });

  const imageCache = new Map();
  const compositeCache = new Map();

  function profileId(profile) {
    return profile?.archetypeId || profile?.archetype?.id || '';
  }

  function backgroundKey(word) {
    return BACKGROUND_GROUPS.find(([, words]) => words.has(word))?.[0] || 'light-river';
  }

  function describe(profile) {
    const id = profileId(profile);
    const [assetKey, role] = PERSONAS[id] || [];
    if (!assetKey) return null;

    const word = profile?.word || profile?.archetype?.defaultWord || '今日';
    const pot = profile?.archetype?.pot || '';
    const background = backgroundKey(word);

    return Object.freeze({
      id,
      word,
      role,
      title: `${pot} · ${word}${role}`.replace(/^ · /, ''),
      verdict: ORACLES[id](word),
      theme: background.startsWith('dark-') ? 'dark' : 'light',
      backgroundUrl: `${ROOT}/backgrounds/${background}.svg`,
      characterUrl: `${ROOT}/characters/${assetKey}.png`,
      potUrl: `${ROOT}/pots/${assetKey}.png`
    });
  }

  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const request = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`persona asset failed: ${src}`));
      image.src = src;
    });
    imageCache.set(src, request);
    return request;
  }

  async function composite(background, character, pot) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('persona canvas unavailable');

    ctx.drawImage(background, 0, 285, 1080, 1350, 0, 0, 1080, 1350);
    ctx.drawImage(pot, 300, 660, 780, 780);
    ctx.drawImage(character, 10, 340, 680, 1008);

    return loadImage(canvas.toDataURL('image/png'));
  }

  async function load(profile, meal) {
    const detail = describe(profile);
    if (!detail) return null;

    const [background, character, pot] = await Promise.all([
      loadImage(detail.backgroundUrl),
      loadImage(detail.characterUrl),
      loadImage(detail.potUrl)
    ]);
    const compositeKey = [detail.backgroundUrl, detail.characterUrl, detail.potUrl].join('|');
    if (!compositeCache.has(compositeKey)) {
      compositeCache.set(compositeKey, composite(background, character, pot));
    }
    const image = await compositeCache.get(compositeKey);

    return Object.freeze({
      ...detail,
      meal,
      image,
      layers: Object.freeze({ background, character, pot })
    });
  }

  const manifest = Object.freeze(Object.fromEntries(
    Object.keys(PERSONAS).map(id => {
      const [assetKey, role] = PERSONAS[id];
      return [id, Object.freeze({
        role,
        characterUrl: `${ROOT}/characters/${assetKey}.png`,
        potUrl: `${ROOT}/pots/${assetKey}.png`
      })];
    })
  ));

  window.FoodPickerPersonaArt = Object.freeze({ describe, load, manifest });
})();
