/**
 * PaytableConfig - 符号与赔率标准配置表
 * 严格遵照 PRD_系统需求规格书 3.3 节定义
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.PaytableConfig = {
  // 基础规格
  REEL_ROWS: 3,
  REEL_COLS: 5,
  BASE_BET_PER_LINE: 1,
  TOTAL_LINES: 25,
  SPIN_COST: 25, // 25线全开，单次消耗 25 机缘

  // 13 类核心符号定义
  SYMBOLS: {
    SYM_01: {
      id: 'SYM_01',
      name: '聚灵符',
      type: 'rune',
      subType: 'basic',
      color: '#4ecdc4',
      bgGrad: ['#0f3443', '#34e89e'],
      unlockLevel: 1,
      multipliers: { 3: 2, 4: 6, 5: 20 },
      desc: '返还机缘'
    },
    SYM_02: {
      id: 'SYM_02',
      name: '凝神符',
      type: 'rune',
      subType: 'medium',
      color: '#45b6fe',
      bgGrad: ['#1a2a6c', '#b21f1f'],
      unlockLevel: 1,
      multipliers: { 3: 4, 4: 12, 5: 40 },
      desc: '返还较多机缘'
    },
    SYM_03: {
      id: 'SYM_03',
      name: '破魔符',
      type: 'rune',
      subType: 'high',
      color: '#ff6b6b',
      bgGrad: ['#870000', '#190a05'],
      unlockLevel: 1,
      multipliers: { 3: 8, 4: 25, 5: 80 },
      desc: '返还大量机缘'
    },
    SYM_04: {
      id: 'SYM_04',
      name: '气血丹',
      type: 'pill',
      subType: 'hp',
      color: '#ff416c',
      bgGrad: ['#8a2387', '#e94057'],
      unlockLevel: 1,
      multipliers: { 3: 2, 4: 6, 5: 20 },
      desc: '产出气血储备与机缘'
    },
    SYM_05: {
      id: 'SYM_05',
      name: '修为丹',
      type: 'pill',
      subType: 'exp',
      color: '#f9d423',
      bgGrad: ['#ff4e50', '#f9d423'],
      unlockLevel: 1,
      multipliers: { 3: 2, 4: 8, 5: 30 },
      desc: '产出修为经验'
    },
    SYM_06: {
      id: 'SYM_06',
      name: '玄铁剑',
      type: 'equip',
      part: 'weapon',
      color: '#d4af37',
      bgGrad: ['#232526', '#414345'],
      unlockLevel: 1,
      multipliers: { 3: 1, 4: 3, 5: 10 },
      desc: '必爆武器箱'
    },
    SYM_07: {
      id: 'SYM_07',
      name: '青云甲',
      type: 'equip',
      part: 'armor',
      color: '#00c9ff',
      bgGrad: ['#09203f', '#537895'],
      unlockLevel: 1,
      multipliers: { 3: 1, 4: 3, 5: 10 },
      desc: '必爆防具衣服箱'
    },
    SYM_08: {
      id: 'SYM_08',
      name: '紫金戒',
      type: 'equip',
      part: 'ring',
      color: '#9b51e0',
      bgGrad: ['#2e0854', '#8e2de2'],
      unlockLevel: 1,
      multipliers: { 3: 2, 4: 5, 5: 15 },
      desc: '必爆饰品戒指箱'
    },
    SYM_09: {
      id: 'SYM_09',
      name: '混元履',
      type: 'equip',
      part: 'boots',
      color: '#27ae60',
      bgGrad: ['#11998e', '#38ef7d'],
      unlockLevel: 1, // 1级全开
      multipliers: { 3: 1, 4: 3, 5: 10 },
      desc: '必爆鞋子装备箱'
    },
    SYM_10: {
      id: 'SYM_10',
      name: '捆仙索',
      type: 'equip',
      part: 'belt',
      color: '#f39c12',
      bgGrad: ['#b79891', '#94716b'],
      unlockLevel: 1, // 1级全开
      multipliers: { 3: 1, 4: 3, 5: 10 },
      desc: '必爆腰带装备箱'
    },
    SYM_11: {
      id: 'SYM_11',
      name: '万应灵珠',
      type: 'wild',
      color: '#f1c40f',
      bgGrad: ['#ffe259', '#ffa751'],
      unlockLevel: 1,
      validColumns: [1, 2, 3, 4], // 仅出现在第 2, 3, 4, 5 列
      multipliers: {},
      desc: '百搭万用'
    },
    SYM_12: {
      id: 'SYM_12',
      name: '妖兽逆鳞',
      type: 'scatter',
      color: '#e74c3c',
      bgGrad: ['#cb2d3e', '#ef473a'],
      unlockLevel: 1,
      multipliers: {},
      desc: '3个以上触发妖兽挑战'
    },
    SYM_13: {
      id: 'SYM_13',
      name: '造化秘印',
      type: 'bonus',
      color: '#2ecc71',
      bgGrad: ['#00b09b', '#96c93d'],
      unlockLevel: 1,
      multipliers: {},
      desc: '5个以上触发洞天造化秘境'
    }
  },

  // 灵界 · 飘渺仙域 13 类神格化仙符定义 (PRD 4.3 节)
  SYMBOLS_TIER2: {
    SYM_01: { id: 'SYM_01', name: '极品仙晶', type: 'rune', color: '#38bdf8', desc: '产出海量灵界机缘' },
    SYM_02: { id: 'SYM_02', name: '玄黄灵魄', type: 'rune', color: '#818cf8', desc: '产出巨额灵界机缘' },
    SYM_03: { id: 'SYM_03', name: '太素神雷符', type: 'rune', color: '#f43f5e', desc: '引动九霄神雷机缘' },
    SYM_04: { id: 'SYM_04', name: '九转金丹', type: 'pill', color: '#fb7185', desc: '产出仙躯气血与机缘' },
    SYM_05: { id: 'SYM_05', name: '鸿蒙真灵丹', type: 'pill', color: '#fbbf24', desc: '产出极巨修为真意' },
    SYM_06: { id: 'SYM_06', name: '斩仙飞剑', type: 'equip', part: 'weapon', color: '#f59e0b', desc: '必爆洪荒神剑宝箱' },
    SYM_07: { id: 'SYM_07', name: '诸天神煞铠', type: 'equip', part: 'armor', color: '#06b6d4', desc: '必爆混沌仙甲宝箱' },
    SYM_08: { id: 'SYM_08', name: '虚空纳芥戒', type: 'equip', part: 'ring', color: '#c084fc', desc: '必爆芥子戒宝箱' },
    SYM_09: { id: 'SYM_09', name: '缩地步云履', type: 'equip', part: 'boots', color: '#34d399', desc: '必爆步云仙履宝箱' },
    SYM_10: { id: 'SYM_10', name: '混元捆仙绫', type: 'equip', part: 'belt', color: '#fb923c', desc: '必爆捆仙灵宝宝箱' },
    SYM_11: { id: 'SYM_11', name: '造化混元珠', type: 'wild', color: '#facc15', desc: '诸天百搭万用' },
    SYM_12: { id: 'SYM_12', name: '洪荒神魔鳞', type: 'scatter', color: '#ef4444', desc: '3个以上触发大荒神魔战' },
    SYM_13: { id: 'SYM_13', name: '鸿蒙太初印', type: 'bonus', color: '#10b981', desc: '5个以上触发太初仙阙秘境' }
  },

  getSymbolName(symbolId, worldTier = 1) {
    if (worldTier === 2 && this.SYMBOLS_TIER2[symbolId]) {
      return this.SYMBOLS_TIER2[symbolId].name;
    }
    return (this.SYMBOLS[symbolId] && this.SYMBOLS[symbolId].name) || symbolId;
  }
};
