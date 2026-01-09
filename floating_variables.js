// floating_variables.js - 修复版本
// 避免使用可能导致冲突的变量名和函数

(function() {
    console.log('悬浮球插件变量系统开始加载...');
    
    // 避免全局污染，使用独立命名空间
    const FloatingVars = {
        // 初始化数据
        data: {
            contacts: [],
            messages: {},
            locations: [],
            settings: {},
            initialized: false
        },
        
        // 尝试从现有变量系统读取数据
        tryLoadFromMvu() {
            try {
                // 通过更安全的方式访问变量系统
                if (typeof window !== 'undefined') {
                    // 方法1：尝试通过事件监听获取数据
                    const mvuData = window.Mvu?.stat_data;
                    if (mvuData) {
                        console.log('从Mvu系统找到数据');
                        
                        // 尝试从[initvar]初始化联系人
                        this.initContactsFromInitvar(mvuData);
                        
                        // 加载地图数据
                        this.initLocationsData();
                        
                        this.data.initialized = true;
                        return true;
                    }
                }
            } catch (error) {
                console.warn('从Mvu加载数据失败:', error);
            }
            return false;
        },
        
        // 从initvar初始化联系人
        initContactsFromInitvar(mvuData) {
            try {
                const contacts = [];
                
                // 方法1：从角色变量提取
                if (mvuData.角色) {
                    Object.keys(mvuData.角色).forEach(roleName => {
                        if (roleName && roleName !== '待初始化') {
                            contacts.push({
                                name: roleName,
                                phone: this.generateJapanesePhoneNumber(),
                                avatar: this.getInitials(roleName),
                                lastContact: null,
                                notes: `角色变量`
                            });
                        }
                    });
                }
                
                // 方法2：从已知角色列表添加
                const knownRoles = [
                    '西园寺爱丽莎', '月咏深雪', '犬冢夏美', '阿宅君'
                ];
                
                knownRoles.forEach(roleName => {
                    if (!contacts.some(c => c.name === roleName)) {
                        contacts.push({
                            name: roleName,
                            phone: this.generateJapanesePhoneNumber(),
                            avatar: this.getInitials(roleName),
                            lastContact: null,
                            notes: `预设角色`
                        });
                    }
                });
                
                this.data.contacts = contacts;
                console.log(`从initvar初始化了 ${contacts.length} 个联系人`);
                
            } catch (error) {
                console.error('初始化联系人失败:', error);
                this.data.contacts = this.getDefaultContacts();
            }
        },
        
        // 获取默认联系人
        getDefaultContacts() {
            return [
                {
                    name: '西园寺爱丽莎',
                    phone: '090-1234-5678',
                    avatar: 'SA',
                    lastContact: null,
                    notes: '西园寺财团千金'
                },
                {
                    name: '月咏深雪',
                    phone: '090-2345-6789',
                    avatar: 'YS',
                    lastContact: null,
                    notes: '班级委员长'
                },
                {
                    name: '犬冢夏美',
                    phone: '090-3456-7890',
                    avatar: 'KS',
                    lastContact: null,
                    notes: '田径部王牌'
                },
                {
                    name: '阿宅君',
                    phone: '090-4567-8901',
                    avatar: 'AK',
                    lastContact: null,
                    notes: '爱丽莎的青梅竹马'
                }
            ];
        },
        
        // 初始化地图数据
        initLocationsData() {
            this.data.locations = [
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
        },
        
        // 生成日本手机号码
        generateJapanesePhoneNumber() {
            const prefix = ['080', '090', '070'];
            const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
            const numbers = Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join('');
            return `${randomPrefix}-${numbers.substring(0, 4)}-${numbers.substring(4)}`;
        },
        
        // 获取姓名首字母
        getInitials(name) {
            if (!name) return '?';
            // 尝试提取中文字符
            const chineseChars = name.match(/[\u4e00-\u9fa5]/g);
            if (chineseChars && chineseChars.length >= 2) {
                return chineseChars[0] + chineseChars[chineseChars.length - 1];
            }
            return name.substring(0, 2).toUpperCase();
        },
        
        // 公共API
        getContacts() {
            if (!this.data.initialized) {
                this.tryLoadFromMvu();
            }
            return this.data.contacts;
        },
        
        getLocations() {
            if (this.data.locations.length === 0) {
                this.initLocationsData();
            }
            return this.data.locations;
        },
        
        getMessages(contactName) {
            return this.data.messages[contactName] || [];
        },
        
        addMessage(contactName, message) {
            if (!this.data.messages[contactName]) {
                this.data.messages[contactName] = [];
            }
            this.data.messages[contactName].push(message);
        },
        
        // 初始化
        init() {
            console.log('悬浮球插件变量系统初始化...');
            this.tryLoadFromMvu();
            
            // 全局暴露（使用安全的方式）
            if (typeof window !== 'undefined') {
                // 使用不常见的变量名避免冲突
                window.FloatingVars = this;
                window.FB_Variables = this; // 备用名称
            }
            
            console.log('悬浮球插件变量系统初始化完成');
            return true;
        }
    };
    
    // 延迟初始化，确保DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            FloatingVars.init();
        });
    } else {
        FloatingVars.init();
    }
    
})();
