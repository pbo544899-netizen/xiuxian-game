/**
 * PaylinesConfig - 25 条标准中奖折线定义
 * 严格依据 PRD_系统需求规格书 3.2 节定义
 * 坐标格式: [rowCol0, rowCol1, rowCol2, rowCol3, rowCol4]
 * 其中 row 取值 0 (上层), 1 (中层), 2 (下层)
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.PaylinesConfig = [
  { id: 1,  name: "Line 1",  coords: [1, 1, 1, 1, 1], color: "#e74c3c" },
  { id: 2,  name: "Line 2",  coords: [0, 0, 0, 0, 0], color: "#3498db" },
  { id: 3,  name: "Line 3",  coords: [2, 2, 2, 2, 2], color: "#2ecc71" },
  { id: 4,  name: "Line 4",  coords: [0, 1, 2, 1, 0], color: "#f1c40f" },
  { id: 5,  name: "Line 5",  coords: [2, 1, 0, 1, 2], color: "#9b59b6" },
  { id: 6,  name: "Line 6",  coords: [0, 0, 1, 0, 0], color: "#1abc9c" },
  { id: 7,  name: "Line 7",  coords: [2, 2, 1, 2, 2], color: "#e67e22" },
  { id: 8,  name: "Line 8",  coords: [1, 0, 0, 0, 1], color: "#34495e" },
  { id: 9,  name: "Line 9",  coords: [1, 2, 2, 2, 1], color: "#e84393" },
  { id: 10, name: "Line 10", coords: [0, 1, 0, 1, 0], color: "#00cec9" },
  { id: 11, name: "Line 11", coords: [2, 1, 2, 1, 2], color: "#6c5ce7" },
  { id: 12, name: "Line 12", coords: [1, 0, 1, 0, 1], color: "#fdcb6e" },
  { id: 13, name: "Line 13", coords: [1, 2, 1, 2, 1], color: "#d63031" },
  { id: 14, name: "Line 14", coords: [0, 1, 1, 1, 2], color: "#0984e3" },
  { id: 15, name: "Line 15", coords: [2, 1, 1, 1, 0], color: "#00b894" },
  { id: 16, name: "Line 16", coords: [1, 0, 1, 2, 1], color: "#fd79a8" },
  { id: 17, name: "Line 17", coords: [1, 2, 1, 0, 1], color: "#a29bfe" },
  { id: 18, name: "Line 18", coords: [0, 0, 1, 2, 2], color: "#ffeaa7" },
  { id: 19, name: "Line 19", coords: [2, 2, 1, 0, 0], color: "#fab1a0" },
  { id: 20, name: "Line 20", coords: [1, 2, 2, 2, 1], color: "#81ecec" },
  { id: 21, name: "Line 21", coords: [1, 0, 0, 0, 1], color: "#74b9ff" },
  { id: 22, name: "Line 22", coords: [0, 1, 0, 1, 0], color: "#ff7675" },
  { id: 23, name: "Line 23", coords: [2, 1, 2, 1, 2], color: "#55efc4" },
  { id: 24, name: "Line 24", coords: [0, 2, 0, 2, 0], color: "#f368e0" },
  { id: 25, name: "Line 25", coords: [2, 0, 2, 0, 2], color: "#ff9f43" }
];
