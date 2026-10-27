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
      word => `比起一直猜下去，你更愿意把话问清楚。问到了要紧处，反倒能安静下来。今天抽到「${word}」，像给这份心思起了个名字。`,
      word => `你会在做决定前多看一眼：什么值得留下，什么可以放过。偶尔也会看得太久，连饭都忘了吃。「${word}」这张签，就先陪你坐一会儿。`,
      word => `门口的守门人没有急着开门，他想先看清来的是谁。你大概懂这种迟疑。至于「${word}」意味着什么，可以吃饭时慢慢想。`
    ]),
    'iron-peak-transform': Object.freeze([
      word => `遇到走不通的地方，你会想试试别的办法。有时候只改一小处，事情就动起来了。今天的题目是「${word}」，你已经有点想动手了。`,
      word => `旧办法失灵的时候，你偶尔会生出一点好奇：换个做法会怎样？这张写着「${word}」的签，倒像一页还没画完的草图。`,
      word => `发明家的桌上有几样拆开的东西，也有一件快做成了。你可能更惦记后面那件。「${word}」写在草稿边上，暂时还用不着解释。`
    ]),
    'iron-ground-origin': Object.freeze([
      word => `嘴上说着该换了，拿起来又觉得还能修。熟悉的东西用久了，确实不容易放手。今天抽到「${word}」，也许会让你想起其中一件。`,
      word => `东西坏了，你愿意先看看坏在哪里。真修好了，未必会拿去给谁看，自己用着顺手就挺高兴。「${word}」这张签，送给这点耐心。`,
      word => `修补匠把松掉的零件重新装好，又试着转了两下。你喜欢的可能就是这个瞬间：熟悉的东西又能用了。签上写着「${word}」。`
    ]),
    'iron-ground-transform': Object.freeze([
      word => `事情一多，你会想先理出个顺序。哪件先做，哪件可以等等，排清楚了才安心。「${word}」是今天的题目，晚饭也该有个位置。`,
      word => `你喜欢看着零散的东西一点点有了样子。有时已经够用了，手上却还想再改一处。今天抽到「${word}」，先记在图纸旁边吧。`,
      word => `建筑师退后两步，看了看刚搭好的架子。还有地方要改，不过已经站得住了。你大概也喜欢这样的进展。今天这张签叫「${word}」。`
    ]),
    'pan-peak-origin': Object.freeze([
      word => `你会记得一句随口说过的话，也会留意后来有没有回音。有时等来的只是小事，却足够高兴一阵。今天这封信，封面写着「${word}」。`,
      word => `有些消息看过就忘了，有些会让你过一会儿又点开。你在意的，大概是里面那句说得恰好的话。「${word}」这封信，留给你自己拆。`,
      word => `收信人把信封翻过来，看了一眼寄信的地址，才慢慢拆开。你或许也会在这样的细节上停一停。信纸上只有一个题目：「${word}」。`
    ]),
    'pan-peak-transform': Object.freeze([
      word => `同样一桌人，换个座位、换首歌，气氛就不一样了。你愿意为这些小变化花点心思。今天这场戏，暂且叫作「${word}」。`,
      word => `你脑子里常常还有另一个版本：这里换一下，那里留一会儿，也许更好。今天抽到「${word}」，倒很像一场还在排练的戏。`,
      word => `导演刚想喊停，演员却接出了一句意料之外的话。他想了想，又坐了回去。「${word}」这场戏，也可以留一点临场发挥。`
    ]),
    'pan-ground-origin': Object.freeze([
      word => `走在熟悉的路上，你也会被一扇亮着灯的窗吸引。没什么特别的事，只是愿意多看一眼。今天抽到「${word}」，适合这样的停顿。`,
      word => `你对舒服的记忆，可能来自很小的地方：灯亮着，座位空着，人终于能坐下来。「${word}」这张签，也留在这里。`,
      word => `看灯人坐在窗边，等街上的声音渐渐小下去。你或许也喜欢一天里这样的空当。今天这幅画的名字是「${word}」。`
    ]),
    'pan-ground-transform': Object.freeze([
      word => `几件小事各自看着普通，凑在一起，就成了不错的一天。你愿意给它们留点时间。今天这段日常，有个名字叫「${word}」。`,
      word => `你喜欢事情慢慢接上的感觉，不一定马上就能说出缘由。等过了一阵再看，前后就连起来了。「${word}」先记在今天这一页。`,
      word => `编织者停下来比了比颜色，又换了一根线。整幅图还没出现，手里这一小段已经很好看。今天的题目是「${word}」。`
    ]),
    'hotpot-peak-origin': Object.freeze([
      word => `话说了很多，你还是会惦记那个没问明白的地方。与其猜来猜去，你想再问一句。今天抽到「${word}」，恰好适合这份好奇。`,
      word => `热闹的时候，你也会留意话里有没有漏掉什么。一个小细节对上了，前面的事才说得通。「${word}」这张签，就放在那个问号旁边。`,
      word => `打捞人看见水面下有东西闪了一下，便俯下身去看。你可能也不太愿意错过这样的线索。今天这幅画叫「${word}」。`
    ]),
    'hotpot-peak-transform': Object.freeze([
      word => `你愿意把平时不放在一起的东西凑起来试试。未必次次成功，偶尔试对了就很开心。「${word}」是今天的新配方，还没尝过。`,
      word => `照着做当然省心，你却常会想：加一点这个呢？好奇心到了饭桌上，也会变成胃口。今天抽到的签叫「${word}」。`,
      word => `炼金师把瓶子挪近了一点，想看看两种颜色混起来的样子。你大概也在等那个意外出现。瓶上的标签写着「${word}」。`
    ]),
    'hotpot-ground-origin': Object.freeze([
      word => `回想一次聚会，你可能先记起谁笑了，谁说到一半停住了。那些细节会比话题留得更久。今天抽到「${word}」，或许正好让你想起一幕。`,
      word => `你愿意听人把话说完。有些事当时没想明白，过几天再想，才听出另一层意思。「${word}」这张签，也可以过一会儿再看。`,
      word => `见证人坐在人群里，记下了一次停顿和一个笑容。故事还没结束，他也没有急着下结论。今天这一页的标题是「${word}」。`
    ]),
    'hotpot-ground-transform': Object.freeze([
      word => `一起吃饭时，你会留意有没有人还没说上话。让大家都自在一点，是件值得费心的小事。「${word}」这张签，也给你留了个座位。`,
      word => `两个人各说各的，你有时能听见他们其实在意同一件事。把这句话说出来，聊天便容易了些。今天抽到的题目是「${word}」。`,
      word => `外交官把椅子往旁边挪了挪，桌边便多坐下一个人。话题还在继续，饭菜也刚好上齐。这一桌的故事，暂且叫「${word}」。`
    ]),
    'claypot-peak-origin': Object.freeze([
      word => `你有些舍不得丢的东西，未必常拿出来看。知道它还在原处，就觉得安心。今天抽到「${word}」，可能会让你想起那个抽屉。`,
      word => `一件东西为什么要留着，有时很难向别人解释。你记得它是怎么来的，这个理由就已经足够。「${word}」这张签，可以和它放在一起。`,
      word => `保管员打开柜门，确认东西还好好放着，又轻轻关上。你大概懂那种看一眼便放心的感觉。今天的题目是「${word}」。`
    ]),
    'claypot-peak-transform': Object.freeze([
      word => `要去新的地方，你会想带上几件用惯了的东西。行李里有它们，陌生的房间也容易住下来。今天抽到「${word}」，像旅行手记的第一页。`,
      word => `旧东西换个用法，仍然能陪着人往前走。你喜欢的，也许就是这种既熟悉又新鲜的感觉。「${word}」是这次出发的名字。`,
      word => `造船师摸了摸旧木板，把它装到了新船上。留下来的纹路仍然看得清楚，船却已经能下水了。船名还没定，纸上写着「${word}」。`
    ]),
    'claypot-ground-origin': Object.freeze([
      word => `熟悉的声音、常坐的位置，会让你觉得一天终于安稳下来。有些习惯留着，日子就容易接着过。今天抽到「${word}」，也有这样的意味。`,
      word => `你喜欢知道有些东西还和昨天一样。回到熟悉的地方，连灯开关的位置都不用找。「${word}」这张签，放在灯下正合适。`,
      word => `守夜人听着远处最后一点人声，给自己倒了杯热水。夜还长，他把椅子拉近了一些。今天这段小故事叫「${word}」。`
    ]),
    'claypot-ground-transform': Object.freeze([
      word => `旧事再讲一次，有时会想起以前忽略的细节。你喜欢顺着它往下讲，看故事还能走到哪里。今天这一篇，题目是「${word}」。`,
      word => `你记住的故事里，常有些不太起眼的小插曲。大事讲完了，它们倒还让人想聊几句。「${word}」这张签，适合拿来当个话头。`,
      word => `说书人讲到一半，想起漏了一个细节，于是笑着补上。桌边的人也跟着想起了别的事。这篇叫作「${word}」的故事，又长了一点。`
    ])
  });

  const imageCache = new Map();
  const IMAGE_TIMEOUT = 8000;

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

  async function browserImageSource(src, signal) {
    if (!/\.svg(?:$|\?)/i.test(src)) return src;
    const response = await fetch(src, { cache: 'force-cache', signal });
    if (!response.ok) throw new Error(`persona asset request failed: ${src}`);
    const markup = await response.text();
    if (!/^\s*<svg[\s>]/i.test(markup)) throw new Error(`persona SVG is invalid: ${src}`);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const request = new Promise((resolve, reject) => {
      const controller = new AbortController();
      let image;
      const timer = setTimeout(() => {
        controller.abort();
        finish(new Error(`persona asset timed out: ${src}`));
        if (image) image.src = '';
      }, IMAGE_TIMEOUT);
      function finish(error) {
        clearTimeout(timer);
        if (image) image.onload = image.onerror = null;
        if (error) reject(error);
        else resolve(image);
      }
      browserImageSource(src, controller.signal).then(browserSrc => {
        if (controller.signal.aborted) return;
        image = new Image();
        image.decoding = 'async';
        image.onload = () => finish();
        image.onerror = () => finish(new Error(`persona asset failed: ${src}`));
        image.src = browserSrc;
      }).catch(finish);
    })
      .catch(error => {
        imageCache.delete(src);
        throw error;
      });
    imageCache.set(src, request);
    return request;
  }

  function compose(art) {
    const { background, character, pot } = art.layers;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('persona canvas unavailable');

    ctx.drawImage(background, 0, 285, 1080, 1350, 0, 0, 1080, 1350);
    ctx.drawImage(pot, 300, 660, 780, 780);
    ctx.drawImage(character, 10, 340, 680, 1008);

    return canvas;
  }

  async function load(profile, meal, selectedDetail) {
    const detail = selectedDetail || describe(profile);
    if (!detail) return null;

    const [background, character, pot] = await Promise.all([
      loadImage(detail.backgroundUrl),
      loadImage(detail.characterUrl),
      loadImage(detail.potUrl)
    ]);
    return Object.freeze({
      ...detail,
      meal,
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

  window.FoodPickerPersonaArt = Object.freeze({ describe, load, compose, manifest, verdicts });
})();
