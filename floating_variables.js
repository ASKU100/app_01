// floating_variables.js
// 悬浮球插件变量系统 - 完全独立的新变量结构

import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// 定义独立于原插件的新变量结构
const ContactSchema = z.object({
  name: z.string().describe('联系人姓名'),
  phone: z.string().describe('手机号码'),
  avatar: z.string().optional().describe('头像标识'),
  lastContact: z.string().optional().describe('最后联系时间'),
  notes: z.string().optional().describe('备注')
});

const MessageSchema = z.object({
  id: z.string().describe('消息ID'),
  time: z.string().describe('发送时间'),
  sender: z.string().describe('发送者'),
  content: z.string().describe('消息内容'),
  read: z.boolean().default(false).describe('是否已读')
});

const LocationSchema = z.object({
  name: z.string().describe('地点名称'),
  description: z.string().optional().describe('地点描述'),
  areas: z.array(z.string()).optional().describe('子区域列表'),
  unlocked: z.boolean().default(false).describe('是否已解锁'),
  lastVisited: z.string().optional().describe('最后访问时间')
});

export const Schema = z.object({
  floating_plugin: z.object({
    // 通讯录数据
    contacts: z.array(ContactSchema).prefault([]).describe('通讯录联系人列表'),
    
    // 短信数据，按联系人分组
    messages: z.record(z.string(), z.array(MessageSchema)).prefault({}).describe('短信记录，键为联系人姓名'),
    
    // 地图数据
    locations: z.array(LocationSchema).prefault([]).describe('地点数据'),
    
    // 插件设置
    settings: z.object({
      autoLoadContacts: z.boolean().default(true).describe('自动从initvar加载联系人'),
      notificationEnabled: z.boolean().default(true).describe('启用通知'),
      windowPositions: z.record(z.string(), z.object({
        x: z.number(),
        y: z.number()
      })).prefault({}).describe('窗口位置记录')
    }).prefault({}),
    
    // 插件状态
    state: z.object({
      lastActiveWindow: z.string().optional().describe('最后激活的窗口'),
      unreadCount: z.number().default(0).describe('未读消息数'),
      initialized: z.boolean().default(false).describe('是否已初始化')
    }).prefault({})
  }).prefault({})
});

// 自动从[initvar]数据初始化通讯录
function initContactsFromInitvar() {
  try {
    // 尝试从现有的变量系统中读取角色数据
    const currentData = window.Mvu?.stat_data;
    if (!currentData) return [];
    
    const contacts = [];
    
    // 从角色变量中提取联系人信息
    if (currentData.角色) {
      Object.entries(currentData.角色).forEach(([name, data]) => {
        if (data && typeof data === 'object') {
          contacts.push({
            name: name,
            phone: generateJapanesePhoneNumber(),
            avatar: getInitials(name),
            lastContact: null,
            notes: `来自角色变量系统`
          });
        }
      });
    }
    
    // 从[initvar]格式中读取（如果存在）
    const initvarText = document.querySelector('[comment*="[initvar]"]')?.textContent;
    if (initvarText) {
      const lines = initvarText.split('\n');
      let currentRole = null;
      
      lines.forEach(line => {
        const roleMatch = line.match(/^\s*([^:]+):\s*$/);
        if (roleMatch && !line.includes('系统') && !line.includes('角色') && !line.includes('任务')) {
          const roleName = roleMatch[1].trim();
          if (roleName && !contacts.some(c => c.name === roleName)) {
            contacts.push({
              name: roleName,
              phone: generateJapanesePhoneNumber(),
              avatar: getInitials(roleName),
              lastContact: null,
              notes: `从initvar解析`
            });
          }
        }
      });
    }
    
    return contacts;
  } catch (error) {
    console.error('从initvar初始化通讯录失败:', error);
    return [];
  }
}

