/**
 * EventBus - 核心解耦事件调度器
 * 采用全局单例模式，连接核心计算引擎与 Canvas 视觉渲染层
 */
window.SlotsRPG = window.SlotsRPG || {};

class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus] Error in event '${event}':`, err);
      }
    });
  }
}

window.SlotsRPG.EventBus = new EventBus();
