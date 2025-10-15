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
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const csvFile = csvFileInput.files[0];
            const fileContent = await readFileAsBase64(csvFile);
            uploadedFile = {
                filename: csvFile.name,
                content: fileContent
            };
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
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const csvFile = csvFileInput.files[0];
            const fileContent = await readFileAsBase64(csvFile);
            uploadedFile = {
                filename: csvFile.name,
                content: fileContent
            };
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
            testsConfig = `tests:\n  - file://${questionFile.name}`;
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
        
        // 使用 request 格式
        providersConfig += `\n      request: |
        ${httpMethod} ${httpPath} HTTP/1.1
        Host: ${httpHost}
        Content-Type: ${httpContentType}`;

        // 添加認證標頭
        if (authType && authValue) {
            switch (authType) {
                case 'bearer':
                    providersConfig += `\n        Authorization: Bearer ${authValue}`;
                    break;
                case 'basic':
                    providersConfig += `\n        Authorization: Basic ${btoa(authValue)}`;
                    break;
                case 'apikey':
                    providersConfig += `\n        Authorization: ${authValue}`;
                    break;
                case 'custom':
                    providersConfig += `\n        Authorization: ${authValue}`;
                    break;
            }
        }
        
        // 添加空行和 Request Body（保持正確的縮排）
        providersConfig += `\n\n`;
        // 嘗試解析並重新格式化 JSON
        try {
            const jsonBody = JSON.parse(requestBody);
            const formattedBody = JSON.stringify(jsonBody, null, 2)
                .split('\n')
                .map(line => `        ${line}`) // 添加基本縮排
                .join('\n');
            providersConfig += formattedBody;
        } catch (e) {
            // 如果不是有效的 JSON，使用原始文本
            const bodyLines = requestBody.split('\n');
            bodyLines.forEach((line, index) => {
                if (index === 0) {
                    providersConfig += `        ${line.trimStart()}`;
                } else {
                    providersConfig += `\n        ${line.trimStart()}`;
                }
            });
        }
        
        // 添加 Transform Response 專案
        if (transformResponse) {
            providersConfig += `\n      transformResponse: ${transformResponse}`;
        }
    }
    
    // 生成評分標準專案
    let defaultTestConfig = '';
    const enableGEval = document.getElementById('enableGEval').checked;
    const enableFactuality = document.getElementById('enableFactuality')?.checked;
    
    console.log('事實性檢查狀態:', enableFactuality);
    console.log('事實性檢查元素:', document.getElementById('enableFactuality'));
    
    // 檢查是否需要 defaultTest
    if (enableGEval || enableFactuality) {
        defaultTestConfig = 'defaultTest:';
        
        // 如果有 G-Eval 或事實性檢查，需要添加 provider
        if (enableGEval || enableFactuality) {
            const llmProvider = document.getElementById('llmProvider')?.value;
            if (llmProvider) {
                const graderProviderConfig = generateGraderProviderConfig(llmProvider);
                if (graderProviderConfig) {
                    defaultTestConfig += `\n  options:\n${graderProviderConfig}`;
                }
            }
        }
        
        // 添加 assert
        defaultTestConfig += '\n  assert:';
        
        // 事實性檢查評分標準
        if (enableFactuality) {
            const factualityVariable = document.getElementById('factualityVariable');
            console.log('事實性檢查變數元素:', factualityVariable);
            console.log('事實性檢查變數值:', factualityVariable?.value);
            if (factualityVariable && factualityVariable.value) {
                defaultTestConfig += `
    - type: factuality
      value: "${factualityVariable.value}"`;
                console.log('已添加事實性檢查到配置');
            } else {
                console.log('事實性檢查變數為空或不存在');
            }
        }
        
        
        // G-Eval 評分標準
        if (enableGEval) {
            const criteriaList = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
            criteriaList.forEach(input => {
                if (input.value.trim()) {
                    const criteria = input.value.trim();
                    // 自動添加中文回覆要求
                    const fullCriteria = `${criteria}，用繁體中文回答你的評分原因。`;
                    defaultTestConfig += `
    - type: g-eval
      value: "${fullCriteria}"`;
                }
            });
        }
        
        // BERT Score 評分標準
        const enableBertScore = document.getElementById('enableBertScore')?.checked;
        if (enableBertScore) {
            defaultTestConfig += `
    - type: python
      value: file://../../assert/bert_scoring.py:get_assert_bert_f1
    - type: python
      value: file://../../assert/bert_scoring.py:get_assert_bert_recall
    - type: python
      value: file://../../assert/bert_scoring.py:get_assert_bert_precision`;
        }
        
        // IContains 評分標準
        const enableIContains = document.getElementById('enableIContains')?.checked;
        if (enableIContains) {
            const icontainsValue = document.getElementById('icontainsValue')?.value;
            if (icontainsValue && icontainsValue.trim()) {
                defaultTestConfig += `
    - type: icontains
      value: "${icontainsValue.trim()}"`;
            }
        }
        
        // ROUGE-N 評分標準
        const enableRougeN = document.getElementById('enableRougeN')?.checked;
        if (enableRougeN) {
            const factualityVariable = document.getElementById('factualityVariable')?.value;
            const rougeNThreshold = document.getElementById('rougeNThreshold')?.value || '0.6';
            if (factualityVariable && factualityVariable.trim()) {
                defaultTestConfig += `
    - type: rouge-n
      threshold: ${parseFloat(rougeNThreshold)}
      value: "${factualityVariable.trim()}"`;
            }
        }
    }
    
    // 獲取選擇的問題變數
    const promptVariable = document.getElementById('promptVariable');
    const selectedPromptVariable = promptVariable ? promptVariable.value : '';
    
    // 生成完整的 YAML 專案
    const promptValue = selectedPromptVariable ? `{{${selectedPromptVariable}}}` : 'dummy';
    let yamlConfig = `description: ${configName}\n\nprompts: "${promptValue}"`;
    
    if (providersConfig) {
        yamlConfig += `\n\n${providersConfig}`;
    }
    
    // 檢查CSV檔案配置
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput && csvFileInput.files.length > 0) {
        // 如果有新上傳的檔案，使用新檔案
        const csvFile = csvFileInput.files[0];
        yamlConfig += `\n\ntests:\n  - file://${csvFile.name}`;
    } else if (ConfigManager.selectedConfig()) {
        // 如果是編輯模式且沒有新上傳的檔案，保留原本的tests配置
        const originalContent = ConfigManager.selectedConfig().content;
        const testsMatch = originalContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (testsMatch) {
            yamlConfig += `\n\ntests:\n${testsMatch[1].trim()}`;
        }
    }
    
    if (defaultTestConfig) {
        yamlConfig += `\n\n${defaultTestConfig}`;
    }
    
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
    
    
    // 重置 G-Eval 專案
    const enableGEval = document.getElementById('enableGEval');
    const gevalConfig = document.getElementById('gevalConfig');
    const openaiModel = document.getElementById('openaiModel');
    
    if (enableGEval) enableGEval.checked = false;
    if (gevalConfig) gevalConfig.style.display = 'none';
    if (openaiModel) openaiModel.value = 'gpt-4o-mini';
    updateGradingModelFields();
    
    // 重置 IContains 專案
    const enableIContains = document.getElementById('enableIContains');
    const icontainsConfig = document.getElementById('icontainsConfig');
    const icontainsValue = document.getElementById('icontainsValue');
    
    if (enableIContains) enableIContains.checked = false;
    if (icontainsConfig) icontainsConfig.style.display = 'none';
    if (icontainsValue) icontainsValue.value = '';
    
    // 重置 ROUGE-N 專案
    const enableRougeN = document.getElementById('enableRougeN');
    const rougeNConfig = document.getElementById('rougeNConfig');
    const rougeNThreshold = document.getElementById('rougeNThreshold');
    
    if (enableRougeN) enableRougeN.checked = false;
    if (rougeNConfig) rougeNConfig.style.display = 'none';
    if (rougeNThreshold) rougeNThreshold.value = '0.6';
    
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
