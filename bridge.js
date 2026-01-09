// 在ST中运行的桥接脚本
class MobileBridge {
    constructor() {
        this.setupMessageHandlers();
        this.injectSMSProcessing();
    }

    setupMessageHandlers() {
        // 处理来自手机前端的消息
        window.addEventListener('message', (event) => {
            if (event.source !== this.getMobileIframe()) return;

            switch (event.data.type) {
                case 'SEND_SMS_TO_AI':
                    this.handleSMSForAI(event.data.data);
                    break;
                case 'GET_MVU_VARIABLES':
                    this.sendVariablesToMobile(event);
                    break;
                case 'UPDATE_MVU_VARIABLES':
                    this.updateVariables(event.data);
                    break;
            }
        });
    }

    async handleSMSForAI(smsData) {
        // 1. 注入短信提示词
        await this.injectSMSPrompt(smsData);
        
        // 2. 触发AI生成回复
        await this.triggerAIGeneration();
        
        // 3. 监听回复并处理
        this.setupReplyListener();
    }

    async injectSMSPrompt(smsData) {
        // 使用ST的事件系统注入提示词
        const prompt = `
用户发送了短信给${smsData.receiver}：
内容："${smsData.content}"

请以${smsData.receiver}的身份回复这条短信。
你的回复将作为短信发送给用户。

[短信回复开始]
（在这里写下你的短信回复）
[短信回复结束]

注意：你的常规对话回复和短信回复是分开的。
        `;

        // 注入到当前消息中
        await eventOn(tavern_events.GENERATION_AFTER_COMMANDS, () => {
            injectPrompts([{
                id: 'sms_reply_prompt',
                position: 'in_chat',
                role: 'system',
                content: prompt,
                depth: 1,
                should_scan: false
            }]);
        });
    }

    setupReplyListener() {
        // 监听AI回复，提取短信部分
        eventOn(iframe_events.GENERATION_ENDED, (text, generation_id) => {
            const smsReply = this.extractSMSReply(text);
            if (smsReply) {
                // 发送回手机前端
                this.sendSMSToMobile(smsReply);
                
                // 从消息中移除短信回复标记
                this.cleanSMSFromChat(text, generation_id);
            }
        });
    }

    extractSMSReply(text) {
        const regex = /\[短信回复开始\]([\s\S]*?)\[短信回复结束\]/;
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }

    sendVariablesToMobile(event) {
        // 获取当前MVU变量
        const variables = Mvu?.getMvuData() || {};
        event.source.postMessage({
            type: 'MVU_VARIABLES_RESPONSE',
            variables: variables
        }, event.origin);
    }
}
