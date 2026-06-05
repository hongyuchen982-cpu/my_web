export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "wip" | "maintained" | "archived";
  url?: string;
  github?: string;
  techs: string[];
}

export const projects: Project[] = [
  {
    id: "smart-grid",
    title: "Smart Grid — 智能电网调度系统",
    description:
      "基于 AI 预测的电力负载调度系统，支持实时监控与动态路由分配，面向新能源并网场景。",
    category: "AI / Energy",
    status: "active",
    url: "https://github.com",
    techs: ["Python", "PyTorch", "React", "WebSocket"],
  },
  {
    id: "battery-bms",
    title: "BMS 电池管理系统",
    description:
      "下一代电池管理系统前端面板，实时 SOC/SOH 可视化，支持多电芯级联监控与故障预警。",
    category: "IoT / Energy",
    status: "wip",
    github: "https://github.com",
    techs: ["TypeScript", "Next.js", "D3.js", "MQTT"],
  },
  {
    id: "code-vault",
    title: "Code Vault — 代码片段管理器",
    description:
      "面向开发者的本地优先代码片段管理工具，支持标签分类、全文搜索与 VS Code 插件集成。",
    category: "DevTools",
    status: "maintained",
    url: "https://github.com",
    techs: ["Rust", "Tauri", "React", "SQLite"],
  },
  {
    id: "net-probe",
    title: "NetProbe 网络探测工具",
    description:
      "轻量级网络质量探测 CLI，支持延迟/丢包/抖动多维监控，输出 Prometheus 格式指标。",
    category: "Infra / Net",
    status: "archived",
    github: "https://github.com",
    techs: ["Go", "gRPC", "Prometheus"],
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
