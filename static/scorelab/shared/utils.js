// 通用工具模組
// 提供應用程式中常用的工具函數

// 顯示警告訊息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 自動移除警告
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// 處理檔案上傳
function handleFileUpload() {
    const fileInput = document.getElementById('questionFile');
    const file = fileInput.files[0];
    
    if (file) {
        console.log('選擇的檔案:', file.name);
        // 這裡可以添加檔案驗證邏輯
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showAlert('請選擇CSV檔案', 'warning');
            fileInput.value = '';
            return;
        }
    }
}

// 讀取檔案為 Base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // 移除 data:type;base64, 前綴
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 驗證友善表單
function validateFriendlyForm() {
    const configName = document.getElementById('configName').value;
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const requestBody = document.getElementById('requestBody').value;
    
    if (!configName.trim()) {
        showAlert('請輸入配置名稱', 'warning');
        return false;
    }
    
    // 檢查配置名稱是否包含無效字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(configName)) {
        showAlert('配置名稱不能包含以下字符: < > : " / \\ | ? *', 'warning');
        return false;
    }
    
    // 驗證 HTTP Request 配置
    if (!httpPath.trim()) {
        showAlert('請輸入 HTTP 路徑', 'warning');
        return false;
    }
    
    if (!httpHost.trim()) {
        showAlert('請輸入 Host', 'warning');
        return false;
    }
    
    if (!httpContentType.trim()) {
        showAlert('請輸入 Content-Type', 'warning');
        return false;
    }
    
    if (!requestBody.trim()) {
        showAlert('請輸入 Request Body', 'warning');
        return false;
    }
    

    
    // 驗證評分標準
    const enableJavascript = document.getElementById('enableJavascript').checked;
    const enableGEval = document.getElementById('enableGEval').checked;
    
    if (!enableJavascript && !enableGEval) {
        showAlert('請至少添加一個評分標準', 'warning');
        return false;
    }
    
    // 驗證 JavaScript 評分配置
    if (enableJavascript) {
        const javascriptCondition = document.getElementById('javascriptCondition').value;
        if (javascriptCondition === 'length') {
            const minLength = document.getElementById('minLength').value;
            if (!minLength || minLength < 1) {
                showAlert('請輸入有效的最小長度', 'warning');
                return false;
            }
        } else if (javascriptCondition === 'custom') {
            const customJavascript = document.getElementById('customJavascript').value;
            if (!customJavascript.trim()) {
                showAlert('請輸入自定義表達式', 'warning');
                return false;
            }
        }
    }
    
    // 驗證 G-Eval 評分配置
    if (enableGEval) {
        const llmProvider = document.getElementById('llmProvider').value;
        if (!llmProvider) {
            showAlert('請選擇 LLM 提供者', 'warning');
            return false;
        }
        
        // 檢查是否有評分標準
        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
        let hasValidCriteria = false;
        
        for (let input of criteriaInputs) {
            if (input.value.trim()) {
                hasValidCriteria = true;
                break;
            }
        }
        
        if (!hasValidCriteria) {
            showAlert('請確保評分標準配置正確', 'warning');
            return false;
        }
    }
    
    return true;
}

// 匯出工具函數供其他模組使用
window.Utils = {
    showAlert,
    handleFileUpload,
    readFileAsBase64,
    validateFriendlyForm
};
