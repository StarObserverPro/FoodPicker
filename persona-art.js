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

  const ORACLE_BANKS = Object.freeze({
    'iron-peak-origin': Object.freeze([
      word => `你那条线画得比谁都快。嘴上不出声，手已经替你做了主了。今天「${word}」来了，别拿拖着当稳妥。`,
      word => `你心里那杆秤从来没收起来过。「${word}」搁在面前了，称一称，该扔的扔，该留的留。慢慢来。`,
      word => `你就是那个在门口站着不说话的人。进来什么、挡回去什么，你比谁都清楚。「${word}」到了，把门带上就行。`
    ]),
    'iron-peak-transform': Object.freeze([
      word => `一遇到走不通的，你第一个念头就是拆。别人觉得折腾，你管那叫开门。今儿「${word}」算是个好由头，改就改了。`,
      word => `旧法子走到头了，你不难过，反倒有点兴奋。「${word}」给你递了把新工具，别客气，上手吧。`,
      word => `你不怕乱，怕的是不乱。乱了才有新东西能长出来。「${word}」来了，拆哪儿都行，别拆到自己脚底下站着的那块。`
    ]),
    'iron-ground-origin': Object.freeze([
      word => `你嘴上总说算了，回头又去捡。捡就捡吧，可别顺手把自己也补进去。那些「${word}」碎掉的东西，有些归了灰，有些归你。`,
      word => `你看不得东西坏着。哪怕别人都说没用了，你还是会蹲下来看一看。「${word}」碎得不大，补一补还能用，就是别把手也划了。`,
      word => `世上的人有两种，一种扔，一种捡。你是后一种。「${word}」落了地，拣要紧的拾起来就行，剩下的扫了吧。`
    ]),
    'iron-ground-transform': Object.freeze([
      word => `最烦事情悬在半空。一到你手里，总得给它搭出个样子来。「${word}」放上去了，就别再往上压什么了。`,
      word => `你看得见每一块砖该往哪儿放。这是天赋，也是负担。「${word}」到了，把架子搭稳就收手，别再加层了。`,
      word => `乱就乱吧，但乱完了得有个说法。你就是那个给说法的人。「${word}」归到位了，剩下的交给时间就行。`
    ]),
    'pan-peak-origin': Object.freeze([
      word => `你给这世界留了一个永远能寄到你的地址。很多事等着等着就过去了。可今天「${word}」到了。先拆开看，别问它迟不迟。`,
      word => `你擅长等，但不擅长收到之后不琢磨。「${word}」拆开看了，搁那儿就行，不用写回信。`,
      word => `别人发出去的东西石沉大海，你这边永远有个收件箱还开着。「${word}」躺在里头了，打开看一眼，然后该干嘛干嘛去。`
    ]),
    'pan-peak-transform': Object.freeze([
      word => `只要气氛不对，你第一反应就是换点东西。换灯换座换说法，都成。「${word}」这场不用重排，让它自个儿演去。`,
      word => `你总觉得剧本还能再改改。改到最后一刻才算安心。「${word}」这段词挺好的，别动了，让演员自己接。`,
      word => `你一人兼了导演和场务。哪儿卡住了，你第一个冲上去。「${word}」这个镜头一次过，喊卡之前先问问自己累不累。`
    ]),
    'pan-ground-origin': Object.freeze([
      word => `你不爱挤到最前面，先看哪儿还亮着。这习惯救过你不少次了。今晚「${word}」不算亮，倒也够你站着看一会儿的。`,
      word => `你总在别人急着赶路的时候停下来，看光从哪儿来的。「${word}」暗了一点，灯还没灭，你也该往前走了。`,
      word => `你守着那一点还没全暗的意思。「${word}」还在那儿晃着，你看见了，这就够了。不用追。`
    ]),
    'pan-ground-transform': Object.freeze([
      word => `你会把几件不相干的小事绕成一天。别人催着要答案，你只想再留个活口。「${word}」先搁一边吧，不用急着织进去。`,
      word => `你手里的线从来不断，只是走得慢。「${word}」是根新线，绕不绕都行，先放着也不坏。`,
      word => `最怕别人问你“想好了吗”，你总想再等等看。「${word}」就在桌角上，不织进去也没人怪你。`
    ]),
    'hotpot-peak-origin': Object.freeze([
      word => `一群人说话绕来绕去的，你总能捞出那句最真的。今天「${word}」就在水面上浮着，你倒是问不问呢？`,
      word => `你不怕场面冷，怕的是场面热但没人说真话。「${word}」沉到底了，你伸手捞一下，不费什么事。`,
      word => `你就是那个一桌子人都绕着一个话题走，你一把拎出来的人。「${word}」飘着呢，你不捞谁捞？`
    ]),
    'hotpot-peak-transform': Object.freeze([
      word => `你不怕乱，就怕乱了跟没乱一样。手边但凡有点料，你就敢往里头配。今儿「${word}」放进去搅一搅，管它什么方子不方子。`,
      word => `你相信好东西都是混出来的。但多一分少一分，你心里有数。「${word}」搁进去了，成不成另说，先搅了再说。`,
      word => `标准答案到你这儿，只够当条起跑线。「${word}」今天要当主材，你就围着它转。`
    ]),
    'hotpot-ground-origin': Object.freeze([
      word => `你记人从来不记结论。你记的是谁突然不说话了。那些暗流，你比别人早半拍听见。「${word}」像阵风似的过去了，别急着去总结什么。`,
      word => `你在场的时候，很多事情不用说出来你也知道。「${word}」到了，听着就行，不用替任何人圆场。`,
      word => `你就是屋子角落那个比谁听得都清楚的人。「${word}」落了，散就散了，不用追。`
    ]),
    'hotpot-ground-transform': Object.freeze([
      word => `你天生会给每个人留一把椅子。只要桌子还没掀，你就能接着聊下去。「${word}」在桌上转了一圈，该你说话了，也别把位子全让出去。`,
      word => `一群人里你最会搭桥。谁跟谁有缝隙，你总能找块木板铺上去。「${word}」横在中间了，能绕就绕，绕不过再搬。`,
      word => `你太知道怎么让人舒服了，有时候舒服到忘了自己也在桌上。「${word}」转到你面前了，该夹菜夹菜，别光给人倒酒。`
    ]),
    'claypot-peak-origin': Object.freeze([
      word => `你把在意的东西藏得很深，别人看不出来。可真碰到要紧的，你护得比谁都狠。「${word}」来了，留一份是留一份，别一上头就全给扔了。`,
      word => `你有一个只有自己知道密码的抽屉。里面放什么，从不跟人交代。「${word}」放进去也行，不放也行，但别因为今天心情好就清空它。`,
      word => `你守护的东西别人看不见，可你自己知道没了它会塌。「${word}」在门口了，看一眼，锁好，该干嘛干嘛。`
    ]),
    'claypot-peak-transform': Object.freeze([
      word => `你念旧，可也是真敢往前走。舍不得的东西，你总想着打包带走。「${word}」在催了，装船之前先把那点旧账扔了吧。`,
      word => `旧木头到你手里，也能继续派上用场。你总能把过去改成能用的东西。「${word}」是新水，船该下了，岸上那些就别往回搬了。`,
      word => `你是那种搬家的时候连旧门牌都要带走的人。可你也是第一个上船的人。「${word}」起风了，解缆吧，箱子少一个也没事。`
    ]),
    'claypot-ground-origin': Object.freeze([
      word => `别人散场了，你还在那儿守着，也没等谁，只觉得那盏灯不该灭。今儿「${word}」照了一夜了，今晚你先躺下吧。`,
      word => `你替很多人守过后半夜。天亮之前那段最难熬的时候，你醒着。「${word}」到了，今晚有人替你，你睡你的。`,
      word => `你守着那盏灯，灯也陪你熬到了这会儿。「${word}」暗了，灯还在，你先退一步吧。`
    ]),
    'claypot-ground-transform': Object.freeze([
      word => `旧事到你嘴里，总能讲出个过得去的结尾。你记得很多，也知道哪段该掐。「${word}」翻过这一页了，就别再回头看了。`,
      word => `故事搁你嘴里，再烂的尾你都能圆回来。可你自己的事你老不讲。「${word}」就是新的一章了，写新的吧，旧的别校对了。`,
      word => `你是那种一群人坐下来，最后都听你讲的人。「${word}」这个段子讲完就撂下，别往回找补。`
    ])
  });

  const imageCache = new Map();
  const compositeCache = new Map();

  function profileId(profile) {
    return profile?.archetypeId || profile?.archetype?.id || '';
  }

  function backgroundKey(word) {
    return BACKGROUND_GROUPS.find(([, words]) => words.has(word))?.[0] || 'light-river';
  }

  function verdicts(profile) {
    const id = profileId(profile);
    const word = profile?.word || profile?.archetype?.defaultWord || '今日';
    return Object.freeze((ORACLE_BANKS[id] || []).map(template => template(word)));
  }

  function describe(profile, variantIndex) {
    const id = profileId(profile);
    const [assetKey, role] = PERSONAS[id] || [];
    if (!assetKey) return null;

    const word = profile?.word || profile?.archetype?.defaultWord || '今日';
    const pot = profile?.archetype?.pot || '';
    const background = backgroundKey(word);
    const options = verdicts(profile);
    const variant = Number.isInteger(variantIndex)
      ? ((variantIndex % options.length) + options.length) % options.length
      : Math.floor(Math.random() * options.length);

    return Object.freeze({
      id,
      word,
      role,
      title: `${pot} · ${word}${role}`.replace(/^ · /, ''),
      verdict: options[variant],
      variant,
      theme: background.startsWith('dark-') ? 'dark' : 'light',
      backgroundUrl: `${ROOT}/backgrounds/${background}.svg`,
      characterUrl: `${ROOT}/characters/${assetKey}.png`,
      potUrl: `${ROOT}/pots/${assetKey}.png`
    });
  }

  async function browserImageSource(src) {
    if (!/\.svg(?:$|\?)/i.test(src)) return src;
    const response = await fetch(src, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`persona asset request failed: ${src}`);
    const markup = await response.text();
    if (!/^\s*<svg[\s>]/i.test(markup)) throw new Error(`persona SVG is invalid: ${src}`);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const request = browserImageSource(src)
      .then(browserSrc => new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`persona asset failed: ${src}`));
        image.src = browserSrc;
      }))
      .catch(error => {
        imageCache.delete(src);
        throw error;
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

  async function load(profile, meal, selectedDetail) {
    const detail = selectedDetail || describe(profile);
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
        verdictCount: ORACLE_BANKS[id].length,
        characterUrl: `${ROOT}/characters/${assetKey}.png`,
        potUrl: `${ROOT}/pots/${assetKey}.png`
      })];
    })
  ));

  window.FoodPickerPersonaArt = Object.freeze({ describe, load, manifest, verdicts });
})();
