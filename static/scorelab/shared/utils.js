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
        showAlert('請輸入專案名稱', 'warning');
        return false;
    }
    
    // 檢查專案名稱是否包含無效字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(configName)) {
        showAlert('專案名稱不能包含以下字符: < > : " / \\ | ? *', 'warning');
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
    

    
    // 驗證評分標準（可選）
    const enableJavascriptElement = document.getElementById('enableJavascript');
    const enableGEvalElement = document.getElementById('enableGEval');
    
    const enableJavascript = enableJavascriptElement ? enableJavascriptElement.checked : false;
    const enableGEval = enableGEvalElement ? enableGEvalElement.checked : false;
    
    // 評分標準為可選項，不強制要求
    // if (!enableJavascript && !enableGEval) {
    //     showAlert('請至少添加一個評分標準', 'warning');
    //     return false;
    // }
    
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

// 即時表單驗證
function setupLiveValidation() {
    // 專案名稱驗證
    const configName = document.getElementById('configName');
    if (configName) {
        configName.addEventListener('blur', function() {
            validateField(this, (value) => {
                if (!value.trim()) {
                    return { valid: false, message: '專案名稱不能為空' };
                }
                const invalidChars = /[<>:"/\\|?*]/;
                if (invalidChars.test(value)) {
                    return { valid: false, message: '不能包含特殊字符: < > : " / \\ | ? *' };
                }
                return { valid: true };
            });
        });
        
        // 輸入時移除錯誤狀態
        configName.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
                const feedback = this.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.remove();
            }
        });
    }
    
    // HTTP Host 驗證
    const httpHost = document.getElementById('httpHost');
    if (httpHost) {
        httpHost.addEventListener('blur', function() {
            validateField(this, (value) => {
                if (!value.trim()) {
                    return { valid: false, message: 'Host 不能為空' };
                }
                return { valid: true };
            });
        });
        
        httpHost.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
                const feedback = this.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.remove();
            }
        });
    }
    
    // HTTP Path 驗證
    const httpPath = document.getElementById('httpPath');
    if (httpPath) {
        httpPath.addEventListener('blur', function() {
            validateField(this, (value) => {
                if (!value.trim()) {
                    return { valid: false, message: 'HTTP 路徑不能為空' };
                }
                return { valid: true };
            });
        });
        
        httpPath.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
                const feedback = this.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.remove();
            }
        });
    }
    
    // Request Body 驗證
    const requestBody = document.getElementById('requestBody');
    if (requestBody) {
        requestBody.addEventListener('blur', function() {
            validateField(this, (value) => {
                if (!value.trim()) {
                    return { valid: false, message: 'Request Body 不能為空' };
                }
                // 檢查是否為有效的 JSON
                try {
                    JSON.parse(value);
                    return { valid: true };
                } catch (e) {
                    return { valid: false, message: 'Request Body 必須是有效的 JSON 格式' };
                }
            });
        });
        
        requestBody.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
                const feedback = this.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.remove();
            }
        });
    }
}

// 驗證單個欄位
function validateField(field, validator) {
    const result = validator(field.value);
    
    // 移除之前的驗證狀態
    field.classList.remove('is-valid', 'is-invalid');
    const oldFeedback = field.parentElement.querySelector('.invalid-feedback, .valid-feedback');
    if (oldFeedback) oldFeedback.remove();
    
    if (result.valid) {
        field.classList.add('is-valid');
    } else {
        field.classList.add('is-invalid');
        if (result.message) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = result.message;
            field.parentElement.appendChild(feedback);
        }
    }
    
    return result.valid;
}

// 匯出工具函數供其他模組使用
window.Utils = {
    showAlert,
    handleFileUpload,
    readFileAsBase64,
    validateFriendlyForm,
    setupLiveValidation,
    validateField
};
