/**
 * Creative directions, not a menu or a collection of finished image prompts.
 * The planner supplies the food, the conversational link and the concrete scene.
 * Prompt fragments are English; labels are for Chinese tools and documentation.
 */

function freezeEntries(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

export const STYLE_LIBRARY = freezeEntries([
  {
    id: 'loose-oil',
    label: '松笔油画',
    medium: 'Loose oil painting.',
    rendering: 'Build the objects with broad opaque brushstrokes and a few decisive edges.',
    palette: 'Warm ochre, muted vermilion and a cool blue accent.',
    detailPolicy: 'Keep the food silhouette and the impossible joint legible; omit pores, tiny crumbs and polished microtexture.',
  },
  {
    id: 'wet-watercolor',
    label: '洇染水彩',
    medium: 'Wet-on-wet watercolor on lightly textured paper.',
    rendering: 'Use translucent color pools, open paper and selective dry edges around the main relationship.',
    palette: 'Sea blue, soft orange and restrained warm gray.',
    detailPolicy: 'Let peripheral shapes dissolve; preserve enough hard edges to identify the food and its unusual support.',
  },
  {
    id: 'flat-gouache',
    label: '平涂水粉',
    medium: 'Matte gouache illustration.',
    rendering: 'Use large flat shapes with sparse chalky brush marks and compact shadows.',
    palette: 'Tomato red, pale yellow, forest green and warm white.',
    detailPolicy: 'Separate the important parts by silhouette and color; keep decorative marks scarce.',
  },
  {
    id: 'geometric-collage',
    label: '几何剪纸',
    medium: 'Cut-paper collage.',
    rendering: 'Construct one continuous scene from simple cut shapes with a few overlapping paper edges.',
    palette: 'Cobalt, rust, butter yellow and charcoal.',
    detailPolicy: 'Simplify geometry without separating the food and host into unrelated panels; omit miniature patterns.',
  },
  {
    id: 'color-woodcut',
    label: '套色木刻',
    medium: 'Three-color woodcut print.',
    rendering: 'Use confident carved contours, broad ink areas and sparse directional cuts.',
    palette: 'Deep indigo, warm red and the cream color of the paper.',
    detailPolicy: 'Use only a few cuts to describe food layers and the impossible connection; avoid dense crosshatching.',
  },
  {
    id: 'soft-screenprint',
    label: '柔边丝网印',
    medium: 'Limited-color screenprint.',
    rendering: 'Use bold silhouettes, slightly soft ink edges and one simple overlapping shadow.',
    palette: 'Coral, dusty turquoise and deep plum on light paper.',
    detailPolicy: 'Keep the main visual joke readable at thumbnail size; no dense halftone or decorative lettering.',
  },
  {
    id: 'dry-pastel',
    label: '干粉彩',
    medium: 'Soft pastel drawing.',
    rendering: 'Mass the forms in broad powdery strokes with a few firm contour accents.',
    palette: 'Peach, dusty violet, cream and a dark teal anchor.',
    detailPolicy: 'Keep grain coarse and sparse; retain the food identity instead of turning everything into soft fog.',
  },
  {
    id: 'ink-wash',
    label: '淡墨设色',
    medium: 'Ink-wash illustration with restrained color.',
    rendering: 'Use economical ink contours, broad diluted washes and generous unpainted space.',
    palette: 'Warm black and pale gray with one persimmon-orange accent.',
    detailPolicy: 'Spend the clearest marks on the food and its altered relationship; keep the setting nearly unmarked.',
  },
  {
    id: 'stencil-poster',
    label: '模板海报',
    medium: 'Painted stencil illustration.',
    rendering: 'Use large interlocking positive and negative shapes with a mildly uneven painted edge.',
    palette: 'Brick red, midnight blue and soft ivory.',
    detailPolicy: 'Use a single focal grouping; preserve the impossible action in silhouette without adding labels.',
  },
  {
    id: 'broad-digital-paint',
    label: '大色块绘画',
    medium: 'Stylized digital painting.',
    rendering: 'Use broad matte color planes, soft light transitions and only a few sharp edge accents.',
    palette: 'Sage green, warm apricot, slate blue and cream.',
    detailPolicy: 'Describe volume with three or four value groups; omit photographic surface detail and tiny objects.',
  },
  {
    id: 'crayon-blocks',
    label: '蜡笔色块',
    medium: 'Wax-crayon illustration.',
    rendering: 'Use confident chunky marks and slightly irregular shapes with adult editorial composition.',
    palette: 'Golden yellow, leaf green, tomato red and dark blue.',
    detailPolicy: 'Keep the drawing deliberately economical; do not add faces or childish mascots to the food.',
  },
  {
    id: 'fresco-matte',
    label: '哑光壁画',
    medium: 'Simplified fresco painting.',
    rendering: 'Use broad mineral-colored areas, calm contour rhythms and shallow modeled space.',
    palette: 'Terracotta, pale limestone, dusty blue and muted olive.',
    detailPolicy: 'Suggest the plaster with a light uniform grain; omit cracks, aging damage and ornamental borders.',
  },
  {
    id: 'brush-monotype',
    label: '刷印独幅版画',
    medium: 'Painterly monotype print.',
    rendering: 'Use broad dragged ink shapes with a few clean negative-space cuts.',
    palette: 'Petrol blue, burnt orange and warm paper.',
    detailPolicy: 'Allow texture at the outer edges while keeping the food and the structural splice unmistakable.',
  },
  {
    id: 'graphic-watercolor',
    label: '几何水彩',
    medium: 'Geometric watercolor illustration.',
    rendering: 'Use transparent washes inside a small number of simplified planes and rounded shapes.',
    palette: 'Prussian blue, honey yellow, pale coral and open white.',
    detailPolicy: 'Use the planes to clarify the shared structure, not to fragment the subject into an unreadable abstraction.',
  },
]);

export const MISMATCH_LIBRARY = freezeEntries([
  {
    id: 'container',
    label: '盛放错位',
    direction: 'Place recognizable food in a clean object whose usual contents belong to another everyday activity.',
    bridgeRequirement: 'Give the unusual container a visible connection to a detail from the conversation, its shape or its function.',
    avoid: 'Do not merely put two unrelated objects beside each other. Keep soil, grease, waste and contamination out of the food.',
    example: '聊到修车：一份盖饭装在干净的工具抽屉里，抽屉拉开的角度像饭盒。',
  },
  {
    id: 'scale',
    label: '比例倒置',
    direction: 'Change the scale of the food relative to a familiar object so the food performs an unexpected spatial role.',
    bridgeRequirement: 'State which item is larger, which remains normal-sized and what their changed scale makes possible.',
    avoid: 'Do not rely on the word giant alone; avoid armies of tiny people and busy miniature scenery.',
    example: '聊到等车：一个蒸饺大到能作候车亭，饺子褶的弧线接着雨棚。',
  },
  {
    id: 'structural-splice',
    label: '结构嫁接',
    direction: 'Merge the food and a familiar mechanism at a shared hinge, layer, fold or opening.',
    bridgeRequirement: 'Name the exact parts that coincide and show one physically continuous hybrid rather than a separate food prop.',
    avoid: 'Do not erase all food cues or describe incompatible views of the same joint.',
    example: '聊到开长途：小汽车的引擎盖就是汉堡上层面包，肉饼夹在盖子与车身之间。',
  },
  {
    id: 'function-swap',
    label: '用途借位',
    direction: 'Let recognizable food temporarily do a non-food job through a visible feature it already has.',
    bridgeRequirement: 'Match a real food property such as a curve, holes, stretch or stacked layers to the borrowed function.',
    avoid: 'Do not change every part into a generic machine or hide the food under equipment.',
    example: '聊到房间太暗：一卷可辨认的可颂借弧形作灯罩，柔光从卷层之间透出。',
  },
  {
    id: 'setting-transfer',
    label: '场所挪用',
    direction: 'Place the food inside the spatial rules of a place suggested by the conversation.',
    bridgeRequirement: 'Choose one defining arrangement from that place and make the food occupy its central role.',
    avoid: 'Do not treat an unrelated busy backdrop as the entire joke; keep logos and named attractions out unless explicitly requested.',
    example: '聊到商务区：一份烤鸭坐在会议桌主位，薄饼沿桌边排列成折叠椅。',
  },
  {
    id: 'material-echo',
    label: '材质呼应',
    direction: 'Borrow the surface behavior of another material at one local part of the scene while keeping the meal visibly edible.',
    bridgeRequirement: 'Connect an actual food texture to the borrowed visual behavior, and identify the area where the transformation stops.',
    avoid: 'Do not turn the entire meal into metal, plastic or glass; avoid sharp shards and food that looks inedible.',
    example: '聊到下雨的玻璃窗：酸汤表面像雨窗一样留下几道透明流痕，碗里仍是鱼片和汤。',
  },
  {
    id: 'synesthesia',
    label: '感官串门',
    direction: 'Translate one sensation mentioned in the conversation into a concrete visible rhythm, color or repeated shape around the food.',
    bridgeRequirement: 'Name the original sensation and the visible device that carries it; keep the food as the main subject.',
    avoid: 'Do not ask the image to literally draw an abstract adjective, sound or taste without a visible anchor.',
    example: '聊到吵了一整天：红油面的面条绕成一圈安静的唱片，筷子悬在唱针的位置。',
  },
  {
    id: 'gravity',
    label: '重力走神',
    direction: 'Change one local gravitational rule so food and its support remain recognisable but relate in an impossible way.',
    bridgeRequirement: 'Specify what floats, bends or rests sideways and use the surrounding ordinary scene to establish the contrast.',
    avoid: 'Do not scatter every ingredient in the air or make all directions equally impossible.',
    example: '聊到一直爬楼：一碗面里只升起一道面条楼梯，碗和其余面条仍稳稳放在桌上。',
  },
  {
    id: 'spatial-seam',
    label: '空间接缝',
    direction: 'Join two scales or spaces through one opening in the food or its immediate container.',
    bridgeRequirement: 'Describe the boundary, which side each space occupies and the single form that continues through it.',
    avoid: 'Do not create multiple portals, collage panels or several competing horizons.',
    example: '聊到想出去走走：披萨切口接着一条窄窄的海岸线，饼边在同一处成为岸堤。',
  },
  {
    id: 'time-fold',
    label: '时间折页',
    direction: 'Make one visible trace of waiting, repetition or a day ending become part of the food scene.',
    bridgeRequirement: 'Use a physical trace such as a repeated shadow, folded wrapper or stopped mechanism instead of invisible backstory.',
    avoid: 'Do not make the food rotten or stale; avoid clocks covered in illegible numbers.',
    example: '聊到总在等电梯：一层层千层面像被按住的电梯楼层，只有一层轻轻向外滑出。',
  },
  {
    id: 'ceremonial-role',
    label: '郑重其事',
    direction: 'Give an ordinary meal an absurdly formal place in a small, restrained ceremonial arrangement.',
    bridgeRequirement: 'Connect the formality to a concrete action or object from the chat and let spacing or scale carry the joke.',
    avoid: 'Do not add a verdict, slogan, crowd of officials or generic personified food with a face.',
    example: '聊到终于做完小事：一只煎蛋被抬到简洁的颁奖台上，蛋黄正好嵌在领奖位。',
  },
  {
    id: 'shadow-disagreement',
    label: '影子唱反调',
    direction: 'Let the food or its container cast one shadow that belongs to a related but unexpected object.',
    bridgeRequirement: 'Preserve a plausible light direction and make the shadow share a visible contour or gesture with the food.',
    avoid: 'Do not use multiple contradictory light sources or turn the whole scene into an unrelated silhouette puzzle.',
    example: '聊到想赖在沙发上：盘中的可颂投出躺椅的影子，弧形恰好接上椅背。',
  },
]);

export const ATMOSPHERE_LIBRARY = freezeEntries([
  {
    id: 'dryly-solemn',
    label: '一本正经',
    direction: 'Treat the impossible arrangement with quiet, matter-of-fact seriousness.',
    visibleCue: 'Use balanced spacing, a steady viewpoint and one modest pool of light.',
  },
  {
    id: 'dream-drift',
    label: '梦里偏航',
    direction: 'Let the scene feel like a lucid but slightly misplaced dream.',
    visibleCue: 'Use one softened background boundary and a calm color shift; retain a crisp central relationship.',
  },
  {
    id: 'light-unruly',
    label: '轻微失控',
    direction: 'Give the scene playful instability without making it chaotic.',
    visibleCue: 'Tilt one secondary object slightly while the main food grouping stays clear and settled.',
  },
  {
    id: 'snug-impossible',
    label: '舒服地不合理',
    direction: 'Make the impossible scene feel small, warm and easy to inhabit.',
    visibleCue: 'Use rounded supporting forms, warm side light and uncluttered surrounding space.',
  },
  {
    id: 'empty-stage',
    label: '空场小戏',
    direction: 'Let the food occupy a quiet stage after the surrounding activity has left.',
    visibleCue: 'Use generous negative space and one leftover prop that echoes the conversation.',
  },
  {
    id: 'quiet-supernatural',
    label: '温和异象',
    direction: 'Suggest a gentle supernatural incident without horror or spectacle.',
    visibleCue: 'Give only the impossible seam a faint unexplained glow; keep the rest of the light ordinary.',
  },
  {
    id: 'sunny-absurd',
    label: '晴朗离谱',
    direction: 'Present the oddity in a fresh, uncomplicated daylight mood.',
    visibleCue: 'Use clear open space, a single broad daylight shadow and one cheerful color accent.',
  },
  {
    id: 'small-adventure',
    label: '刚走远一点',
    direction: 'Suggest an ordinary object has just returned from a modest adventure.',
    visibleCue: 'Use one open edge or path leaving the food grouping, with the rest of the setting quiet.',
  },
]);

function seededRandom(seed) {
  const text = String(seed ?? 'foodpicker');
  let state = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    state = Math.imul(state ^ text.charCodeAt(index), 16777619) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(entries, count, random) {
  const pool = [...entries];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, count);
}

/** A seed only chooses candidate directions; it never chooses the meal or joke. */
export function selectLibraryDirections(seed) {
  const random = seededRandom(seed);
  return {
    styles: sample(STYLE_LIBRARY, 3, random),
    mismatches: sample(MISMATCH_LIBRARY, 4, random),
    atmospheres: sample(ATMOSPHERE_LIBRARY, 3, random),
  };
}