// 生成日本手机号码
function generateJapanesePhoneNumber() {
  const prefix = ['080', '090', '070'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const numbers = Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join('');
  return `${randomPrefix}-${numbers.substring(0, 4)}-${numbers.substring(4)}`;
}

// 获取姓名首字母
function getInitials(name) {
  if (!name) return '?';
  const chineseMatch = name.match(/[\u4e00-\u9fa5]/g);
  if (chineseMatch && chineseMatch.length >= 2) {
    return chineseMatch[0] + chineseMatch[1];
  }
  return name.substring(0, 2).toUpperCase();
}

// 初始化地图数据
function initLocationsData() {
  return [
    {
      name: '校舍本馆',
      description: '学校的主教学楼，包含教室、办公室和各种功能室',
      areas: ['屋顶平台', '二年级教室', '图书室', '电脑室', '音乐室', '美术室'],
      unlocked: true,
      lastVisited: null
    },
    {
      name: '体育馆栋',
      description: '体育设施集中的建筑，包含体育馆、武道场和更衣室',
      areas: ['体育馆主场', '更衣室', '淋浴间', '体育器材室', '柔道场', '剑道场'],
      unlocked: true,
      lastVisited: null
    },
    {
      name: '社团大楼',
      description: '各类社团的活动场所，有时会有空房间',
      areas: ['社团部室', '空房间', '新闻部部室', '灵异研究会部室'],
      unlocked: false,
      lastVisited: null
    },
    {
      name: '室外区域',
      description: '学校的户外场地，包括运动场和休闲区',
      areas: ['中庭', '大操场', '游泳池', '网球场', '弓道场', '校舍后方'],
      unlocked: true,
      lastVisited: null
    },
    {
      name: '旧校舍',
      description: '已停用的旧校舍，平时很少有人去',
      areas: ['旧教室', '仓库', '废弃实验室'],
      unlocked: false,
      lastVisited: null
    }
  ];
}

// 全局API供前端调用
const FloatingVariables = {
  // 获取通讯录数据
  getContacts() {
    try {
      const data = window.Mvu?.stat_data?.floating_plugin;
      if (data && data.contacts && data.contacts.length > 0) {
        return data.contacts;
      }
      // 如果没有数据，从initvar初始化
      const newContacts = initContactsFromInitvar();
      this.saveContacts(newContacts);
      return newContacts;
    } catch (error) {
      console.error('获取通讯录失败:', error);
      return initContactsFromInitvar();
    }
  },
  
  // 保存通讯录数据
  async saveContacts(contacts) {
    if (!window.Mvu?.setMvuVariable) {
      console.warn('Mvu API不可用，无法保存通讯录');
      return false;
    }
    
    try {
      await window.Mvu.setMvuVariable(window.Mvu, 'floating_plugin/contacts', contacts, {
        reason: '悬浮球插件：更新通讯录'
      });
      return true;
    } catch (error) {
      console.error('保存通讯录失败:', error);
      return false;
    }
  },
  
  // 获取地图数据
  getLocations() {
    try {
      const data = window.Mvu?.stat_data?.floating_plugin;
      if (data && data.locations && data.locations.length > 0) {
        return data.locations;
      }
      // 如果没有数据，初始化
      const newLocations = initLocationsData();
      this.saveLocations(newLocations);
      return newLocations;
    } catch (error) {
      console.error('获取地图数据失败:', error);
      return initLocationsData();
    }
  },
  
  // 保存地图数据
  async saveLocations(locations) {
    if (!window.Mvu?.setMvuVariable) {
      console.warn('Mvu API不可用，无法保存地图数据');
      return false;
    }
    
    try {
      await window.Mvu.setMvuVariable(window.Mvu, 'floating_plugin/locations', locations, {
        reason: '悬浮球插件：更新地图数据'
      });
      return true;
    } catch (error) {
      console.error('保存地图数据失败:', error);
      return false;
    }
  },
  
  // 获取短信记录
  getMessages(contactName) {
    try {
      const data = window.Mvu?.stat_data?.floating_plugin;
      if (data && data.messages && data.messages[contactName]) {
        return data.messages[contactName];
      }
      return [];
    } catch (error) {
      console.error('获取短信记录失败:', error);
      return [];
    }
  },
  
  // 保存短信记录
  async saveMessages(contactName, messages) {
    if (!window.Mvu?.setMvuVariable) {
      console.warn('Mvu API不可用，无法保存短信记录');
      return false;
    }
    
    try {
      const currentData = window.Mvu?.stat_data?.floating_plugin || {};
      const currentMessages = currentData.messages || {};
      
      await window.Mvu.setMvuVariable(
        window.Mvu,
        `floating_plugin/messages/${contactName}`,
        messages,
        { reason: '悬浮球插件：更新短信记录' }
      );
      return true;
    } catch (error) {
      console.error('保存短信记录失败:', error);
      return false;
    }
  },
  
  // 添加新联系人
  async addContact(contact) {
    const contacts = this.getContacts();
    const exists = contacts.some(c => c.name === contact.name || c.phone === contact.phone);
    
    if (!exists) {
      contacts.push(contact);
      return await this.saveContacts(contacts);
    }
    return false;
  },
  
  // 解锁地点
  async unlockLocation(locationName) {
    const locations = this.getLocations();
    const location = locations.find(l => l.name === locationName);
    
    if (location && !location.unlocked) {
      location.unlocked = true;
      location.lastVisited = new Date().toLocaleString();
      return await this.saveLocations(locations);
    }
    return false;
  },
  
  // 初始化插件数据
  async initialize() {
    const currentData = window.Mvu?.stat_data?.floating_plugin;
    if (currentData && currentData.state && currentData.state.initialized) {
      return true;
    }
    
    // 初始化所有数据
    const contacts = initContactsFromInitvar();
    const locations = initLocationsData();
    
    const initialState = {
      contacts,
      locations,
      messages: {},
      settings: {
        autoLoadContacts: true,
        notificationEnabled: true,
        windowPositions: {}
      },
      state: {
        lastActiveWindow: null,
        unreadCount: 0,
        initialized: true
      }
    };
    
    if (window.Mvu?.setMvuVariable) {
      try {
        await window.Mvu.setMvuVariable(
          window.Mvu,
          'floating_plugin',
          initialState,
          { reason: '悬浮球插件：初始化数据' }
        );
        console.log('悬浮球插件数据初始化完成');
        return true;
      } catch (error) {
        console.error('初始化插件数据失败:', error);
        return false;
      }
    }
    
    return false;
  }
};

// 注册到Mvu系统
$(() => {
  registerMvuSchema(Schema);
  
  // 全局暴露API
  window.FloatingVariables = FloatingVariables;
  
  // 自动初始化
  setTimeout(() => {
    FloatingVariables.initialize();
  }, 1000);
  
  console.log('悬浮球插件变量系统已加载');
});