
import { GoogleGenAI } from "@google/genai";
import { Message, TarotCard } from '../types';
import { SENSORY_TASKS } from '../constants';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-3-flash-preview';

// Updated logic: Deep Narrative Therapy Guide & Evasion Handling
const SYSTEM_INSTRUCTION = `
你不是一个只会算命的AI，你是“Echo”这款App的叙事疗法向导。你的核心目标是陪伴用户通过塔罗牌的意象，像剥洋葱一样层层深入地探索他们潜意识中的情绪和当下的经历。

必须严格遵守以下引导节奏：

1. **阶段一：视觉锚定（1个回合）**
   - 不要解释牌意。
   - 引导用户只关注牌面的某 *一个* 细节（颜色、物品、姿态）。

2. **阶段二：情绪质感（2-3个回合）**
   - 基于用户看到的细节，询问这带给他们什么感觉。
   - 引导用户描述感觉的质地（沉重？流动？尖锐？）。

3. **阶段三：现实投射与深挖（核心阶段，通常6个回合以上）**
   - 将那种感觉引向用户 *今天* 或 *最近* 的具体经历。
   - 追问细节：“这种感觉让你想到了今天发生的哪一个具体的瞬间？”
   - **保持好奇与耐心**：多问“当时你在想什么？”“那一刻身体有什么反应？”“为什么那个瞬间让你印象深刻？”。

**关键规则 - 动态应对：**

**规则 A：回避与阻抗处理（最高优先级）**
- 如果用户表现出**回避、不知道说什么、或者没什么特别感受**（例如：“我不知道”、“没什么特别的”、“不想说”、“就那样”）：
  - **立即停止追问！** 不要强迫用户挖掘。
  - 给予一个温柔的接纳或总结（例如：“没关系，有时候情绪就是像雾一样看不清。”）。
  - 给出一个极小的放松建议（如：“试着深呼吸一次”或“去归息页面做一个知觉校准”）。
  - 然后**转换方向**，询问：“除了这件事，今天还有发生什么其他想记录的吗？”

**规则 B：用户主动换题**
- 如果用户说“换个话题”或表达想聊别的：
  - 用一句话优雅地总结刚才的话题（例如：“那个瞬间确实值得被记住。”）。
  - 然后开放式提问：“好的，今天还有什么其他片刻让你印象深刻？”

**规则 C：建议给予**
- **严禁**主动给建议或讲大道理，除非用户明确求助（如“我该怎么办”）。
- 用户求助时，引导设定“明日能量目标”或做“知觉校准”。

语言风格：
- 像深夜的倾听者，温柔、缓慢、有空间感。
- **必须使用中文**。
- 每次回复保持简短（40-60字），把话语权留给用户。
`;

