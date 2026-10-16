# 《修仙作弊器：造化聚宝盆》Stitch 美术资产生成与 Prompt 规格书

为了彻底摆脱纯代码几何图形的粗糙感，让游戏拥有商业级国风修仙手游的华丽质感，本指南专为 **Stitch / AI 图像生成工具** 量身定制。

引擎现已完成架构升级：**已内置图片资源加载器与热替换机制**。  
只要在 Stitch 中生成并保存图片，放入对应文件夹，**刷新浏览器即可瞬间变为高清精美画面，无需修改任何一行代码！**

---

## 一、 美术风格核心锚点（全局通用提示词）

在 Stitch 或生图工具中，请保持所有图标的风格统一：

- **核心风格**：`Dark Minimalist Taoism, Xianxia Fantasy Game UI Icon, C4D/Octane Render style, high detail, glowing magic aura, clean dark obsidian background, sharp edge, 2D mobile game asset`
- **中文风格关键词**：`新国风暗黑仙侠、3D玉石与金石质感、道门符文玄光、极简纯净背景、手游UI高保真图标`
- **尺寸与格式规格**：
  - 单个符号图标：建议 **256 × 256 px** 或 **512 × 512 px**，PNG 格式（透明背景或深墨黑背景）。
  - 文件命名：严格按 ID 命名（如 `SYM_01.png`）。

---

## 二、 13 类核心符号专属 Stitch 生图 Prompt 提示词

