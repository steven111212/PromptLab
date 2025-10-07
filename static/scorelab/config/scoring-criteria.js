// 評分標準配置模組
// 負責評分標準相關的配置和UI交互

// 更新 LLM 提供者配置
function updateLLMProviderConfig() {
    const provider = document.getElementById('llmProvider').value;
    const configArea = document.getElementById('llmProviderConfigArea');
    
    if (!provider) {
        configArea.innerHTML = '';
        return;
    }
    
    let configHTML = '';
    
    switch (provider) {
        case 'openai':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">OpenAI API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="openaiApiKey" placeholder="sk-..." required>
                    <small class="form-text text-muted">請輸入您的 OpenAI API Key</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">選擇模型 *</label>
                    <select class="form-select form-select-sm" id="openaiModel" required>
                        <option value="">請選擇模型</option>
                        <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-5">GPT-5</option>
                    </select>
                </div>
            `;
            break;
            
        case 'anthropic':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">Anthropic API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="anthropicApiKey" placeholder="sk-ant-..." required>
                    <small class="form-text text-muted">請輸入您的 Anthropic API Key</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">選擇模型 *</label>
                    <select class="form-select form-select-sm" id="anthropicModel" required>
                        <option value="">請選擇模型</option>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    </select>
                </div>
            `;
            break;
            
        case 'azure-openai':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">Azure OpenAI API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="azureApiKey" placeholder="Azure API Key" required>
                </div>
                <div class="mb-3">
                    <label class="form-label small">Azure OpenAI Endpoint *</label>
                    <input type="url" class="form-control form-control-sm" id="azureEndpoint" placeholder="https://your-resource.openai.azure.com/" required>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Version *</label>
                    <input type="text" class="form-control form-control-sm" id="azureApiVersion" placeholder="2024-02-15-preview" required>
                </div>
                <div class="mb-3">
                    <label class="form-label small">Deployment Name *</label>
                    <input type="text" class="form-control form-control-sm" id="azureDeployment" placeholder="gpt-4" required>
                </div>
            `;
            break;
            
        case 'google':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">Google API Key *</label>
                    <input type="password" class="form-control form-control-sm" id="googleApiKey" placeholder="AIza..." required>
                    <small class="form-text text-muted">請輸入您的 Google API Key</small>
                </div>
                <div class="mb-3">
                    <label class="form-label small">選擇模型 *</label>
                    <select class="form-select form-select-sm" id="googleModel" required>
                        <option value="">請選擇模型</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>
                </div>
            `;
            break;
            
        case 'custom':
            configHTML = `
                <div class="mb-3">
                    <label class="form-label small">API Endpoint *</label>
                    <input type="url" class="form-control form-control-sm" id="customEndpoint" placeholder="https://api.example.com/v1/chat/completions" required>
                </div>
                <div class="mb-3">
                    <label class="form-label small">API Key</label>
                    <input type="password" class="form-control form-control-sm" id="customApiKey" placeholder="API Key (可選)">
                </div>
                <div class="mb-3">
                    <label class="form-label small">模型名稱</label>
                    <input type="text" class="form-control form-control-sm" id="customModel" placeholder="模型名稱 (可選)">
                </div>
            `;
            break;
    }
    
    configArea.innerHTML = configHTML;
}

// 切換 JavaScript 配置顯示
function toggleJavascriptConfig() {
    const checkbox = document.getElementById('enableJavascript');
    const config = document.getElementById('javascriptConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 切換 G-Eval 配置顯示
function toggleGEvalConfig() {
    const checkbox = document.getElementById('enableGEval');
    const config = document.getElementById('gevalConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 更新 JavaScript 條件配置
function updateJavascriptCondition() {
    const condition = document.getElementById('javascriptCondition').value;
    const lengthConfig = document.getElementById('lengthConfig');
    const customConfig = document.getElementById('customConfig');
    
    if (condition === 'length') {
        lengthConfig.style.display = 'block';
        customConfig.style.display = 'none';
    } else if (condition === 'custom') {
        lengthConfig.style.display = 'none';
        customConfig.style.display = 'block';
    }
}

// 更新評分模型配置
function updateGradingModelFields() {
    const modelType = document.getElementById('gradingModelType');
    const openaiConfig = document.getElementById('openaiConfig');
    const httpConfig = document.getElementById('httpGradingConfig');
    
    if (!modelType) return; // 如果元素不存在，直接返回
    
    const modelTypeValue = modelType.value;
    if (modelTypeValue === 'openai') {
        if (openaiConfig) openaiConfig.style.display = 'block';
        if (httpConfig) httpConfig.style.display = 'none';
    } else if (modelTypeValue === 'http') {
        if (openaiConfig) openaiConfig.style.display = 'none';
        if (httpConfig) httpConfig.style.display = 'block';
    }
}

// 添加 G-Eval 評分標準
function addGEvalCriteria() {
    const list = document.getElementById('gevalCriteriaList');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control">
        <button type="button" class="btn btn-outline-danger" onclick="ScoringCriteria.removeGEvalCriteria(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(div);
}

// 移除 G-Eval 評分標準
function removeGEvalCriteria(button) {
    button.parentElement.remove();
}

// 匯出評分標準相關的函數供其他模組使用
window.ScoringCriteria = {
    updateLLMProviderConfig,
    toggleJavascriptConfig,
    toggleGEvalConfig,
    updateJavascriptCondition,
    updateGradingModelFields,
    addGEvalCriteria,
    removeGEvalCriteria
};
