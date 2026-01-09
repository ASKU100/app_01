/**
 * 手机功能加载器
 * 简化版本，确保兼容性
 */

(function() {
    'use strict';
    
    // 避免重复加载
    if (window.phoneFunctionsLoaded) {
        return;
    }
    window.phoneFunctionsLoaded = true;
    
    console.log('[手机功能加载器] 开始加载');
    
    // 创建iframe加载手机功能
    function loadPhoneFunctions() {
        const iframe = document.createElement('iframe');
        iframe.id = 'phone-functions-iframe';
        iframe.src = 'https://cdn.jsdelivr.net/gh/ASKU100/app_01@main/phone-base.html';
        iframe.style.cssText = `
            position: fixed;
            width: 1px;
            height: 1px;
            border: none;
            opacity: 0;
            pointer-events: none;
            z-index: -9999;
        `;
        
        document.body.appendChild(iframe);
        
        // 监听iframe加载完成
        iframe.onload = function() {
            console.log('[手机功能] iframe加载完成');
            
            // 从iframe中提取内容并插入到主页面
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const phoneHTML = iframeDoc.body.innerHTML;
                
                // 创建容器
                const container = document.createElement('div');
                container.id = 'phone-functions-container';
                container.innerHTML = phoneHTML;
                
                // 调整样式
                const style = container.querySelector('style');
                if (style) {
                    style.textContent += '\n#phone-functions-container { position: fixed; z-index: 10000; }';
                }
                
                document.body.appendChild(container);
                
                // 移除iframe
                iframe.remove();
                
                console.log('[手机功能] 已加载到页面');
                
                // 初始化事件
                setTimeout(initPhoneEvents, 500);
                
            } catch (error) {
                console.error('[手机功能] 提取内容失败:', error);
                // 显示简化版本
                showSimpleVersion();
            }
        };
        
        iframe.onerror = function() {
            console.error('[手机功能] iframe加载失败');
            showSimpleVersion();
        };
    }
    
    // 显示简化版本（备用）
    function showSimpleVersion() {
        const simpleHTML = `
            <div id="simple-phone" style="position: fixed; bottom: 30px; right: 30px; z-index: 10000;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);" onclick="toggleSimplePhone()">
                    <div style="color: white; font-size: 24px; font-weight: bold;">📱</div>
                </div>
                <div id="simple-phone-panel" style="position: absolute; bottom: 70px; right: 0; width: 300px; background: white; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: none; padding: 20px;">
                    <h4 style="margin-bottom: 15px;">手机功能（简化版）</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button style="padding: 12px; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer;" onclick="showMap()">🗺️ 查看地图</button>
                        <button style="padding: 12px; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer;" onclick="showContacts()">👥 通讯录</button>
                        <button style="padding: 12px; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer;" onclick="showSMS()">💬 短信</button>
                    </div>
                </div>
            </div>
            <script>
                function toggleSimplePhone() {
                    const panel = document.getElementById('simple-phone-panel');
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
                
                function showMap() {
                    alert('地图功能\\n\\n东京整体位置关系\\n西北方向\\n├─ 杉并区\\n│   ├─ 高円寺\\n│   ├─ 阿佐谷\\n│   └─ 荻洼\\n├─ 中野区\\n├─ 新宿区\\n├─ 文京区\\n└─ 港区');
                }
                
                function showContacts() {
                    alert('通讯录功能开发中...');
                }
                
                function showSMS() {
                    alert('短信功能开发中...');
                }
            </script>
        `;
        
        document.body.insertAdjacentHTML('beforeend', simpleHTML);
    }
    
    // 初始化手机事件
    function initPhoneEvents() {
        // 这里可以添加一些全局事件监听
        console.log('[手机功能] 事件初始化');
    }
    
    // 等待jQuery和MVU
    function waitForDependencies() {
        const maxWait = 10000; // 10秒超时
        const startTime = Date.now();
        
        function check() {
            // 检查jQuery是否可用
            if (typeof jQuery === 'undefined') {
                if (Date.now() - startTime < maxWait) {
                    setTimeout(check, 100);
                    return;
                } else {
                    console.warn('[手机功能] jQuery未加载，但继续执行');
                }
            }
            
            // 加载手机功能
            loadPhoneFunctions();
        }
        
        check();
    }
    
    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
    
})();
