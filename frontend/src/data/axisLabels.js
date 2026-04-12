/**
 * 四轴八维：与计分向量 P/R、M/I、E/U、C/H 一致（Design doc 文案）。
 */
export const AXIS_GROUPS = [
  {
    id: 'pr',
    contrastZh: '主动性 vs. 反应性',
    poles: [
      {
        letter: 'P',
        english: 'Proactive',
        detail: '尝试首杀、主动控图、寻求 1v1 对枪。',
      },
      {
        letter: 'R',
        english: 'Reactive',
        detail: '守包点深位、补枪定位、残局收割。',
      },
    ],
  },
  {
    id: 'mi',
    contrastZh: '技术流 vs. 意识流',
    poles: [
      {
        letter: 'M',
        english: 'Mechanics',
        detail: '极短的反应时间、高爆头率、强行破点。',
      },
      {
        letter: 'I',
        english: 'Intelligence',
        detail: '道具覆盖率、反直觉选位、对 Timing 的把握。',
      },
    ],
  },
  {
    id: 'eu',
    contrastZh: '明星位 vs. 绿叶位',
    poles: [
      {
        letter: 'E',
        english: 'Ego/Star',
        detail: '需求资源、单人摸排、高经济占用。',
      },
      {
        letter: 'U',
        english: 'Utility/Support',
        detail: '负责投掷关键道具、拉枪线、为队友发枪。',
      },
    ],
  },
  {
    id: 'ch',
    contrastZh: '冷静派 vs. 激情派',
    poles: [
      {
        letter: 'C',
        english: 'Chilled',
        detail: '均压下心态稳定、无视外界干扰、冷酷处理。',
      },
      {
        letter: 'H',
        english: 'Hyped',
        detail: '击杀反馈强烈、队内语音活跃、容易受手感波动。',
      },
    ],
  },
];