export const GeminiService = {
  /**
   * Stage 1: Review Yesterday
   */
  async reviewYesterday(goal: string, completed: boolean): Promise<string> {
    const prompt = completed
      ? `用户完成了昨日目标：“${goal}”。请生成一句简短、极具灵性与诗意的夸奖。比如“星辰为你加冕”或“能量如潮水般涌来”。限20字以内。`
      : `用户没能完成昨日目标：“${goal}”。请结合月亮的阴晴圆缺，生成一句非常温柔的安慰，告诉他们休息和停滞也是生命周期的一部分。限30字以内。`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || (completed ? "星光见证了你的行动。" : "月亮也允许自己有残缺的时刻。");
    } catch (e) {
      console.error(e);
      return completed ? "做得好，能量在流动。" : "没关系，这只是一个逗号。";
    }
  },

  /**
   * Stage 2: Start Today's Awareness (Visual Exploration)
   */
  async startCardReflection(card: TarotCard): Promise<string> {
    // Modified to start with Visual Observation
    const prompt = `
      用户抽到的卡牌是: ${card.name}。
      任务: 
      1. 不要解释这张牌的意思。
      2. 请直接问一个关于视觉细节的问题，引导用户找出画面中最吸引他的 *一个* 点。
      例如：“在这张${card.name}中，哪个角落或色彩最先抓住了你的目光？”
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || `看着这张${card.name}，你第一眼注意到了什么？`;
    } catch (e) {
      return "闭上眼睛。提到这张牌，你脑海中浮现了什么画面？";
    }
  },

  /**
   * Stage 2: Continue Conversation
   */
  async chatReply(history: Message[], newResult: string): Promise<string> {
    // Construct simplified history string
    const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
      对话历史:
      ${context}
      用户最新回复: "${newResult}"
      
      任务: 
      1. 检测用户意图：
         - **回避/不知道/不想说** -> 触发规则 A (停止追问，安抚并询问其他事)。
         - **换话题** -> 触发规则 B (总结上文，开启新话题)。
         - **正常叙述** -> 继续阶段三（现实投射与深挖）。
      
      2. 如果是深挖阶段：
         - 继续追问细节（感受、想法、身体反应）。
         - **不要急于总结**，除非用户已经聊得很透彻了。
      
      保持回复简短（50字内），像朋友一样轻声交谈。
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      return response.text || "我听到了。请多说一点。";
    } catch (e) {
      return "我在倾听...";
    }
  },

  /**
   * Stage 2: Generate Titles
   */
  async generateTitles(history: Message[]): Promise<string[]> {
     const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
     const prompt = `
      基于这段对话历史:
      ${context}
      
      任务: 提取用户在对话中提到的**真实生活经历**或**具体感受**，生成3个极简的日记标题。
      要求：
      1. 必须与用户具体的经历相关（不要只用塔罗牌的术语）。
      2. 充满诗意但具体。
      3. 每个标题不超过8个字。
      
      仅返回标题，用竖线 "|" 分隔。
      示例: 错过的早班车|雨中的宁静|与自我的和解
     `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      const text = response.text || "";
      return text.split('|').map(t => t.trim()).slice(0, 3);
    } catch (e) {
      return ["静谧反思", "今日智慧", "月之低语"];
    }
  },

  /**
   * Stage 3: Suggest Energy Seed Suggestions (3 options)
   */
  async getSeedSuggestions(card: TarotCard): Promise<string[]> {
    const prompt = `
      卡牌: ${card.name}。
      任务: 针对这张牌的能量，给出3个非常简单、具体、5分钟内可完成的“明日能量小目标”（Energy Seed）。
      要求：
      1. 极简，动词开头。
      2. 像一种日常的小魔法。
      3. 不要超过10个字。
      
      仅返回3个短语，用竖线 "|" 分隔。
      示例：喝一杯温水|整理书桌一角|看一次日落
    `;
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      const text = response.text || "深呼吸三次|给植物浇水|抬头看星星";
      return text.split('|').map(t => t.trim()).slice(0, 3);
    } catch (e) {
      return ["静坐一分钟", "整理相册", "写下一句感恩"];
    }
  },

  /**
   * New: Monthly Insight
   */
  async generateMonthlyInsight(keywords: string[]): Promise<string> {
      if (keywords.length === 0) return "本月的能量在静谧中流淌，等待着觉察的光亮。";

      const prompt = `
        本月用户的核心能量关键词是: [${keywords.join(', ')}]。
        请结合这些关键词和月相的隐喻（如盈亏、潮汐、引力），写一段简短、唯美、具有治愈感的“月度寄语”。
        
        格式要求：
        1. 必须包含至少一个关键词。
        2. 语气像一位古老的智者或宇宙的信使。
        3. 50字以内。
        示例风格：“本月你的能量在 #信念 中沉淀，像渐盈的弦月，正在积蓄突破的力量。”
      `;

      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: { systemInstruction: SYSTEM_INSTRUCTION },
        });
        return response.text || "月光温柔地包裹着你的每一个念头，静待花开。";
      } catch (e) {
        return "潮汐起伏，皆是生命的韵律。";
      }
  },

  /**
   * New: Sensory Calibration Task (Database Driven)
   */
  async generateSensoryTask(senseType: string): Promise<string> {
      // Simulate "thinking" delay for better UX (so it feels like calibration)
      await new Promise(resolve => setTimeout(resolve, 800));

      const tasks = SENSORY_TASKS[senseType as keyof typeof SENSORY_TASKS];
      
      if (!tasks || tasks.length === 0) {
          return "静静感受当下的呼吸。"; // Fallback
      }

      // Pick random task
      const randomIndex = Math.floor(Math.random() * tasks.length);
      return tasks[randomIndex];
  }
};
