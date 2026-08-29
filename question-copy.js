(() => {
  'use strict';

  const ENGINE = window.FOOD_PICKER_ENGINE;
  if (!ENGINE) return;

  const profileCopy = [
    {
      id: 'close-the-day',
      phase: '随手一问',
      text: '忙乱一天，总算收工。哪一下最像：得，今儿到这儿？',
      hint: '别挑应该的，挑顺手的。',
      options: [
        ['换鞋出门，溜达一圈', '先把白天甩开'],
        ['洗个热水澡', '泡会儿，脑子自己停'],
        ['顺手把尾巴收掉', '留着更膈应'],
        ['开点熟悉的声音', '屋里有点人气就行']
      ]
    },
    {
      id: 'stalled-room',
      phase: '随手一问',
      text: '几个人聊了半天，事儿还卡着。一般先来哪一下？',
      hint: '哪种最解堵，点哪种。',
      options: [
        ['先拿个能干的版本出来', '跑起来再说'],
        ['先把卡在哪儿捋清楚', '别瞎催'],
        ['把那句没人说的话说了', '绕着更累'],
        ['换个说法，重新拼一遍', '没准就接上了']
      ]
    },
    {
      id: 'friend-response',
      phase: '随手一问',
      text: '人有点蔫，朋友也看出来了。怎么来最舒服？',
      hint: '都是好意，只看哪种不费劲。',
      options: [
        ['一句话说中我卡哪儿了', '难听点也行'],
        ['别问，陪我坐会儿', '先不用解释'],
        ['把最烦那件事接过去', '少一桩是一桩'],
        ['聊点别的，把气氛带开', '先换口气']
      ]
    },
    {
      id: 'weekend-memory',
      phase: '随手一问',
      text: '想起一个挺好的周末，最先回来的是哪样？',
      hint: '第一下想到什么，就是什么。',
      options: [
        ['一个特别亮的瞬间', '就那一下'],
        ['一整天都挺顺', '没大事也舒服'],
        ['一个特别小的细节', '声音、光、表情'],
        ['几件小事串起来的气氛', '单看都普通']
      ]
    },
    {
      id: 'inhabited-room',
      phase: '随手一问',
      text: '一个地儿住到什么时候，才算真住进去了？',
      hint: '别想装修，想自己待着。',
      options: [
        ['有件东西一看就是我的', '它镇得住屋'],
        ['东西都有固定位置', '不用满屋找'],
        ['光、声、味儿都对了', '待着就舒服'],
        ['有个角落能整个窝进去', '到那儿不用端着']
      ]
    }
  ];

  const calibratorCopy = {
    heat: {
      phase: '再补一句',
      text: '白捡一个下午，怎么过最不亏？',
      hint: '就普通下午，别上价值。',
      options: [
        ['出门，去个没去过的地方', '最好真有点动静'],
        ['不安排，想到哪儿算哪儿', '空着也挺值钱'],
        ['把拖很久的小事做掉', '从清单上划掉它'],
        ['就在熟悉的地方晃悠', '心情自己换挡']
      ]
    },
    texture: {
      phase: '再补一句',
      text: '有人发来半句话，没头没尾。后面怎么接最省心？',
      hint: '不是考情商。',
      options: [
        ['直接问：到底想说什么？', '说清楚，大家省事'],
        ['先放着，等他想好再说', '别硬往外拽'],
        ['把我的理解说一遍', '让他点个头'],
        ['先接住情绪', '字面以后再说']
      ]
    },
    focus: {
      phase: '再补一句',
      text: '一件大事终于做完。哪一下最像：齐活？',
      hint: '不是汇报，是自己心里。',
      options: [
        ['最后一个关键点扣上了', '就这一声，够了'],
        ['所有零碎一起跑顺了', '整体顺就行'],
        ['有人看见最难那一步', '那块没白折腾'],
        ['第二天生活恢复正常', '过去了就挺好']
      ]
    },
    meaning: {
      phase: '再补一句',
      text: '用了好多年的东西坏了。怎么处理最对味？',
      hint: '不谈钱。',
      options: [
        ['照原来的样子修好', '它本来什么样很重要'],
        ['把能用的改成别的东西', '旧东西再活一次'],
        ['留下一小块最有痕迹的', '那块是真的就行'],
        ['干脆重新设计', '现在好用更要紧']
      ]
    }
  };

  const dailyCopy = [
    {
      id: 'world-request',
      phase: '今天这会儿',
      text: '接下来的两个小时，你最希望世界对你做什么？',
      hint: '别解释，挑一个。',
      options: [
        ['别再让我作决定', '后面别再来选择题'],
        ['给我一个明确的刺激', '把今天从灰里敲醒'],
        ['让我觉得今天还算值得', '留个像样的结尾'],
        ['让周围重新有一点人声', '热闹点，别再闷着']
      ]
    },
    {
      id: 'bandwidth',
      phase: '今天这会儿',
      text: '今晚你还愿意为一顿饭留下多少精神带宽？',
      hint: '凭第一反应。',
      options: [
        ['最好连第二步都没有', '定下来就完事'],
        ['可以有一个小小步骤', '有点意思，别复杂'],
        ['今晚可以认真一点', '多两步也无所谓'],
        ['步骤随意，但别太沉', '轻一点收尾']
      ]
    }
  ];

  function applyQuestion(target, source) {
    if (!target || !source) return;
    target.phase = source.phase;
    target.text = source.text;
    target.hint = source.hint;
    source.options.forEach(([title, sub], index) => {
      if (!target.options[index]) return;
      target.options[index].title = title;
      target.options[index].sub = sub;
    });
  }

  profileCopy.forEach(source => {
    applyQuestion(
      ENGINE.PROFILE_QUESTIONS.find(question => question.id === source.id),
      source
    );
  });

  Object.entries(calibratorCopy).forEach(([key, source]) => {
    applyQuestion(ENGINE.CALIBRATORS[key], source);
  });

  dailyCopy.forEach(source => {
    applyQuestion(
      ENGINE.DAILY_QUESTIONS.find(question => question.id === source.id),
      source
    );
  });

})();