请直接复制对应的英文/中文提示词到 Stitch 中生成，并将生成的图片重命名后放入：  
📂 **存放路径**：`e:\my games\slots_rpg\assets\symbols\`

| 符号ID | 符号名称 | 规格分类 | Stitch 提示词（直接复制即可使用） |
| :---: | :---: | :---: | :--- |
| **`SYM_01.png`** | 聚灵符 | 基础符文 | `A glowing cyan Taoist paper talisman with ancient gold cinnabar calligraphy, floating in dark void, soft turquoise spiritual mist, game item icon, clean centered composition, 3D render, dark background, 8k --v 6.0` |
| **`SYM_02.png`** | 凝神符 | 中级符文 | `A celestial cobalt-blue Daoist rune scroll with glowing sapphire ink symbols, mystical blue lightning sparks, fantasy mobile game UI icon, dark minimalist background, high contrast --v 6.0` |
| **`SYM_03.png`** | 破魔符 | 高级符文 | `An ancient crimson cinnabar talisman with fierce fiery red aura, burning golden Taoist seal script, glowing embers, demon-slaying magic talisman, dark background, dynamic game icon --v 6.0` |
| **`SYM_04.png`** | 气血丹 | 气血灵丹 | `A glowing ruby-red Chinese elixir pill floating inside a translucent jade furnace ring, crimson energy swirl, glossy crystal texture, RPG medicine item icon, dark luxury background --v 6.0` |
| **`SYM_05.png`** | 修为丹 | 九转金丹 | `A radiant golden Nine-Turn immortality elixir pill, surrounded by swirling sacred solar halos and golden dragon mist, divine glowing relic, game asset icon, black background, octane render --v 6.0` |
| **`SYM_06.png`** | 玄铁剑 | 装备(武器) | `An epic black iron flying sword with sharp radiant golden edge, dragon carved hilt, glowing cyan spirit blade trail, Xianxia fantasy weapon icon, isometric centered, dark background --v 6.0` |
| **`SYM_07.png`** | 青云甲 | 装备(防具) | `A majestic celestial Taoist battle robe and armor, glowing cyan silk with gold dragon pauldrons, divine defensive barrier aura, RPG equipment icon, dark studio lighting --v 6.0` |
| **`SYM_08.png`** | 紫金戒 | 装备(饰品) | `A mystical purple amethyst gemstone ring made of ancient dark gold, sparkling starlight gleam, Sumeru spatial ring, luxury fantasy jewelry item icon, dark background --v 6.0` |
| **`SYM_09.png`** | 混元履 | 装备(鞋靴) | `A pair of ethereal cloud-stepping immortal boots, glowing emerald green wind swirls, feather light trim, Xianxia footwear equipment icon, dark background --v 6.0` |
| **`SYM_10.png`** | 捆仙索 | 装备(腰带) | `A divine golden coiled binding rope with intricate Taoist celestial knots, glowing amber spiritual energy ribbons, magical binding relic icon, dark background --v 6.0` |
| **`SYM_11.png`** | **万应灵珠 (WILD)** | 百搭大奖 | `A glowing Tai-Chi Yin-Yang golden crystal orb, swirling sacred light and dark nebula cosmic energy, golden lotus ring, supreme mystical artifact, mobile slot wild symbol icon, epic glow --v 6.0` |
| **`SYM_12.png`** | **妖兽逆鳞 (SCATTER)** | 战斗触发 | `A fierce glowing crimson red dragon beast crest with burning golden eyes and sharp fangs, roaring mythical monster totem, scatter badge icon, dark ominous aura, high impact --v 6.0` |
| **`SYM_13.png`** | **造化秘印 (BONUS)** | 秘境大奖 | `An octagonal ancient emerald jade Bagua seal amulet with eight trigrams engraved in liquid gold, emerald light beams, Chinese sacred treasure token, slot bonus badge icon, dark background --v 6.0` |

---

## 三、 界面背景与阵盘外框 Stitch 生成需求

📂 **存放路径**：`e:\my games\slots_rpg\assets\ui\`

| 文件名 | 用途 | 建议尺寸 | Stitch 提示词（直接复制即可使用） |
| :---: | :---: | :---: | :--- |
| **`reel_frame.png`** | 3x5 阵盘边框 | 700 × 440 px | `An ornate dark bronze and gold Taoist array frame with carved cloud patterns and glowing golden Bagua corners, center transparent window, 2D mobile game UI frame, clean edges --v 6.0` |
| **`reel_bg.png`** | 阵盘底板 | 680 × 420 px | `A dark obsidian stone tablet with faint etched astrological star map and glowing golden meridian lines, subtle texture, game slot background tile, dark mode --v 6.0` |
| **`treasure_basin.png`**| 聚宝盆底座图 | 512 × 256 px | `A mythical Chinese bronze Treasure Basin (Jubaopen) overflowing with glowing golden liquid and floating jade runes, ancient engravings, mobile game UI asset, dark background --v 6.0` |

---

## 四、 妖兽与关卡 Boss 香蕉 / Stitch 专属生图 Prompt 规格清单

📂 **存放路径**：`e:\my games\slots_rpg\assets\monsters\` 与 `assets\boss\`

| 文件名 | 妖兽分类 | 建议尺寸 | 香蕉 / Stitch 专属生图 Prompt |
| :--- | :---: | :---: | :--- |
| **`monster_fox.png`** | 一阶·赤灵妖狐 | 512 × 512 | `A mythical Chinese nine-tailed spirit fox head, glowing amber fox eyes, vibrant crimson red and fiery orange fur, floating mystical blue foxfire embers, dark fantasy RPG beast avatar, centered, dark stone medallion background, clean edges --v 6.0` |
| **`monster_toad.png`** | 一阶·黑水巨蟾 | 512 × 512 | `A giant demonic poisonous toad covered in glowing emerald gemstone warts, deep swamp green skin, dripping toxic vapor, glowing yellow slit eyes, menacing fantasy creature portrait, dark background, 3D render --v 6.0` |
| **`monster_bat.png`** | 一阶·噬血魔蝠 | 512 × 512 | `A terrifying vampiric shadow bat with sharp obsidian wings and dagger-like fangs, glowing blood-red ruby eyes, sonic distortion shockwaves, dark purple spiritual mist, game monster avatar icon --v 6.0` |
| **`monster_boar.png`** | 一阶·狂暴獠猪 | 512 × 512 | `A raging iron-tusked mountain boar, thick crag stone armor hide, glowing fiery red eyes, giant curved tusks dripping sparks, charging posture, dark fantasy RPG beast icon --v 6.0` |
| **`monster_spider.png`** | 一阶·幽冥鬼蛛 | 512 × 512 | `A sinister eight-eyed ghostly shadow spider, iridescent jade venomous fangs, glowing emerald abdominal skull runes, translucent web threads, dark abyss background, mobile RPG monster portrait --v 6.0` |
| **`monster_scorpion.png`**| 二阶·赤火巨蝎 | 512 × 512 | `A massive molten fire scorpion, black obsidian carapace with magma cracks, raised glowing crimson stinger dripping liquid hellfire, giant serrated pincers, dark fantasy monster icon --v 6.0` |
| **`monster_wolf.png`** | 二阶·幽冥狂狼 | 512 × 512 | `A ferocious shadow frost dire wolf, glowing spectral ice-blue eyes, bristling dark fur with frost tips, bared gleaming silver fangs, savage snarl, dark fantasy beast avatar icon --v 6.0` |
| **`monster_ape.png`** | 二阶·赤火暴猿 | 512 × 512 | `A colossal roaring lava gorilla ape, glowing volcanic magma fur, molten stone armor knuckles, burning golden eyes, terrifying primal roar, dark volcanic background, high impact game avatar --v 6.0` |
| **`monster_leopard.png`**| 精英·三目雷豹 | 512 × 512 | `A sleek mystical lightning panther, purple electric arcs crackling around fur, an open third celestial divine eye on forehead glowing with golden lightning, dynamic predator pose, dark background --v 6.0` |
| **`monster_rhino.png`** | 精英·金角巨兕 | 512 × 512 | `An ancient armored mythological beast rhino, towering spiral golden horn radiating solar energy, impenetrable dark steel plate hide, glowing red eyes, unstoppable force, game avatar icon --v 6.0` |
| **`monster_lion.png`** | 精英·紫晶翼狮 | 512 × 512 | `A majestic amethyst winged lion, mane composed of glowing violet crystal clusters, massive razor crystal wings, glowing yellow royal eyes, celestial beast crest icon, dark background --v 6.0` |
| **`monster_bone_snake.png`**| 精英·白骨巨蛇| 512 × 512 | `An enormous skeletal bone serpent, pale weathered dragon spine, hollow skull with eerie green ghostly soul fire burning in eye sockets, dark underworld miasma, high detail RPG monster icon --v 6.0` |
| **`monster_hawk.png`** | 精英·九天雷鹏 | 512 × 512 | `A majestic celestial storm thunder hawk, golden lightning talons, wings whipping up hurricane vortex and lightning storms, sharp piercing amber gaze, Chinese mythical roc icon --v 6.0` |
| **`wolf_companion.png`** | 灵兽·青灵狼 | 512 × 512 | `An ethereal loyal spirit wolf companion, glowing translucent cyan fur, swirling blue spiritual water mist, peaceful yet protective posture, transparent background, clean edges --v 6.0` |
| **`boss_red_python.png`**| 练气妖王·赤炼蟒 | 512 × 512 | `A colossal mythical crimson serpent king with flared cobra hood and small dragon horns, glowing golden slit eyes, burning venomous flames, scales reflecting magma, terrifying boss portrait, dark background --v 6.0` |
| **`boss_golden_chimera.png`**| 筑基神兽·铁甲金猊| 512 × 512 | `A legendary Chinese golden Qilin chimera divine beast, covered in heavy imperial gold sacred armor plates, fiery dragon whiskers, holy crimson eyes, celestial solar flames radiating, epic boss portrait --v 6.0` |
| **`boss_thunder_dragon.png`**| 金丹妖祖·九霄雷龙| 512 × 512 | `An immense celestial azure thunder dragon coiling through dark thunderstorm clouds, radiant golden antlers, flashing lightning arcs illuminating deep blue dragon scales, supreme divine boss portrait --v 6.0` |

---

## 五、 主角修真者立绘香蕉 / Stitch 生图 Prompt 规格清单

📂 **存放路径**：`e:\my games\slots_rpg\assets\character\`

| 文件名 | 角色状态 | 建议尺寸 | 香蕉 / Stitch 专属生图 Prompt |
| :--- | :---: | :---: | :--- |
| **`hero_cultivator.png`**| 修真者主立绘 | 512 × 512 | `A peerless handsome young Chinese Daoist swordmaster cultivator, long flowing black hair tied with a jade hairpin, wearing pristine white and gold celestial Taoist robes with turquoise sash, a glowing golden flying sword floating beside him with sharp blue sword qi trails, serene focused heroic expression, subtle golden circular Bagua halo behind back, clean dark background, 3D Octane render, luxury mobile game character portrait --v 6.0` |
| **`hero_mortal.png`** | 序章散修凡人 | 512 × 512 | `A determined young Chinese commoner apprentice, simple rustic linen martial robe, holding a weathered iron machete, spirited resolute eyes, youthful cultivator beginning his journey, dark background --v 6.0` |

---

## 六、 极速验证：如何立即生效？

1. 使用上述专属 Prompt 生成图片；
2. 保存为对应的标准英文文件名（如 `monster_fox.png`、`hero_cultivator.png`）；
3. 放入对应目录（`assets/monsters/`、`assets/boss/`、`assets/character/`）；
4. **刷新浏览器页面**，所有怪物与角色立绘即刻被替换为最新的高质量 AI 原画，无需修改任何代码！

