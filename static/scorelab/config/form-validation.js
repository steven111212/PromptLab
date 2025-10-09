// 表單驗證和專案生成模組
// 負責表單驗證、專案生成和保存功能

// 創建/更新專案
async function saveProject() {
    try {
        // 獲取專案名稱
        const configName = document.getElementById('configName').value;
        if (!configName.trim()) {
            showAlert('請輸入專案名稱', 'error');
            return;
        }
        
        // 生成專案設定內容
        const configContent = generateConfigFromForm();
        
        // 檢查是否有上傳的檔案
        let uploadedFile = null;
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const file = csvFileInput.files[0];
            const fileContent = await readFileAsBase64(file);
            uploadedFile = {
                filename: file.name,
                content: fileContent
            };
        }
        
        // 判斷是創建新專案還是更新現有專案
        const isEdit = ConfigManager.selectedConfig() && ConfigManager.selectedConfig().id;
        const url = isEdit ? `/api/configs/${ConfigManager.selectedConfig().id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: configName,
                content: configContent,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '專案儲存成功！' : '專案創建成功！', 'success');
            // 刷新專案列表
            ConfigManager.loadConfigs();
            
            if (isEdit) {
                // 編輯模式，重新載入專案詳情
                await ConfigManager.selectConfig(ConfigManager.selectedConfig().id);
            } else {
                // 新增模式，關閉表單
                cancelConfigForm();
            }
        } else {
            showAlert(`專案${isEdit ? '儲存' : '創建'}失敗: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error(`專案${ConfigManager.selectedConfig() && ConfigManager.selectedConfig().id ? '儲存' : '創建'}時發生錯誤:`, error);
        showAlert(`專案${ConfigManager.selectedConfig() && ConfigManager.selectedConfig().id ? '儲存' : '創建'}失敗: ` + error.message, 'error');
    }
}

