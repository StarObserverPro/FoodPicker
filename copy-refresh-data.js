(() => {
  'use strict';
  const ENGINE = window.FOOD_PICKER_ENGINE;
  if (!ENGINE) return;
  const COPY = {
  "profile": [
    {
      "id": "close-the-day",
      "phase": "收工以后",
      "text": "忙乱的一天终于收工了。什么瞬间会让人真正觉得：行，今天到这儿？",
      "hint": "不用挑最健康的。哪个最像平时，就点哪个。",
      "options": [
        {
          "title": "关门换鞋，出去走一圈",
          "sub": "人得先从白天里切出来"
        },
        {
          "title": "洗个热水澡，慢慢泡一会儿",
          "sub": "也不急着想，过一会儿自然就安静了"
        },
        {
          "title": "顺手把最后一件事收掉",
          "sub": "留个尾巴在那儿，反而更烦"
        },
        {
          "title": "开点熟悉的声音，屋里有人气了",
          "sub": "音乐也好、电视也好，生活重新接上就行"
        }
      ]
    },
    {
      "id": "stalled-room",
      "phase": "事情卡住",
      "text": "几个人聊了半天，事情还是卡着。哪一步最容易让你觉得：总算往前走了？",
      "hint": "不管工作套路，只看哪一种推进方式最顺手。",
      "options": [
        {
          "title": "先拿个能做的版本出来",
          "sub": "跑起来再改，别一直悬着"
        },
        {
          "title": "先把大家到底卡哪儿捋清楚",
          "sub": "没弄明白之前，催也没什么用"
        },
        {
          "title": "把那句一直没人说的话说出来",
          "sub": "难听一点没关系，别绕"
        },
        {
          "title": "换个说法，把几边的意思重新拼一下",
          "sub": "也许不是谁对谁错，只是没接上"
        }
      ]
    },
    {
      "id": "friend-response",
      "phase": "朋友在旁边",
      "text": "状态不太好，朋友也看出来了。哪种反应会比较舒服？",
      "hint": "都是好意，只看哪一种最不费劲。",
      "options": [
        {
          "title": "他说得很准：你其实卡在这儿",
          "sub": "被说中反而松一口气"
        },
        {
          "title": "不追问，坐一会儿就行",
          "sub": "不用解释，也不用马上振作"
        },
        {
          "title": "顺手把最烦的那件事接过去",
          "sub": "少一块重的，整个人就轻一点"
        },
        {
          "title": "讲点别的，把气氛带开",
          "sub": "先从原来的情绪里出来再说"
        }
      ]
    },
    {
      "id": "weekend-memory",
      "phase": "周末记忆",
      "text": "想起一个过得很舒服的周末，脑子里通常先回来的是哪种东西？",
      "hint": "不是朋友圈精选。第一下自己冒出来的那个就算。",
      "options": [
        {
          "title": "一个特别亮的瞬间",
          "sub": "别的都能忘，这一下会留下来"
        },
        {
          "title": "从早到晚那种顺顺的节奏",
          "sub": "没什么大事，但整天都挺对"
        },
        {
          "title": "一个很小、很具体的细节",
          "sub": "一句话、一道光、一个声音，原样记得很清楚"
        },
        {
          "title": "几件小事后来串成的那股气氛",
          "sub": "单拿出来都普通，放一起就很有意思"
        }
      ]
    },
    {
      "id": "inhabited-room",
      "phase": "住久以后",
      "text": "一个地方住久了，什么时候会开始觉得：嗯，这是我的地盘了？",
      "hint": "不谈装修品味。就想长期住着，哪一样最不能少。",
      "options": [
        {
          "title": "总有一件东西特别对，压得住整个房间",
          "sub": "一眼看过去，知道这里是谁住的"
        },
        {
          "title": "东西都有自己的位置",
          "sub": "不用找，拿完也知道该放回哪儿"
        },
        {
          "title": "光线、声音、气味慢慢对上了",
          "sub": "说不上是哪一件东西，但待着就是舒服"
        },
        {
          "title": "有个地方可以整个人窝进去",
          "sub": "到那儿就不用端着了"
        }
      ]
    }
  ],
  "calibrators": {
    "heat": {
      "id": "calibrate-heat",
      "phase": "再补一句",
      "text": "突然白捡一个下午，怎么过最容易觉得没浪费？",
      "hint": "就当是个普通周末下午，别给它安排人生意义。",
      "options": [
        {
          "title": "出门，去个没去过的地方",
          "sub": "最好真发生点什么"
        },
        {
          "title": "不安排，想到哪儿算哪儿",
          "sub": "空着本身就挺值钱"
        },
        {
          "title": "把拖了很久的小事一口气做掉",
          "sub": "看见它从清单上消失就爽了"
        },
        {
          "title": "就在熟悉的地方晃悠",
          "sub": "心情自己慢慢换挡也挺好"
        }
      ]
    },
    "texture": {
      "id": "calibrate-texture",
      "phase": "再补一句",
      "text": "有人发来一句半截话，意思不太明白。哪种后续最省心？",
      "hint": "不是考情商。哪一种你看着不难受，就选哪一种。",
      "options": [
        {
          "title": "直接问：所以你到底想说什么？",
          "sub": "说清楚，大家都省事"
        },
        {
          "title": "先放着，等他想说完整再说",
          "sub": "没长好的话，先别硬拽"
        },
        {
          "title": "说说自己的理解，让他点个头",
          "sub": "语气可以软，意思最好别糊"
        },
        {
          "title": "先接住那个情绪，字面以后再说",
          "sub": "有时候人先舒服了，话自然就清楚了"
        }
      ]
    },
    "focus": {
      "id": "calibrate-focus",
      "phase": "再补一句",
      "text": "一件折腾很久的大事终于做完。哪个瞬间最像“完事儿了”？",
      "hint": "不是汇报现场。就是自己心里真的放下来的那一下。",
      "options": [
        {
          "title": "最后一个关键点严丝合缝地扣上",
          "sub": "就这一声，够了"
        },
        {
          "title": "所有零碎终于一起顺顺地跑起来",
          "sub": "没有哪个最重要，整体顺了就行"
        },
        {
          "title": "有人一眼看见了最难的那一步",
          "sub": "那块被看见，前面的折腾就有了名字"
        },
        {
          "title": "第二天醒来，生活已经恢复正常",
          "sub": "不用庆祝，事情过去了就挺好"
        }
      ]
    },
    "meaning": {
      "id": "calibrate-meaning",
      "phase": "再补一句",
      "text": "一个用了很多年、已经很顺手的东西坏了。哪种处理最合心意？",
      "hint": "不是省钱题。想想哪个做法会让人觉得：对，就该这么来。",
      "options": [
        {
          "title": "尽量按原来的样子修好",
          "sub": "用了这么久，它本来什么样很重要"
        },
        {
          "title": "把还能用的部分改成别的东西",
          "sub": "旧归旧，也可以重新活一次"
        },
        {
          "title": "留下一小块最有痕迹的地方",
          "sub": "不用完整，那块是真的就够了"
        },
        {
          "title": "干脆重新设计成现在会用的样子",
          "sub": "记得从前，不等于非得照着从前"
        }
      ]
    }
  },
  "daily": [
    {
      "id": "world-request",
      "phase": "今天这会儿",
      "text": "现在这会儿，最想让接下来的时间往哪个方向走？",
      "hint": "只算今天，不给人格定终身。",
      "options": [
        {
          "title": "安静点，别再加题了",
          "sub": "后面最好都不用费什么脑子"
        },
        {
          "title": "来点动静，把人叫醒",
          "sub": "今天有点灰，需要一下明确的刺激"
        },
        {
          "title": "给今天补个像样的结尾",
          "sub": "不用隆重，但得有点“今天也没白过”"
        },
        {
          "title": "热闹一点，有点人气",
          "sub": "哪怕只是一起坐着，也比一个人闷着强"
        }
      ]
    },
    {
      "id": "bandwidth",
      "phase": "今天这会儿",
      "text": "等今天收尾的时候，最想把哪一种感觉留到最后？",
      "hint": "先别想吃什么，选感觉。",
      "options": [
        {
          "title": "熟悉",
          "sub": "不用猜，也不用适应"
        },
        {
          "title": "松快",
          "sub": "别再顶着，能顺下来就行"
        },
        {
          "title": "有点意思",
          "sub": "最好还有一点小惊喜，别草草收场"
        },
        {
          "title": "清爽",
          "sub": "别拖泥带水，轻一点收尾"
        }
      ]
    }
  ],
  "fortunes": {
    "火": {
      "line": "食神今天偏火。翻译一下：几道差不多的菜里，它会偷偷把有点劲儿的往前推。"
    },
    "水": {
      "line": "食神今天偏水。没什么大道理，就是给汤汤水水和舒服一点的东西加半票。"
    },
    "土": {
      "line": "食神今天偏土。翻译成人话：熟悉、扎实、能落地的东西会占一点便宜。"
    },
    "风": {
      "line": "食神今天偏风。它只负责在最后关头，给轻一点、新一点的选项偷偷抬个手。"
    }
  }
};
  const byId = (items, id) => items.find(item => item.id === id);
  const applyQuestion = (target, source) => {
    if (!target || !source) return;
    target.phase = source.phase;
    target.text = source.text;
    target.hint = source.hint;
    source.options.forEach((part, index) => {
      if (!target.options[index]) return;
      target.options[index].title = part.title;
      target.options[index].sub = part.sub;
    });
  };
  COPY.profile.forEach(source => applyQuestion(byId(ENGINE.PROFILE_QUESTIONS, source.id), source));
  Object.entries(COPY.calibrators).forEach(([key, source]) => applyQuestion(ENGINE.CALIBRATORS[key], source));
  COPY.daily.forEach(source => applyQuestion(byId(ENGINE.DAILY_QUESTIONS, source.id), source));
  Object.entries(COPY.fortunes).forEach(([key, source]) => {
    if (ENGINE.FORTUNES[key]) ENGINE.FORTUNES[key].line = source.line;
  });
})();
