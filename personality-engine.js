(() => {
  'use strict';

  const VERSION = '2.0.0';
  const PROFILE_STORAGE_KEY = 'foodpicker.profile.v2';
  const HISTORY_STORAGE_KEY = 'foodpicker.meal-history.v2';

  const AXES = Object.freeze([
    { key: 'heat', positive: '焰', negative: '浸', question: '变化更像火花，还是渗透' },
    { key: 'texture', positive: '棱', negative: '融', question: '满足需要反馈，还是承接' },
    { key: 'focus', positive: '峰', negative: '底', question: '一顿靠主角成立，还是靠底盘成立' },
    { key: 'meaning', positive: '本', negative: '调', question: '相信原来的质地，还是重新编排' }
  ]);

  const PROFILE_QUESTIONS = Object.freeze([
    {
      id: 'close-the-day',
      phase: '日常投射',
      text: '一个特别乱的工作日终于结束。哪一刻最像“今天真的到此为止了”？',
      hint: '选那个会让肩膀先松下来一点的，不选你觉得更健康的。',
      options: [
        { icon: '↗', title: '门一关，立刻出去走一圈', sub: '需要一个清楚的切换，别让白天继续跟着', axis: { heat: 2, texture: 1 } },
        { icon: '≈', title: '洗个很久的热水澡', sub: '不处理，让脑子自己慢慢安静下来', axis: { heat: -2, texture: -1 } },
        { icon: '□', title: '把最后一件没收尾的东西归位', sub: '不是爱劳动，是需要一个准确的句号', axis: { focus: 2, meaning: 1 } },
        { icon: '…', title: '打开熟悉的声音，让房间恢复生活', sub: '等光线、声音和呼吸重新接到一起', axis: { focus: -2, meaning: -1 } }
      ]
    },
    {
      id: 'stalled-room',
      phase: '行动取样',
      text: '几个人讨论了很久，事情仍然没有结论。你最容易先做什么？',
      hint: '不是问你在工作里必须怎么做，是问哪一步最让你觉得局面终于动了。',
      options: [
        { icon: '→', title: '扔出一个今天就能执行的版本', sub: '先让现实发生，细节可以追上来', axis: { heat: 2, focus: 1 } },
        { icon: '∿', title: '把每个人真正卡住的地方慢慢捋开', sub: '先别催，问题可能还没泡透', axis: { heat: -2, meaning: 1 } },
        { icon: '!', title: '指出大家一直绕开的那句实话', sub: '宁可有一点刺，也不要继续含糊', axis: { texture: 2, meaning: 1 } },
        { icon: '⌘', title: '重新组织问题，让几种意见能接上', sub: '答案不一定只有一个，关系可以重排', axis: { meaning: -2, focus: -1 } }
      ]
    },
    {
      id: 'friend-response',
      phase: '关系取样',
      text: '朋友看出你状态不对。哪一种反应最容易让你真的松一口气？',
      hint: '四种都算关心。选你今天最不需要防备的那一种。',
      options: [
        { icon: '“”', title: '把你卡在哪里说得很准', sub: '哪怕不太好听，至少终于有人说清楚', axis: { texture: 2, meaning: 1 } },
        { icon: '·', title: '不追问，只是安静陪着', sub: '暂时不用解释，也不用马上好起来', axis: { texture: -2, heat: -1 } },
        { icon: '✓', title: '直接替你接走最麻烦的那一环', sub: '先把真正压人的重点拿掉', axis: { focus: 2, heat: 1 } },
        { icon: '↺', title: '把气氛拧回来，让你先离开原来的情绪', sub: '不是回避，是换一种排列再看', axis: { meaning: -2, focus: -1 } }
      ]
    },
    {
      id: 'weekend-memory',
      phase: '记忆投射',
      text: '回想一个很好的周末，你通常最先记住什么？',
      hint: '不要挑最值得发朋友圈的，挑那个会自己浮上来的。',
      options: [
        { icon: '✦', title: '一个特别亮的具体时刻', sub: '整段记忆被那一下钉住了', axis: { focus: 2, heat: 1 } },
        { icon: '—', title: '从早到晚整段时间的节奏', sub: '没有高光，但每一段都接得刚好', axis: { focus: -2, heat: -1 } },
        { icon: '⌁', title: '一个很小、但非常真实的细节', sub: '材料、声音、表情，本来的样子就够了', axis: { meaning: 2, texture: 1 } },
        { icon: '∞', title: '几件无关的事后来怎样串成一种气氛', sub: '意义不是在那里，是后来被你连出来的', axis: { meaning: -2, texture: -1 } }
      ]
    },
    {
      id: 'inhabited-room',
      phase: '空间投射',
      text: '一个房间怎样才算真正被你住进去了？',
      hint: '不是装修审美。想象你在里面待了很久以后，最不能少的东西。',
      options: [
        { icon: '◆', title: '有一件非常对的东西成为中心', sub: '看见它，整个房间就有了主语', axis: { focus: 2, meaning: 1 } },
        { icon: '▦', title: '每件东西都有清楚、固定的位置', sub: '不用找，也没有模糊的临时状态', axis: { texture: 2, meaning: 1 } },
        { icon: '◌', title: '光线、声音和气味开始互相托起来', sub: '房间不是物件之和，而是一层被调出来的气候', axis: { meaning: -2, heat: -1 } },
        { icon: '⌒', title: '有一个能让人彻底陷进去的角落', sub: '在那里不必一直保持形状', axis: { texture: -2, focus: -1 } }
      ]
    }
  ]);

  const CALIBRATORS = Object.freeze({
    heat: {
      id: 'calibrate-heat',
      phase: '轻微校准',
      text: '临时空出一个下午。哪一种用法最不容易让你后悔？',
      hint: '这题只是补一笔，不会推翻前面。',
      options: [
        { icon: '↗', title: '立刻去一个没去过的地方', sub: '下午要有一次明显发生', axis: { heat: 3, focus: 1 } },
        { icon: '≈', title: '不安排，让它自己慢慢展开', sub: '空白如果被填满，就不再是空白了', axis: { heat: -3, focus: -1 } },
        { icon: '⚑', title: '做掉一件拖了很久的小事', sub: '要一个立刻看得见的变化', axis: { heat: 2, texture: 1 } },
        { icon: '☁', title: '待在熟悉的地方，等心情换季', sub: '不需要转折，只需要它慢慢过去', axis: { heat: -2, texture: -1 } }
      ]
    },
    texture: {
      id: 'calibrate-texture',
      phase: '轻微校准',
      text: '别人发来一句很含糊的话。哪种后续最让你舒服？',
      hint: '不问沟通技巧，只问你的神经系统喜欢什么。',
      options: [
        { icon: '?', title: '直接问：你到底想说什么？', sub: '最好给边界，也给答案', axis: { texture: 3, meaning: 1 } },
        { icon: '…', title: '先放着，等对方愿意说完整', sub: '不把还没长好的东西硬拽出来', axis: { texture: -3, heat: -1 } },
        { icon: '│', title: '把自己的理解复述一遍，让对方确认', sub: '可以温和，但不能没有轮廓', axis: { texture: 2, meaning: 1 } },
        { icon: '○', title: '先回应情绪，不急着确认字面', sub: '有些话需要先被接住，再被说明', axis: { texture: -2, focus: -1 } }
      ]
    },
    focus: {
      id: 'calibrate-focus',
      phase: '轻微校准',
      text: '做完一件很大的事，哪个瞬间最有“完成了”的感觉？',
      hint: '选那个最像奖励，而不是最像汇报。',
      options: [
        { icon: '●', title: '最后一个关键点被准确扣上', sub: '那一下足以代表整件事', axis: { focus: 3, texture: 1 } },
        { icon: '▱', title: '所有零散部分终于顺畅地一起运行', sub: '没有主角，整体就是答案', axis: { focus: -3, heat: -1 } },
        { icon: '★', title: '有人真正看见了其中最难的一步', sub: '重点被看见，辛苦才有名字', axis: { focus: 2, meaning: 1 } },
        { icon: '≈', title: '生活悄悄恢复了正常节奏', sub: '事情不是被庆祝，而是被放回日常', axis: { focus: -2, texture: -1 } }
      ]
    },
    meaning: {
      id: 'calibrate-meaning',
      phase: '轻微校准',
      text: '一件用了很多年的旧东西坏了。你更容易被哪种处理打动？',
      hint: '不是问环保，也不是问预算。',
      options: [
        { icon: '◇', title: '尽量照原来的样子修好', sub: '时间留下的身份不该被轻易改写', axis: { meaning: 3, texture: 1 } },
        { icon: '↬', title: '把还能用的部分改成另一件东西', sub: '关系一换，旧东西可以开始新生活', axis: { meaning: -3, heat: 1 } },
        { icon: '⌁', title: '留下一小块最有痕迹的部分', sub: '真实材料比完整造型更重要', axis: { meaning: 2, focus: 1 } },
        { icon: '✧', title: '请人重新设计，让它变得更像现在的你', sub: '纪念不必复刻，转译也可以忠诚', axis: { meaning: -2, focus: -1 } }
      ]
    }
  });

  const DAILY_QUESTIONS = Object.freeze([
    {
      id: 'world-request',
      phase: '今日天气',
      text: '接下来的两个小时，你最希望世界对你做什么？',
      hint: '本命锅格不变，这题只决定今天浮在上面的那层天气。',
      options: [
        { icon: '○', title: '别再让我作决定', sub: '给我一件稳稳落地、不会继续追问的事', mood: { comfort: 4, easy: 4, familiar: 2 } },
        { icon: '!', title: '给我一个明确的刺激', sub: '把今天从灰色里敲醒一下', mood: { stimulus: 5, spicy: 3, crisp: 2 } },
        { icon: '✦', title: '让我觉得今天还算值得', sub: '晚饭至少应该像一个小小的事件', mood: { reward: 5, ritual: 4, novel: 2 } },
        { icon: '♬', title: '让周围重新有一点人声', sub: '不一定聊天，但别再像独自值夜', mood: { social: 5, shareable: 4, comfort: 1 } }
      ]
    },
    {
      id: 'bandwidth',
      phase: '今日天气',
      text: '今晚你还愿意为一顿饭留下多少精神带宽？',
      hint: '诚实一点。带宽不足不是道德问题。',
      options: [
        { icon: '0%', title: '最好连第二步都没有', sub: '快、熟、少收拾，吃完这件事就结束', mood: { easy: 5, familiar: 3, comfort: 2 } },
        { icon: '1×', title: '可以有一个小小步骤', sub: '愿意等一会儿，但别把晚饭做成项目', mood: { comfort: 3, easy: 2, fresh: 1 } },
        { icon: '3×', title: '今晚可以认真一点', sub: '既然要吃，就让过程和摆上桌都成立', mood: { ritual: 5, reward: 3, social: 1 } },
        { icon: '↟', title: '步骤随意，但别太沉', sub: '想恢复一点轻盈，不想背着晚饭睡觉', mood: { light: 5, fresh: 4, novel: 1 } }
      ]
    }
  ]);

  const ARCHETYPES = Object.freeze({
    '++++': { id: 'iron-peak-origin', pot: '铁锅', role: '守门人', defaultWord: '真相', center: [1, 1, 1, 1], words: [
      ['真相', ['clarity', 'familiar']], ['临界', ['stimulus']], ['清醒', ['light', 'clarity']], ['直觉', ['novel']], ['破晓', ['reward', 'fresh']], ['岔路', ['novel', 'stimulus']]
    ]},
    '+++-': { id: 'iron-peak-transform', pot: '铁锅', role: '发明家', defaultWord: '野心', center: [1, 1, 1, -1], words: [
      ['野心', ['reward', 'stimulus']], ['偏航', ['novel']], ['逆风', ['stimulus']], ['临界', ['stimulus', 'ritual']], ['奇迹', ['reward', 'novel']], ['失控', ['spicy', 'stimulus']]
    ]},
    '++-+': { id: 'iron-ground-origin', pot: '铁锅', role: '修补匠', defaultWord: '余温', center: [1, 1, -1, 1], words: [
      ['余温', ['comfort']], ['晚班', ['easy', 'familiar']], ['日常', ['familiar']], ['备用', ['easy']], ['旧时', ['comfort', 'familiar']], ['后记', ['reward', 'comfort']]
    ]},
    '++--': { id: 'iron-ground-transform', pot: '铁锅', role: '建筑师', defaultWord: '日常', center: [1, 1, -1, -1], words: [
      ['日常', ['familiar']], ['底色', ['comfort']], ['后台', ['easy']], ['归途', ['comfort', 'reward']], ['晚班', ['easy', 'social']], ['暗流', ['stimulus', 'social']]
    ]},
    '+-++': { id: 'pan-peak-origin', pot: '平底锅', role: '收信人', defaultWord: '心愿', center: [1, -1, 1, 1], words: [
      ['心愿', ['reward', 'comfort']], ['远方', ['novel']], ['破晓', ['fresh', 'reward']], ['暗门', ['novel']], ['序章', ['novel', 'ritual']], ['彩蛋', ['reward', 'novel']]
    ]},
    '+-+-': { id: 'pan-peak-transform', pot: '平底锅', role: '导演', defaultWord: '浪漫', center: [1, -1, 1, -1], words: [
      ['浪漫', ['ritual', 'reward']], ['彩蛋', ['novel', 'reward']], ['序章', ['novel']], ['偏航', ['novel']], ['高光', ['reward', 'social']], ['奇迹', ['reward', 'novel']]
    ]},
    '+--+': { id: 'pan-ground-origin', pot: '平底锅', role: '看灯人', defaultWord: '黄昏', center: [1, -1, -1, 1], words: [
      ['黄昏', ['comfort']], ['微光', ['comfort', 'light']], ['长夜', ['comfort', 'familiar']], ['深夜', ['comfort']], ['旧时', ['familiar']], ['失眠', ['stimulus', 'comfort']]
    ]},
    '+---': { id: 'pan-ground-transform', pot: '平底锅', role: '编织者', defaultWord: '周末', center: [1, -1, -1, -1], words: [
      ['周末', ['reward', 'comfort']], ['慢拍', ['comfort']], ['雾气', ['fresh', 'comfort']], ['余地', ['easy']], ['后院', ['familiar', 'social']], ['黄昏', ['comfort', 'social']]
    ]},
    '-+++': { id: 'hotpot-peak-origin', pot: '火锅', role: '打捞人', defaultWord: '谜底', center: [-1, 1, 1, 1], words: [
      ['谜底', ['clarity']], ['真相', ['clarity', 'stimulus']], ['答案', ['easy', 'clarity']], ['转机', ['reward']], ['奇迹', ['novel', 'reward']], ['心愿', ['comfort', 'reward']]
    ]},
    '-++-': { id: 'hotpot-peak-transform', pot: '火锅', role: '炼金师', defaultWord: '梦想', center: [-1, 1, 1, -1], words: [
      ['梦想', ['reward', 'novel']], ['冒险', ['novel', 'stimulus']], ['转机', ['reward']], ['失控', ['spicy', 'stimulus']], ['奇迹', ['reward', 'novel']], ['偏航', ['novel']]
    ]},
    '-+-+': { id: 'hotpot-ground-origin', pot: '火锅', role: '见证人', defaultWord: '心事', center: [-1, 1, -1, 1], words: [
      ['心事', ['social', 'comfort']], ['回声', ['social', 'familiar']], ['暗流', ['stimulus', 'social']], ['雨季', ['comfort']], ['退潮', ['light', 'comfort']], ['日常', ['familiar']]
    ]},
    '-+--': { id: 'hotpot-ground-transform', pot: '火锅', role: '外交官', defaultWord: '潮汐', center: [-1, 1, -1, -1], words: [
      ['潮汐', ['social']], ['暗流', ['stimulus', 'social']], ['退潮', ['light', 'social']], ['回声', ['social', 'familiar']], ['周末', ['reward', 'social']], ['雨季', ['comfort', 'social']]
    ]},
    '--++': { id: 'claypot-peak-origin', pot: '砂锅', role: '保管员', defaultWord: '秘密', center: [-1, -1, 1, 1], words: [
      ['秘密', ['comfort', 'clarity']], ['心愿', ['reward', 'comfort']], ['答案', ['easy']], ['远方', ['novel']], ['暗门', ['novel']], ['真相', ['clarity']]
    ]},
    '--+-': { id: 'claypot-peak-transform', pot: '砂锅', role: '造船师', defaultWord: '远方', center: [-1, -1, 1, -1], words: [
      ['远方', ['novel', 'reward']], ['梦想', ['reward']], ['破晓', ['fresh', 'reward']], ['偏航', ['novel']], ['冒险', ['novel', 'stimulus']], ['心愿', ['comfort', 'reward']]
    ]},
    '---+': { id: 'claypot-ground-origin', pot: '砂锅', role: '守夜人', defaultWord: '昨日', center: [-1, -1, -1, 1], words: [
      ['昨日', ['familiar', 'comfort']], ['黄昏', ['comfort']], ['微光', ['light', 'comfort']], ['余温', ['comfort']], ['故乡', ['familiar', 'comfort']], ['后记', ['reward', 'comfort']]
    ]},
    '----': { id: 'claypot-ground-transform', pot: '砂锅', role: '说书人', defaultWord: '归途', center: [-1, -1, -1, -1], words: [
      ['归途', ['comfort', 'reward']], ['旧梦', ['familiar', 'comfort']], ['后记', ['reward']], ['尾声', ['comfort']], ['故乡', ['familiar']], ['长夜', ['comfort', 'social']]
    ]}
  });

  const FORTUNES = Object.freeze({
    火: { tags: ['spicy', 'hot', 'stimulus'], line: '火位抬头，今晚宜让味道先替你表态。' },
    水: { tags: ['soup', 'fresh', 'comfort'], line: '水位入局，今晚宜让热气和汤汁替你收尾。' },
    土: { tags: ['carb', 'comfort', 'familiar'], line: '土位偏旺，翻译成人话：主食今天有合法席位。' },
    风: { tags: ['fresh', 'light', 'novel'], line: '风位过境，今晚可以离开惯性一点点。' }
  });

  const MEAL_OVERRIDES = Object.freeze({
    '黄焖鸡米饭': { axis: [-0.45, -0.55, -0.65, -0.65], tags: ['hot', 'comfort', 'carb', 'easy', 'savory'] },
    '番茄炒蛋盖饭': { axis: [0.45, -0.45, -0.75, -0.15], tags: ['hot', 'comfort', 'carb', 'easy', 'cheap'] },
    '宫保鸡丁盖饭': { axis: [0.85, 0.4, -0.5, -0.95], tags: ['spicy', 'hot', 'carb', 'stimulus', 'savory'] },
    '麻婆豆腐盖饭': { axis: [0.15, -0.75, -0.7, -1], tags: ['spicy', 'hot', 'carb', 'comfort'] },
    '红烧排骨饭': { axis: [-0.25, -0.45, 0.2, -0.85], tags: ['rich', 'comfort', 'carb', 'savory'] },
    '酸菜鱼米饭': { axis: [-0.85, -0.2, 0.25, -0.75], tags: ['spicy', 'hot', 'soup', 'savory', 'social'] },
    '水煮肉片米饭': { axis: [-0.8, -0.2, 0.2, -0.95], tags: ['spicy', 'hot', 'rich', 'stimulus', 'social'] },
    '麻辣香锅': { axis: [1, 0.75, 0.35, -1], tags: ['spicy', 'crisp', 'rich', 'stimulus', 'social', 'ritual'] },
    '烤鱼配米饭': { axis: [0.85, 0.35, 0.55, -0.65], tags: ['spicy', 'ritual', 'rich', 'savory', 'social'] },
    '潮汕砂锅粥': { axis: [-1, -1, -0.85, 0.6], tags: ['hot', 'soup', 'comfort', 'fresh', 'ritual'] },
    '皮蛋瘦肉粥配油条': { axis: [-0.85, -0.45, -0.8, -0.2], tags: ['hot', 'soup', 'comfort', 'crisp', 'carb'] },
    '兰州牛肉面': { axis: [-0.7, 0.25, -0.8, 0.4], tags: ['hot', 'soup', 'comfort', 'easy', 'carb'] },
    '重庆小面': { axis: [-0.25, 0.15, -0.9, -0.85], tags: ['spicy', 'hot', 'easy', 'stimulus', 'carb'] },
    '炸酱面': { axis: [0.1, 0.2, -0.9, -0.95], tags: ['carb', 'comfort', 'savory', 'easy'] },
    '油泼面': { axis: [0.75, 0.35, -0.85, -0.75], tags: ['hot', 'carb', 'spicy', 'stimulus'] },
    '饺子配酸辣汤': { axis: [-0.55, 0.15, -0.75, -0.55], tags: ['hot', 'soup', 'comfort', 'ritual', 'carb'] },
    '生煎包配豆浆': { axis: [0.9, 0.85, -0.75, -0.2], tags: ['crisp', 'comfort', 'carb', 'easy'] },
    '胡辣汤配水煎包': { axis: [-0.35, 0.55, -0.7, -0.8], tags: ['hot', 'spicy', 'comfort', 'carb', 'crisp'] },
    '肉夹馍配凉皮': { axis: [0.65, 0.65, -0.55, -0.65], tags: ['crisp', 'savory', 'carb', 'stimulus', 'easy'] },
    '煎饼果子': { axis: [0.95, 0.75, -0.8, -0.5], tags: ['crisp', 'easy', 'cheap', 'savory', 'carb'] },
    '新疆大盘鸡拌面': { axis: [0.25, 0.15, -0.1, -0.85], tags: ['spicy', 'hot', 'rich', 'ritual', 'social', 'carb'] },
    '云南小锅米线': { axis: [-0.55, -0.1, -0.85, -0.55], tags: ['hot', 'soup', 'spicy', 'fresh', 'carb'] },
    '清蒸鱼 + 时蔬 + 米饭': { axis: [-0.75, -0.55, 0.2, 0.95], tags: ['hot', 'fresh', 'light', 'ritual'] },
    '鸡胸肉杂粮饭配时蔬': { axis: [0.2, 0.2, -0.65, 0.75], tags: ['light', 'fresh', 'easy', 'savory', 'carb'] },
    '玛格丽特披萨': { axis: [0.85, 0.2, -0.5, -0.55], tags: ['hot', 'carb', 'comfort', 'ritual', 'social'] },
    '意大利肉酱面': { axis: [0.2, -0.25, -0.85, -0.9], tags: ['hot', 'carb', 'comfort', 'rich'] },
    '经典培根蛋酱意面': { axis: [0.1, -0.65, -0.8, -0.9], tags: ['rich', 'carb', 'comfort', 'savory'] },
    '英式炸鱼薯条': { axis: [1, 0.95, 0.15, -0.25], tags: ['fried', 'crisp', 'rich', 'comfort', 'social'] },
    '德式咖喱香肠配薯条': { axis: [1, 0.9, 0.35, -0.95], tags: ['spicy', 'fried', 'crisp', 'rich'] },
    '希腊烤肉卷饼': { axis: [0.8, 0.6, -0.45, 0.1], tags: ['fresh', 'savory', 'crisp', 'easy', 'carb'] },
    '地中海烤鸡鹰嘴豆碗': { axis: [0.55, 0.25, -0.7, 0.45], tags: ['fresh', 'light', 'savory', 'ritual'] },
    '番茄炖蛋配面包': { axis: [-0.65, -0.8, -0.65, 0.15], tags: ['hot', 'comfort', 'fresh', 'carb'] },
    '经典牛肉汉堡配薯条': { axis: [1, 0.85, 0.1, -0.7], tags: ['fried', 'crisp', 'rich', 'comfort', 'social'] },
    '田纳西辣炸鸡三明治': { axis: [1, 1, 0.15, -0.9], tags: ['spicy', 'fried', 'crisp', 'stimulus'] },
    '烤芝士三明治配番茄汤': { axis: [-0.2, -0.6, -0.75, -0.65], tags: ['hot', 'soup', 'comfort', 'carb'] },
    '墨西哥牛肉塔可': { axis: [0.9, 0.9, 0.2, -0.85], tags: ['spicy', 'crisp', 'novel', 'savory', 'social'] },
    '鸡肉法希塔饭碗': { axis: [0.65, 0.3, -0.55, -0.45], tags: ['hot', 'fresh', 'savory', 'ritual', 'carb'] },
    '加拿大肉汁奶酪薯条': { axis: [0.75, -0.35, -0.45, -0.9], tags: ['hot', 'rich', 'comfort', 'carb', 'social'] },
    '烤蔬菜藜麦碗': { axis: [0.45, 0.25, -0.85, 0.75], tags: ['light', 'fresh', 'ritual', 'easy'] }
  });

  const clamp = (value, min = -1, max = 1) => Math.max(min, Math.min(max, value));

  function hash(input = '') {
    let value = 2166136261;
    for (const char of String(input)) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function randomFrom(seed) {
    let value = typeof seed === 'number' ? seed : hash(seed);
    if (!value) value = 0x9e3779b9;
    return () => {
      value ^= value << 13;
      value ^= value >>> 17;
      value ^= value << 5;
      return (value >>> 0) / 4294967296;
    };
  }

  function addMap(target, source = {}) {
    for (const [key, value] of Object.entries(source)) target[key] = (target[key] || 0) + Number(value || 0);
    return target;
  }

  function aggregateAxis(selections = []) {
    const raw = { heat: 0, texture: 0, focus: 0, meaning: 0 };
    const exposure = { heat: 0, texture: 0, focus: 0, meaning: 0 };
    for (const selection of selections) {
      for (const [key, value] of Object.entries(selection?.axis || {})) {
        if (!(key in raw)) continue;
        raw[key] += Number(value || 0);
        exposure[key] += Math.abs(Number(value || 0));
      }
    }
    return { raw, exposure };
  }

  function getCalibrationQuestion(selections = []) {
    const { raw, exposure } = aggregateAxis(selections);
    const axis = AXES
      .map(item => ({ key: item.key, certainty: Math.abs(raw[item.key]) / Math.max(1, exposure[item.key]) }))
      .sort((a, b) => a.certainty - b.certainty)[0]?.key || 'heat';
    return { ...CALIBRATORS[axis], calibrationAxis: axis };
  }

  function keyFromValues(values, seed = '') {
    return AXES.map(axis => {
      const value = Number(values[axis.key] || 0);
      if (Math.abs(value) >= 0.075) return value > 0 ? '+' : '-';
      return hash(`${seed}:${axis.key}`) % 2 ? '+' : '-';
    }).join('');
  }

  function archetypeById(id) {
    return Object.values(ARCHETYPES).find(item => item.id === id) || null;
  }

  function buildProfile(selections = [], seed = '') {
    const { raw, exposure } = aggregateAxis(selections);
    const values = {};
    const certainty = {};
    for (const axis of AXES) {
      values[axis.key] = clamp(raw[axis.key] / Math.max(1, exposure[axis.key]));
      certainty[axis.key] = Math.abs(values[axis.key]);
    }
    const key = keyFromValues(values, seed || selections.map(item => item?.title).join('|'));
    const archetype = ARCHETYPES[key];
    const confidence = Math.round(58 + 34 * Object.values(certainty).reduce((sum, value) => sum + value, 0) / AXES.length);
    return {
      version: VERSION,
      key,
      archetypeId: archetype.id,
      raw,
      exposure,
      values,
      certainty,
      confidence,
      createdAt: Date.now()
    };
  }

  function buildDaily(selections = []) {
    const mood = {};
    selections.forEach(selection => addMap(mood, selection?.mood || {}));
    const tags = Object.entries(mood).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
    return { mood, tags, selections: selections.map(item => item?.title || '') };
  }

  function chooseFloatWord(archetype, daily, seed = '') {
    const rng = randomFrom(hash(`${seed}:${archetype.id}:${daily?.selections?.join('|') || ''}`));
    const mood = daily?.mood || {};
    const candidates = archetype.words.map(([word, affinities], index) => {
      const affinity = affinities.reduce((sum, tag) => sum + (mood[tag] || 0), 0);
      const defaultLift = word === archetype.defaultWord ? 0.65 : 0;
      return { word, score: affinity * 1.3 + defaultLift + rng() * 1.15 - index * 0.015 };
    }).sort((a, b) => b.score - a.score);
    return candidates[0]?.word || archetype.defaultWord;
  }

  function getAxisLabel(key, value, soft = true) {
    const axis = AXES.find(item => item.key === key);
    if (!axis) return '';
    const prefix = soft && Math.abs(value) < 0.28 ? '微' : '';
    return `${prefix}${value >= 0 ? axis.positive : axis.negative}`;
  }

  function profileLabels(profile) {
    return AXES.map(axis => getAxisLabel(axis.key, profile?.values?.[axis.key] || 0));
  }

  function describeProfile(profile) {
    const v = profile.values;
    const pieces = {
      heat: v.heat >= 0 ? '你更信任一次明确的转折' : '你更愿意让事情在时间里慢慢落定',
      texture: v.texture >= 0 ? '但你又受不了含糊，回应最好有轮廓' : '你需要的不是分析，而是先被稳稳接住',
      focus: v.focus >= 0 ? '一件事必须有一个真正值得记住的重点' : '你更在意整段生活能不能重新顺起来',
      meaning: v.meaning >= 0 ? '而且原来的质地最好别被花活盖住' : '你相信重新组合以后，东西可以长出第二层意义'
    };
    const strongest = AXES
      .map(axis => ({ key: axis.key, value: Math.abs(v[axis.key]) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(item => pieces[item.key]);
    return `${strongest[0]}，${strongest[1]}。${strongest[2]}。`;
  }

  function fortuneFor(seed = '') {
    const names = Object.keys(FORTUNES);
    const name = names[hash(seed) % names.length];
    return { name, ...FORTUNES[name] };
  }

  function addTagByRegex(tags, name, tag, regex) {
    if (regex.test(name)) tags.add(tag);
  }

  function inferTags(name) {
    const tags = new Set(['savory']);
    addTagByRegex(tags, name, 'spicy', /辣|麻辣|酸辣|香辣|辣子|水煮|毛血旺|干锅|咖喱|胡辣|椒|孜然|燃面|螺蛳|肠旺|泡椒|布法罗|墨西哥|辣味/);
    addTagByRegex(tags, name, 'soup', /汤|粥|羹|馄饨|云吞|汤面|汤粉|汤粿条|米线|砂锅|泡馍|麻辣烫|冒菜|酸菜鱼|水煮鱼|浓汤|火锅|煲/);
    addTagByRegex(tags, name, 'carb', /饭|面|粉|米线|粿条|粥|包|饼|馍|饺|馄饨|云吞|披萨|意面|通心粉|三明治|汉堡|热狗|薯|吐司|贝果|卷饼|塔可|华夫|法棍|可颂|饭碗|藜麦/);
    addTagByRegex(tags, name, 'comfort', /黄焖|红烧|卤|炖|煲|粥|汤|番茄炒蛋|饺|包|馄饨|米饭|盖饭|面|披萨|汉堡|炸鸡|土豆泥|咖喱|焗|肉酱|蒸蛋/);
    addTagByRegex(tags, name, 'rich', /猪脚|扣肉|红烧肉|肥肠|烧鹅|叉烧|腊|培根|芝士|奶酪|炸|猪肘|牛胸|牛排|排骨|肉酱|烤肉|汉堡|香肠|肉汁|奶油|五花/);
    addTagByRegex(tags, name, 'fried', /炸|煎|锅贴|生煎|油条|鸡排|薯条|华夫|天妇罗/);
    addTagByRegex(tags, name, 'crisp', /炸|煎|锅贴|生煎|烧饼|锅盔|烤冷面|鸡排|薯条|油条|煎饼|肉夹馍|披萨|华夫|三明治|塔可|玉米片|酥|脆/);
    addTagByRegex(tags, name, 'fresh', /沙拉|蔬菜|时蔬|杂粮|藜麦|豆腐|鱼|虾|海鲜|白切鸡|清蒸|柠檬|鹰嘴豆|牛油果|三文鱼|金枪鱼|番茄|菌菇|凉拌/);
    addTagByRegex(tags, name, 'light', /沙拉|蔬菜|时蔬|杂粮|藜麦|鸡胸|豆腐|粥|清蒸|白切鸡|鹰嘴豆|牛油果|谷物碗|蒸蛋|杂菜/);
    addTagByRegex(tags, name, 'easy', /盖饭|炒饭|面|粉|米线|麻辣烫|冒菜|包|饺|馄饨|汉堡|三明治|热狗|快餐|便当|套餐|煎饼|手抓饼|饭碗|拌面|关东煮/);
    addTagByRegex(tags, name, 'cheap', /番茄炒蛋|蛋炒饭|炒饭|豆腐|土豆|包|饼|馍|粥|面|粉|煎饼|手抓饼|鸡蛋|豆浆|油条/);
    addTagByRegex(tags, name, 'ritual', /煲仔|砂锅|烤鱼|大盘鸡|烧腊|三宝|海鲜饭|烤肉|披萨|三杯鸡|潮汕|烤串|拼盘|火锅|烩饭|华夫|早餐拼盘|宴|双拼/);
    addTagByRegex(tags, name, 'novel', /墨西哥|希腊|土耳其|德式|法式|英式|西班牙|地中海|加拿大|田纳西|纽约|夏威夷|加州|意式|韩式|日式|泰式/);
    addTagByRegex(tags, name, 'hot', /汤|粥|羹|面|粉|米线|麻辣烫|冒菜|砂锅|煲|炖|烩|蒸|烧|焖|煮|烤|炸|炒|饭|披萨|汉堡|鸡翅|鸡排|鸡腿|咖喱|火锅/);
    addTagByRegex(tags, name, 'social', /火锅|拼盘|烤串|烤肉|大盘|双拼|炸鸡桶|披萨|烤鱼|麻辣香锅|鸡翅/);
    if (tags.has('spicy') || tags.has('crisp')) tags.add('stimulus');
    if (/素|蔬菜|时蔬|豆腐|菌菇|藜麦|鹰嘴豆|番茄炒蛋|韭菜鸡蛋|鸡蛋灌饼|沙拉/.test(name) && !/肉|鸡|鸭|鹅|鱼|虾|蟹|牛|羊|猪|培根|火腿|香肠|排骨|肥肠|海鲜/.test(name.replace(/鱼香(茄子|豆腐)/g, '$1'))) tags.add('vegetarian');
    return tags;
  }

  function inferAxis(name, tags) {
    const score = { heat: 0, texture: 0, focus: 0, meaning: 0 };
    const apply = (key, delta, regex) => { if (regex.test(name)) score[key] += delta; };

    apply('heat', 1.35, /炒|煎|炸|烤|铁板|干锅|锅贴|生煎|油泼|焗|披萨|汉堡|三明治|烤肉|烧饼|锅盔|烤冷面/);
    apply('heat', -1.5, /汤|粥|羹|炖|煮|蒸|焖|煲|砂锅|火锅|麻辣烫|冒菜|水煮|馄饨|云吞|泡馍|烩/);
    apply('heat', 0.35, /红烧|卤|烧|饭/);

    apply('texture', 1.45, /炸|煎|烤|脆|酥|锅贴|生煎|烧饼|锅盔|油条|鸡排|薯条|卷饼|塔可|馍|煎饼|烤冷面/);
    apply('texture', 0.45, /面|粉|粿条|牛肉|羊肉|鱿鱼/);
    apply('texture', -1.45, /粥|羹|炖|蒸蛋|豆腐|焖|烩|汤|土豆泥|奶油|芝士|煲|砂锅/);

    apply('focus', -1.35, /盖饭|炒饭|米饭|饭碗|便当|面|粉|米线|粿条|粥|饼|包|馍|饺|馄饨|云吞|披萨|三明治|汉堡|热狗|卷饼|塔可|藜麦碗|套餐/);
    apply('focus', 1.15, /烤鱼|整鸡|牛排|排骨|猪脚|扣肉|白切鸡|烧鹅|烤鸭|大盘鸡|火锅|拼盘|鱼|鸡|鸭|鹅|虾|蟹|牛|羊|猪|肉|豆腐/);
    apply('focus', 0.5, /^[^+配]{1,10}(配|\s\+)/);

    apply('meaning', 1.45, /清蒸|白切|盐焗|原味|清汤|鲜|刺身|白灼|凉拌|鸡胸|时蔬|杂粮|藜麦|烤蔬菜|菌菇|蒸蛋/);
    apply('meaning', -1.45, /麻辣|咖喱|红烧|鱼香|宫保|糖醋|酱|卤|孜然|黑椒|照烧|芝士|奶油|酸辣|干锅|香辣|辣子|炸酱|肉酱|泡椒|三杯|沙茶|豉汁|蜜汁|腐乳/);
    apply('meaning', -0.45, /炒|炸|焗|披萨|汉堡|三明治/);

    return {
      heat: clamp(score.heat / 1.75),
      texture: clamp(score.texture / 1.8),
      focus: clamp(score.focus / 1.8),
      meaning: clamp(score.meaning / 1.8)
    };
  }

  function ingredientFlags(name) {
    const normalized = name.replace(/鱼香(茄子|豆腐)/g, '$1');
    return {
      seafood: /鱼|虾|蟹|贝|蛤|蚝|鱿鱼|海鲜|金枪鱼|三文鱼|鳕鱼|龙虾|扇贝|章鱼/.test(normalized),
      beefLamb: /牛|羊/.test(normalized),
      pork: /猪|培根|火腿|叉烧|扣肉|排骨|肥肠|香肠|腊/.test(normalized),
      poultry: /鸡|鸭|鹅|火鸡/.test(normalized)
    };
  }

  function archetypeSimilarity(axis, center) {
    const values = AXES.map(item => axis[item.key] || 0);
    const distance = values.reduce((sum, value, index) => sum + Math.abs(value - center[index]), 0) / 8;
    return clamp(1 - distance, 0, 1);
  }

  function crossMappings(axis) {
    const matches = Object.values(ARCHETYPES)
      .map(archetype => ({ archetype, similarity: archetypeSimilarity(axis, archetype.center) }))
      .sort((a, b) => b.similarity - a.similarity);
    const top = matches[0]?.similarity || 0;
    const gap = top - (matches[1]?.similarity || 0);
    const count = top >= 0.83 && gap >= 0.08 ? 1 : top >= 0.68 ? 2 : 3;
    return matches.slice(0, count).map(({ archetype, similarity }) => ({
      id: archetype.id,
      title: `${archetype.pot}${archetype.defaultWord}${archetype.role}`,
      pot: archetype.pot,
      role: archetype.role,
      similarity,
      percent: Math.round(55 + similarity * 43)
    }));
  }

  function profileMeal(meal) {
    const name = String(meal?.name || '').trim();
    const inferredTags = inferTags(name);
    let axis = inferAxis(name, inferredTags);
    const override = MEAL_OVERRIDES[name];
    if (override) {
      axis = { heat: override.axis[0], texture: override.axis[1], focus: override.axis[2], meaning: override.axis[3] };
      override.tags.forEach(tag => inferredTags.add(tag));
    }
    const flags = ingredientFlags(name);
    return {
      ...meal,
      name,
      axis,
      tags: [...inferredTags],
      flags,
      cross: crossMappings(axis)
    };
  }

  function hardAllowed(meal, constraints = {}) {
    if (constraints.noSeafood && meal.flags.seafood) return false;
    if (constraints.noBeefLamb && meal.flags.beefLamb) return false;
    if (constraints.noPork && meal.flags.pork) return false;
    return true;
  }

  function profileFit(profile, meal) {
    const distance = AXES.reduce((sum, axis) => sum + Math.abs((profile.values[axis.key] || 0) - (meal.axis[axis.key] || 0)), 0) / 8;
    return clamp(1 - distance, 0, 1);
  }

  function moodFit(daily, meal) {
    const mood = daily?.mood || {};
    const tags = new Set(meal.tags || []);
    const channels = {
      comfort: ['comfort', 'soup', 'hot', 'carb'],
      easy: ['easy', 'cheap', 'familiar'],
      familiar: ['comfort', 'easy', 'carb'],
      stimulus: ['stimulus', 'spicy', 'crisp', 'novel'],
      spicy: ['spicy'],
      crisp: ['crisp', 'fried'],
      reward: ['ritual', 'rich', 'novel', 'social'],
      ritual: ['ritual', 'social'],
      novel: ['novel'],
      social: ['social', 'ritual', 'shareable'],
      shareable: ['social', 'ritual'],
      light: ['light', 'fresh'],
      fresh: ['fresh', 'light']
    };
    let earned = 0;
    let possible = 0;
    for (const [moodTag, weight] of Object.entries(mood)) {
      possible += weight;
      const accepted = channels[moodTag] || [moodTag];
      if (accepted.some(tag => tags.has(tag))) earned += weight;
      else if (accepted.some(tag => tag === 'familiar') && tags.has('comfort')) earned += weight * 0.65;
    }
    return possible ? clamp(earned / possible, 0, 1) : 0.5;
  }

  function feasibilityFit(constraints, meal) {
    const tags = new Set(meal.tags || []);
    let score = 0.62;
    if (constraints.quick) score += tags.has('easy') ? 0.22 : -0.12;
    if (constraints.noWash) score += tags.has('easy') || tags.has('soup') ? 0.13 : -0.08;
    if (constraints.light) score += tags.has('light') || tags.has('fresh') ? 0.22 : tags.has('rich') ? -0.18 : 0;
    if (constraints.social) score += tags.has('social') || tags.has('ritual') ? 0.18 : -0.03;
    if (constraints.vegetarian) score += tags.has('vegetarian') ? 0.26 : -0.08;
    return clamp(score, 0, 1);
  }

  function fortuneFit(fortune, meal) {
    const tags = new Set(meal.tags || []);
    return fortune.tags.reduce((sum, tag) => sum + (tags.has(tag) ? 1 : 0), 0) / fortune.tags.length;
  }

  function rankMeals(meals, profile, daily, constraints = {}, options = {}) {
    const seed = options.seed || '';
    const fortune = options.fortune || fortuneFor(seed);
    const history = new Set(options.history || []);
    const rng = randomFrom(hash(`${seed}:ranking`));
    return (Array.isArray(meals) ? meals : [])
      .map(profileMeal)
      .filter(meal => meal.name && hardAllowed(meal, constraints))
      .map(meal => {
        const profileScore = profileFit(profile, meal);
        const dailyScore = moodFit(daily, meal);
        const feasibilityScore = feasibilityFit(constraints, meal);
        const fortuneScore = fortuneFit(fortune, meal);
        const historyPenalty = history.has(meal.name) ? 7 : 0;
        const jitter = rng() * 2.4;
        const score = profileScore * 50 + dailyScore * 25 + feasibilityScore * 20 + fortuneScore * 5 + jitter - historyPenalty;
        return {
          ...meal,
          score,
          breakdown: {
            profile: Math.round(profileScore * 100),
            daily: Math.round(dailyScore * 100),
            feasibility: Math.round(feasibilityScore * 100),
            fortune: Math.round(fortuneScore * 100)
          }
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  function weightedDraw(ranked, count = 4, seed = '') {
    const pool = ranked.slice(0, Math.max(10, count * 3));
    const rng = randomFrom(hash(`${seed}:draw`));
    const picked = [];
    while (pool.length && picked.length < count) {
      const topScore = pool[0].score;
      const weights = pool.map(item => Math.exp((item.score - topScore) / 5.5));
      const total = weights.reduce((sum, value) => sum + value, 0);
      let cursor = rng() * total;
      let index = 0;
      for (; index < weights.length - 1; index++) {
        cursor -= weights[index];
        if (cursor <= 0) break;
      }
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked;
  }

  function recommendationReason(profile, daily, meal) {
    const axis = profile.values;
    const clauses = [];
    clauses.push(axis.heat >= 0
      ? '你今天仍然需要一件事明确发生，而不是继续在半完成里拖着'
      : '你今天需要的是节奏慢下来，不是再被一个更大的声响推着走');
    clauses.push(axis.texture >= 0
      ? '但嘴里必须保留一点反馈，免得安慰最后变成含糊'
      : '食物最好少一点抵抗，先把你稳稳接住');
    if ((daily?.mood?.easy || 0) >= 4) clauses.push('同时你已经没有多余带宽再经营晚饭');
    else if ((daily?.mood?.reward || 0) >= 4) clauses.push('而今晚又需要一点“这一天没有白过”的证据');
    else if ((daily?.mood?.social || 0) >= 4) clauses.push('你还需要桌面上重新出现一点人声和共同承担');
    else if ((daily?.mood?.light || 0) >= 4) clauses.push('不过身体已经明确拒绝再背一层重量');
    return `${clauses.join('，')}。所以今晚不是“随便吃点”，而是${meal.name}。`;
  }

  function mealMappingLine(meal) {
    const labels = AXES.map(axis => getAxisLabel(axis.key, meal.axis[axis.key], false));
    const cross = meal.cross.map(item => item.title).join('、');
    return `这道菜的厨房向量是 ${labels.join(' · ')}；它同时落在${cross}的邻域里。不是一菜一命，而是允许 1–3 条人格路径交叉抵达。`;
  }

  function makeShareUrl(meal, title, locationLike) {
    const origin = locationLike?.origin || '';
    const pathname = locationLike?.pathname || '/';
    const url = new URL(pathname, origin || 'https://example.invalid');
    url.searchParams.set('from', 'share-card');
    url.searchParams.set('meal', meal.name);
    url.searchParams.set('type', title);
    return origin ? url.toString() : `${pathname}?${url.searchParams.toString()}`;
  }

  const API = Object.freeze({
    VERSION,
    PROFILE_STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    AXES,
    PROFILE_QUESTIONS,
    DAILY_QUESTIONS,
    CALIBRATORS,
    ARCHETYPES,
    FORTUNES,
    hash,
    randomFrom,
    aggregateAxis,
    getCalibrationQuestion,
    buildProfile,
    buildDaily,
    archetypeById,
    chooseFloatWord,
    getAxisLabel,
    profileLabels,
    describeProfile,
    fortuneFor,
    profileMeal,
    crossMappings,
    rankMeals,
    weightedDraw,
    recommendationReason,
    mealMappingLine,
    makeShareUrl
  });

  window.FOOD_PICKER_ENGINE = API;
})();