// 創建/更新專案表單
async function saveConfigForm() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的專案內容:', config);
        console.log('專案名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新專案還是更新現有專案
        const isEdit = ConfigManager.selectedConfig() && ConfigManager.selectedConfig().id;
        const url = isEdit ? `/api/configs/${ConfigManager.selectedConfig().id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '專案儲存成功' : '專案創建成功', 'success');
            await ConfigManager.loadConfigs();
            
            // 如果是編輯模式，顯示更新後的專案詳情
            if (isEdit) {
                await ConfigManager.selectConfig(ConfigManager.selectedConfig().id);
            } else {
                // 新增模式，關閉表單
                hideConfigForm();
            }
        } else {
            showAlert((isEdit ? '儲存' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('專案操作失敗:', error);
        showAlert('專案操作失敗', 'danger');
    }
}

// 保存友善專案（保留用於模態框）
async function saveFriendlyConfig() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的專案內容:', config);
        console.log('專案名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新專案還是更新現有專案
        const isEdit = ConfigManager.selectedConfig() && ConfigManager.selectedConfig().id;
        const url = isEdit ? `/api/configs/${ConfigManager.selectedConfig().id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '專案儲存成功' : '專案創建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('friendlyConfigModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('configPreviewModal')).hide();
            await ConfigManager.loadConfigs();
            // 清除選中的專案
            ConfigManager.selectedConfig() = null;
        } else {
            showAlert((isEdit ? '儲存' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('創建專案失敗:', error);
        showAlert('創建專案失敗', 'danger');
    }
}

// 從表單生成專案
function generateConfigFromForm() {
    const configName = document.getElementById('configName').value;
    
    // 獲取被測API專案
    const useHttps = document.getElementById('useHttps').checked;
    const httpMethod = document.getElementById('httpMethod').value;
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const authType = document.getElementById('authType').value;
    const authValue = document.getElementById('authValue').value;
    const transformResponse = document.getElementById('transformResponse').value;
    
    // 獲取 Request Body（直接使用原始文本）
    const requestBody = document.getElementById('requestBody').value;
    
    // 獲取測試問題專案
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSource = questionSourceRadio ? questionSourceRadio.value : 'upload';
    let testsConfig = '';
    
    if (questionSource === 'upload') {
        // 檔案上傳模式：生成 tests 專案
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const questionFile = csvFileInput.files[0];
            testsConfig = `  - file://${questionFile.name}`;
        }
    }
    
    // 生成Providers專案（格式一）
    let providersConfig = '';
    
    if (httpPath && httpHost && httpContentType && requestBody) {
        providersConfig = `providers:
  - id: http
    config:`;
        
        // 添加 useHttps 專案
        if (useHttps) {
            providersConfig += `\n      useHttps: true`;
        }
        
        // 添加 HTTP 方法專案
        if (httpMethod && httpMethod !== 'POST') {
            providersConfig += `\n      method: ${httpMethod}`;
        }
        
        // 添加路徑專案
        providersConfig += `\n      path: "${httpPath}"`;
        
        // 添加 Host 專案
        providersConfig += `\n      host: "${httpHost}"`;
        
        // 添加 Content-Type 專案
        if (httpContentType) {
            providersConfig += `\n      headers:
        Content-Type: "${httpContentType}"`;
        }
        
        // 添加認證專案
        if (authType && authValue) {
            switch (authType) {
                case 'bearer':
                    providersConfig += `\n        Authorization: "Bearer ${authValue}"`;
                    break;
                case 'basic':
                    providersConfig += `\n        Authorization: "Basic ${btoa(authValue)}"`;
                    break;
                case 'apikey':
                    providersConfig += `\n        Authorization: "Bearer ${authValue}"`;
                    break;
                case 'custom':
                    providersConfig += `\n        Authorization: "${authValue}"`;
                    break;
            }
        }
        
        // 添加 Request Body 專案
        providersConfig += `\n      body: |
${requestBody.split('\n').map(line => `        ${line}`).join('\n')}`;
        
        // 添加 Transform Response 專案
        if (transformResponse) {
            providersConfig += `\n      transformResponse: ${transformResponse}`;
        }
    }
    
    // 生成評分標準專案
    let assertionsConfig = '';
    const enableJavascript = document.getElementById('enableJavascript').checked;
    const enableGEval = document.getElementById('enableGEval').checked;
    
    if (enableJavascript || enableGEval) {
        assertionsConfig = 'assertions:';
        
        // JavaScript 評分標準
        if (enableJavascript) {
            const javascriptCondition = document.getElementById('javascriptCondition').value;
            let javascriptExpression = '';
            
            if (javascriptCondition === 'length') {
                const minLength = document.getElementById('minLength').value;
                javascriptExpression = `output.length >= ${minLength}`;
            } else if (javascriptCondition === 'custom') {
                javascriptExpression = document.getElementById('customJavascript').value;
            }
            
            if (javascriptExpression) {
                assertionsConfig += `
  - type: javascript
    value: "${javascriptExpression}"`;
            }
        }
        
        // G-Eval 評分標準
        if (enableGEval) {
            const criteriaList = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
            criteriaList.forEach(input => {
                if (input.value.trim()) {
                    assertionsConfig += `
  - type: llm-rubric
    value: "${input.value.trim()}"`;
                }
            });
        }
    }
    
    // 生成完整的 YAML 專案
    let yamlConfig = `description: ${configName}

${providersConfig}

${testsConfig}

${assertionsConfig}`;
    
    console.log('最終生成的專案:', yamlConfig);
    return yamlConfig;
}

// 生成 LLM Grader 提供者專案
function generateGraderProviderConfig(provider) {
    if (!provider) return null;
    
    let providerConfig = '';
    
    switch (provider) {
        case 'openai':
            const openaiModelElement = document.getElementById('openaiModel');
            const openaiApiKeyElement = document.getElementById('openaiApiKey');
            const openaiModel = openaiModelElement ? openaiModelElement.value : '';
            const openaiApiKey = openaiApiKeyElement ? openaiApiKeyElement.value : '';
            
            providerConfig = `    provider:
      id: openai:${openaiModel}
      config:
        apiKey: "${openaiApiKey || 'sk-abc123'}"`;
            break;
            
        case 'anthropic':
            const anthropicModelElement = document.getElementById('anthropicModel');
            const anthropicApiKeyElement = document.getElementById('anthropicApiKey');
            const anthropicModel = anthropicModelElement ? anthropicModelElement.value : '';
            const anthropicApiKey = anthropicApiKeyElement ? anthropicApiKeyElement.value : '';
            
            providerConfig = `    provider:
      id: anthropic:${anthropicModel}
      config:
        apiKey: "${anthropicApiKey || 'sk-ant-abc123'}"`;
            break;
            
        case 'azure-openai':
            const azureEndpointElement = document.getElementById('azureEndpoint');
            const azureApiKeyElement = document.getElementById('azureApiKey');
            const azureModelElement = document.getElementById('azureModel');
            const azureEndpoint = azureEndpointElement ? azureEndpointElement.value : '';
            const azureApiKey = azureApiKeyElement ? azureApiKeyElement.value : '';
            const azureModel = azureModelElement ? azureModelElement.value : '';
            
            providerConfig = `    provider:
      id: azure:chat:${azureModel}
      config:
        apiKey: "${azureApiKey || 'your-api-key'}"
        apiHost: "${azureEndpoint || 'https://your-resource.openai.azure.com'}"`;
            break;
            
        case 'google':
            const googleModelElement = document.getElementById('googleModel');
            const googleApiKeyElement = document.getElementById('googleApiKey');
            const googleModel = googleModelElement ? googleModelElement.value : '';
            const googleApiKey = googleApiKeyElement ? googleApiKeyElement.value : '';
            
            providerConfig = `    provider:
      id: google:${googleModel}
      config:
        apiKey: "${googleApiKey || 'your-google-api-key'}"`;
            break;
            
        case 'custom':
            const customEndpointElement = document.getElementById('customEndpoint');
            const customApiKeyElement = document.getElementById('customApiKey');
            const customModelElement = document.getElementById('customModel');
            const customEndpoint = customEndpointElement ? customEndpointElement.value : '';
            const customApiKey = customApiKeyElement ? customApiKeyElement.value : '';
            const customModel = customModelElement ? customModelElement.value : '';
            
            providerConfig = `    provider:
      id: http
      config:
        url: "${customEndpoint || 'https://api.example.com/v1/chat/completions'}"
        method: POST
        headers:
          Content-Type: application/json
          ${customApiKey ? `Authorization: "Bearer ${customApiKey}"` : ''}
        body:
          model: "${customModel || 'gpt-4'}"
          messages:
            - role: user
              content: "{{prompt}}"
        transformResponse: json.choices[0].message.content`;
            break;
    }
    
    return providerConfig;
}

