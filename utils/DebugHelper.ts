// utils/DebugHelper.ts
export class DebugHelper {
    static ENABLED = true; // Set to false to disable all debugging
    static LEVELS = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    static CURRENT_LEVEL = DebugHelper.LEVELS.INFO;
  
    static error(module: string, message: string, ...data: any[]) {
      if (!DebugHelper.ENABLED || DebugHelper.CURRENT_LEVEL < DebugHelper.LEVELS.ERROR) return;
      console.error(`[ERROR][${module}] ${message}`, ...data);
    }
  
    static warn(module: string, message: string, ...data: any[]) {
      if (!DebugHelper.ENABLED || DebugHelper.CURRENT_LEVEL < DebugHelper.LEVELS.WARN) return;
      console.warn(`[WARN][${module}] ${message}`, ...data);
    }
  
    static info(module: string, message: string, ...data: any[]) {
      if (!DebugHelper.ENABLED || DebugHelper.CURRENT_LEVEL < DebugHelper.LEVELS.INFO) return;
      console.log(`[INFO][${module}] ${message}`, ...data);
    }
  
    static debug(module: string, message: string, ...data: any[]) {
      if (!DebugHelper.ENABLED || DebugHelper.CURRENT_LEVEL < DebugHelper.LEVELS.DEBUG) return;
      console.log(`[DEBUG][${module}] ${message}`, ...data);
    }
  
    static trace(module: string, message: string, ...data: any[]) {
      if (!DebugHelper.ENABLED || DebugHelper.CURRENT_LEVEL < DebugHelper.LEVELS.TRACE) return;
      console.log(`[TRACE][${module}] ${message}`, ...data);
    }
  
    static vectorToString(vector: any): string {
      if (!vector) return "null";
      if (vector.toArray) {
        return `[${vector.toArray().map((v: number) => v.toFixed(2)).join(", ")}]`;
      }
      return `[${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}]`;
    }
  
    // Used to track performance issues
    static startTimer(label: string) {
      if (!DebugHelper.ENABLED) return;
      console.time(label);
    }
  
    static endTimer(label: string) {
      if (!DebugHelper.ENABLED) return;
      console.timeEnd(label);
    }
  }