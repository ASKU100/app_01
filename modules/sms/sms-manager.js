class SMSManager {
    constructor() {
        this.smsRecords = [];
        this.contacts = [];
        this.initialize();
    }

    async initialize() {
        // 监听ST事件
        this.setupEventListeners();
        // 加载短信记录
        await this.loadSMSFromVariables();
        // 初始化联系人
        await this.loadContacts();
    }

    async loadContacts() {
        // 从MVU变量自动读取角色数据
        const variables = await this.getVariables();
        const roles = variables?.角色 || {};
        
        this.contacts = Object.entries(roles).map(([name, data]) => ({
            id: name,
            name: name,
            avatar: '👤', // 可根据角色数据自定义
            phone: this.generatePhoneNumber(name),
            status: '在线'
        }));
        
        // 更新UI
        this.updateContactList();
    }

    async sendSMS(receiver, content) {
        const sms = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            sender: 'user',
            receiver: receiver,
            content: content,
            read: false,
            replied: false,
            hidden: true // 标记为隐藏消息
        };

        // 保存到变量系统
        await this.saveSMSToVariables(sms);
        
        // 触发AI回复
        await this.triggerAIResponse(sms);
        
        // 更新UI
        this.updateSMSDisplay();
    }

    async triggerAIResponse(sms) {
        // 使用SillyTavern的事件系统触发AI回复
        const eventData = {
            type: 'SMS_TRIGGER',
            sms: sms,
            timestamp: Date.now()
        };

        // 发送到ST主线程
        window.parent.postMessage({
            type: 'SEND_SMS_TO_AI',
            data: eventData
        }, '*');
    }

    async processAIResponse(response) {
        // 解析AI回复并保存
        const replySMS = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            sender: 'AI', // 实际为发送角色
            receiver: 'user',
            content: response.content,
            read: false,
            isReply: true
        };

        await this.saveSMSToVariables(replySMS);
        this.updateSMSDisplay();
        this.updateBadgeCount();
    }

    // MVU变量操作
    async getVariables() {
        return new Promise((resolve) => {
            window.parent.postMessage({
                type: 'GET_MVU_VARIABLES'
            }, '*');
            
            window.addEventListener('message', (event) => {
                if (event.data.type === 'MVU_VARIABLES_RESPONSE') {
                    resolve(event.data.variables);
                }
            });
        });
    }

    async saveSMSToVariables(sms) {
        window.parent.postMessage({
            type: 'UPDATE_MVU_VARIABLES',
            path: '短信记录',
            operation: 'add',
            value: sms
        }, '*');
    }

    // UI更新
    updateSMSDisplay() {
        const smsList = document.getElementById('smsMessages');
        smsList.innerHTML = this.smsRecords.map(sms => this.renderSMS(sms)).join('');
    }

    renderSMS(sms) {
        return `
            <div class="sms-message ${sms.sender} ${sms.hidden ? 'hidden-sms' : ''}">
                <div class="sms-meta">
                    <span class="sender">${sms.sender === 'user' ? '我' : sms.sender}</span>
                    <span class="time">${this.formatTime(sms.timestamp)}</span>
                </div>
                <div class="sms-content">${sms.content}</div>
                ${sms.isReply ? '<div class="sms-reply-indicator">💌 已回复</div>' : ''}
            </div>
        `;
    }
}