// 預覽專案
function previewConfig() {
    const config = generateConfigFromForm();
    const preview = document.getElementById('configPreview');
    preview.textContent = config;
    new bootstrap.Modal(document.getElementById('configPreviewModal')).show();
}

// 重置評分標準列表
function resetScoringCriteriaList() {
    // 重置 API 專案（安全檢查避免null錯誤）
    const httpPath = document.getElementById('httpPath');
    const httpHost = document.getElementById('httpHost');
    const httpContentType = document.getElementById('httpContentType');
    const requestBody = document.getElementById('requestBody');
    const transformResponse = document.getElementById('transformResponse');
    
    if (httpPath) httpPath.value = '';
    if (httpHost) httpHost.value = '';
    if (httpContentType) httpContentType.value = 'application/json';
    if (requestBody) requestBody.value = '';
    if (transformResponse) transformResponse.value = 'json.response';
    
    // 重置問題輸入方式（安全檢查）
    const questionSourceUpload = document.getElementById('questionSourceUpload');
    const csvFile = document.getElementById('csvFile');
    
    if (questionSourceUpload) questionSourceUpload.checked = true;
    if (csvFile) csvFile.value = '';
    
    try {
        toggleQuestionInput();
    } catch (e) {
        console.log('toggleQuestionInput 函數調用失敗:', e);
    }
    
    // 重置 JavaScript 專案（安全檢查）
    const enableJavascript = document.getElementById('enableJavascript');
    const javascriptConfig = document.getElementById('javascriptConfig');
    const javascriptCondition = document.getElementById('javascriptCondition');
    const minLength = document.getElementById('minLength');
    const customJavascript = document.getElementById('customJavascript');
    
    if (enableJavascript) enableJavascript.checked = false;
    if (javascriptConfig) javascriptConfig.style.display = 'none';
    if (javascriptCondition) javascriptCondition.value = 'length';
    if (minLength) minLength.value = '100';
    if (customJavascript) customJavascript.value = '';
    updateJavascriptCondition();
    
    // 重置 G-Eval 專案
    const enableGEval = document.getElementById('enableGEval');
    const gevalConfig = document.getElementById('gevalConfig');
    const openaiModel = document.getElementById('openaiModel');
    
    if (enableGEval) enableGEval.checked = false;
    if (gevalConfig) gevalConfig.style.display = 'none';
    if (openaiModel) openaiModel.value = 'gpt-4o-mini';
    updateGradingModelFields();
    
    // 重置 G-Eval 評分標準列表
    const gevalCriteriaList = document.getElementById('gevalCriteriaList');
    gevalCriteriaList.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control">
            <button type="button" class="btn btn-outline-danger" onclick="ScoringCriteria.removeGEvalCriteria(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// 匯出表單驗證相關的函數供其他模組使用
window.FormValidation = {
    saveProject,
    saveConfigForm,
    saveFriendlyConfig,
    generateConfigFromForm,
    generateGraderProviderConfig,
    previewConfig,
    resetScoringCriteriaList
};
