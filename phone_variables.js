// phone_variables.js - MVU Zod Schema 定义
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  手机功能: z.object({
    通讯录: z.record(
      z.string().describe('联系人ID'),
      z.object({
        姓名: z.string(),
        头像: z.string().optional().default('👤'),
        关系: z.string(),
        电话: z.string(),
        备注: z.string().optional().default(''),
        最后联系时间: z.string().optional(),
        分组: z.string().optional().default('同学')
      })
    ).prefault({}),
    
    短信记录: z.record(
      z.string().describe('联系人ID'),
      z.array(
        z.object({
          id: z.string(),
          时间: z.string(),
          发信人: z.enum(['user', 'character']),
          内容: z.string(),
          已读: z.boolean().prefault(false),
          类型: z.enum(['text', 'image', 'location']).default('text')
        })
      ).prefault([])
    ).prefault({}),
    
    地图位置: z.object({
      当前位置: z.string().default('私立斋明学园'),
      已解锁地点: z.array(z.string()).prefault([
        '教室', '旧校舍', '食堂', '图书馆', '操场', '体育馆'
      ]),
      标记地点: z.record(
        z.string().describe('地点ID'),
        z.object({
          名称: z.string(),
          描述: z.string(),
          坐标: z.tuple([z.number(), z.number()]),
          解锁条件: z.string().optional(),
          特殊事件: z.string().optional()
        })
      ).prefault({})
    }).prefault({}),
    
    设置: z.object({
      震动: z.boolean().default(true),
      声音: z.boolean().default(false),
      主题: z.enum(['light', 'dark', 'auto']).default('auto'),
      字体大小: z.number().min(12).max(24).default(16)
    }).prefault({})
  }).prefault({})
});

// 注册到MVU系统
$(() => {
  try {
    registerMvuSchema(Schema);
    console.log('[手机插件] 变量结构注册成功');
  } catch (error) {
    console.error('[手机插件] 变量结构注册失败:', error);
  }
});
