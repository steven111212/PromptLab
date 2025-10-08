
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
        ConfigForm.toggleQuestionInput();
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
            <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}











// 預覽專案
function previewConfig() {
    const config = generateConfigFromForm();
    const preview = document.getElementById('configPreview');
    preview.textContent = config;
    new bootstrap.Modal(document.getElementById('configPreviewModal')).show();
}

// 從表單生成專案設定 - 已移至 FormValidation 模組
// 使用 FormValidation.generateConfigFromForm() 替代
function generateConfigFromForm() {
    const configName = document.getElementById('configName').value;
    
    // 獲取API設定
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
    
    // 獲取測試問題設定
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSource = questionSourceRadio ? questionSourceRadio.value : 'upload';
    let testsConfig = '';
    
    if (questionSource === 'upload') {
        // 檔案上傳模式：生成 tests 設定
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput && csvFileInput.files.length > 0) {
            const questionFile = csvFileInput.files[0];
            testsConfig = `  - file://${questionFile.name}`;
        }
    }
    
    // 生成Providers設定（格式一）
    let providersConfig = '';
    
    if (httpPath && httpHost && httpContentType && requestBody) {
        providersConfig = `providers:
  - id: http
    config:`;
        
        // 添加 useHttps 設定
        if (useHttps) {
            providersConfig += `\n      useHttps: true`;
        }
        
        // 構建 request 內容
        const trimmedRequestBody = requestBody.trim();
        let requestContent = `${httpMethod} ${httpPath} HTTP/1.1\nHost: ${httpHost}\nContent-Type: ${httpContentType}`;
        
        // 添加 Authorization header
        if (authType !== 'none' && authValue) {
            let authHeader = '';
            switch (authType) {
                case 'bearer':
                    authHeader = `Authorization: Bearer ${authValue}`;
                    break;
                case 'basic':
                    authHeader = `Authorization: Basic ${authValue}`;
                    break;
                case 'apikey':
                    authHeader = `Authorization: ${authValue}`;
                    break;
                case 'custom':
                    authHeader = `Authorization: ${authValue}`;
                    break;
            }
            if (authHeader) {
                requestContent += `\n${authHeader}`;
            }
        }
        
        
        // 添加空行和 body
        requestContent += '\n';
        
        // 為 JSON body 添加正確的縮排
        if (trimmedRequestBody) {
            // 先格式化 JSON（如果是有效的 JSON）
            let formattedBody = trimmedRequestBody;
            try {
                const jsonObj = JSON.parse(trimmedRequestBody);
                formattedBody = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
                // 不是有效的 JSON，保持原樣
                formattedBody = trimmedRequestBody;
            }
            requestContent += `\n${formattedBody}`;
        }
        
        // 添加 request 設定，統一縮排處理
        providersConfig += `\n      request: |\n${requestContent.split('\n').map(line => `        ${line}`).join('\n')}`;
        
        // 添加 transformResponse
        if (transformResponse.trim()) {
            providersConfig += `\n      transformResponse: ${transformResponse}`;
        }
    }
    
    // 生成評分標準設定
    let assertConfig = '';
    const asserts = [];
    
    // JavaScript 評分
    if (document.getElementById('enableJavascript').checked) {
        const condition = document.getElementById('javascriptCondition').value;
        if (condition === 'length') {
            const minLength = document.getElementById('minLength').value;
            asserts.push(`  - type: javascript
    value: output.length >= ${minLength}`);
        } else if (condition === 'custom') {
            const customJs = document.getElementById('customJavascript').value;
            if (customJs.trim()) {
                asserts.push(`  - type: javascript
    value: ${customJs.trim()}`);
            }
        }
    }
    
    // 檢查是否有選擇任何 Metric 評分選項
    const hasMetricScoring = document.getElementById('enableJavascript').checked ||
                            document.getElementById('enableFactuality').checked ||
                            document.getElementById('enableSimilarity').checked ||
                            document.getElementById('enableBertScore').checked ||
                            document.getElementById('enableBertRecall').checked ||
                            document.getElementById('enableBertPrecision').checked ||
                            document.getElementById('enableRouge').checked ||
                            document.getElementById('enableContains').checked ||
                            document.getElementById('enableRegex').checked ||
                            document.getElementById('enableWordCount').checked ||
                            document.getElementById('enableSentiment').checked ||
                            document.getElementById('enableToxicity').checked ||
                            document.getElementById('enableReadability').checked;
    
    if (hasMetricScoring) {
        // Metric 評分 - 添加各種預設指標
        
        
        // 語義相似度
        if (document.getElementById('enableSimilarity') && document.getElementById('enableSimilarity').checked) {
            asserts.push(`  - type: similar
    value: "{{expected_answer}}"
    threshold: 0.8`);
        }
        
        // BERT Score (F1)
        if (document.getElementById('enableBertScore') && document.getElementById('enableBertScore').checked) {
            asserts.push(`  - type: python
    value: file://../../assert/bert_scoring.py:get_assert_bert_f1`);
        }
        
        // BERT Recall
        if (document.getElementById('enableBertRecall') && document.getElementById('enableBertRecall').checked) {
            asserts.push(`  - type: python
    value: file://../../assert/bert_scoring.py:get_assert_bert_recall`);
        }
        
        // BERT Precision
        if (document.getElementById('enableBertPrecision') && document.getElementById('enableBertPrecision').checked) {
            asserts.push(`  - type: python
    value: file://../../assert/bert_scoring.py:get_assert_bert_precision`);
        }
        
        // ROUGE Score
        if (document.getElementById('enableRouge') && document.getElementById('enableRouge').checked) {
            asserts.push(`  - type: rouge
    value: "{{expected_answer}}"
    threshold: 0.6`);
        }
        
        // 包含檢查
        if (document.getElementById('enableContains') && document.getElementById('enableContains').checked) {
            asserts.push(`  - type: contains
    value: "{{expected_keywords}}"`);
        }
        
        // 正則表達式
        if (document.getElementById('enableRegex') && document.getElementById('enableRegex').checked) {
            asserts.push(`  - type: regex
    value: "^[\\s\\S]*台電[\\s\\S]*$"`);
        }
        
        // 字數統計
        if (document.getElementById('enableWordCount') && document.getElementById('enableWordCount').checked) {
            asserts.push(`  - type: javascript
    value: output.length >= 50 && output.length <= 500`);
        }
        
        // 情感分析
        if (document.getElementById('enableSentiment') && document.getElementById('enableSentiment').checked) {
            asserts.push(`  - type: sentiment
    value: positive
    threshold: 0.5`);
        }
        
        // 毒性檢測
        if (document.getElementById('enableToxicity') && document.getElementById('enableToxicity').checked) {
            asserts.push(`  - type: toxicity
    threshold: 0.1`);
        }
        
        // 可讀性評估
        if (document.getElementById('enableReadability') && document.getElementById('enableReadability').checked) {
            asserts.push(`  - type: readability
    threshold: 60`);
        }
    }
    
    // 檢查是否有選擇 LLM Grader 評分
    const hasLLMScoring = document.getElementById('enableGEval').checked;
    const hasFactualityScoring = document.getElementById('enableFactuality') && document.getElementById('enableFactuality').checked;
    
    if (hasLLMScoring || hasFactualityScoring) {
        // 事實性檢查評分
        if (hasFactualityScoring) {
            const factualityVariable = document.getElementById('factualityVariable');
            const selectedVariable = factualityVariable ? factualityVariable.value : '{{expected_answer}}';
            asserts.push(`  - type: factuality
    value: "${selectedVariable}"`);
        }
        
        // LLM Grader 評分 - G-Eval
        if (document.getElementById('enableGEval') && document.getElementById('enableGEval').checked) {
        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
        const criteria = [];
        criteriaInputs.forEach(input => {
            if (input.value.trim()) {
                criteria.push(input.value.trim());
            }
        });
        
        if (criteria.length > 0) {
            let gevalConfig = `  - type: g-eval
    value:`;
            criteria.forEach(criterion => {
                gevalConfig += `\n      - ${criterion}`;
            });
            
            asserts.push(gevalConfig);
            }
        }
    }
    
    if (asserts.length > 0) {
        assertConfig = 'assert:\n' + asserts.join('\n');
    }
    
    // 生成完整專案
    let config = `description: "${configName}"`;

    if (providersConfig) {
        config += `\n\n${providersConfig}`;
    }
    
    // 處理測試問題設定 - 使用 tests 欄位
    if (testsConfig) {
        // 檔案上傳模式：使用 tests
        config += `\n\ntests:\n${testsConfig}`;
    }
    
    // 如果沒有新的測試設定，但原有專案中有 prompts 或 tests，需要保留
    if (!testsConfig && ConfigManager.selectedConfig()) {
        const originalContent = ConfigManager.selectedConfig().content;
        
        // 檢查原有專案中是否有 prompts
        if (originalContent.includes('prompts:')) {
            const promptsMatch = originalContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (promptsMatch) {
                const promptsContent = promptsMatch[1].trim();
                if (promptsContent) {
                    config += `\n\nprompts:\n${promptsContent}`;
                }
            }
        }
        
        // 檢查原有專案中是否有 tests
        if (originalContent.includes('tests:')) {
            const testsMatch = originalContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (testsMatch) {
                const testsContent = testsMatch[1].trim();
                if (testsContent) {
                    config += `\n\ntests:\n${testsContent}`;
                }
            }
        }
    }
    
    // 檢查是否有 LLM Grader 評分或 provider 設定
    const hasGEval = document.getElementById('enableGEval') && document.getElementById('enableGEval').checked;
    const hasFactuality = document.getElementById('enableFactuality') && document.getElementById('enableFactuality').checked;
    const hasLLMProvider = document.getElementById('llmProvider') && document.getElementById('llmProvider').value;
    
    // 如果有評分標準或LLM provider設定，使用 defaultTest 格式
    if (assertConfig || hasLLMProvider) {
        if (hasGEval || hasFactuality || hasLLMProvider) {
            // 有 LLM Grader 評分或 provider 設定，需要在 defaultTest.options 中添加 provider 設定
            const llmProvider = document.getElementById('llmProvider').value;
            const graderProviderConfig = generateGraderProviderConfig(llmProvider);
            
            if (graderProviderConfig) {
                if (assertConfig) {
                    config += `\n\ndefaultTest:\n  options:\n${graderProviderConfig}\n\n  ${assertConfig}`;
                } else {
                    config += `\n\ndefaultTest:\n  options:\n${graderProviderConfig}`;
                }
            } else {
                if (assertConfig) {
                    config += `\n\ndefaultTest:\n  ${assertConfig}`;
                }
            }
            } else {
                // 沒有 LLM Grader 評分，只需要 assert 設定
                config += `\n\ndefaultTest:\n  ${assertConfig}`;
            }
    }
    
    console.log('最終生成的專案設定:', config);
    return config;
}

// 更新 LLM 提供者設定區域 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.updateLLMProviderConfig() 替代

// 生成 LLM Grader 提供者設定
function generateGraderProviderConfig(provider) {
    if (!provider) return null;
    
    let providerConfig = '';
    
    switch (provider) {
        case 'openai':
            const openaiModel = document.getElementById('openaiModel').value;
            const openaiApiKey = document.getElementById('openaiApiKey').value;
            
            providerConfig = `    provider:
      id: openai:${openaiModel}
      config:
        apiKey: "${openaiApiKey || 'sk-abc123'}"`;
            break;
            
        case 'anthropic':
            const anthropicModel = document.getElementById('anthropicModel').value;
            const anthropicApiKey = document.getElementById('anthropicApiKey').value;
            
            providerConfig = `    provider:
      id: anthropic:${anthropicModel}
      config:
        apiKey: "${anthropicApiKey || 'sk-ant-abc123'}"`;
            break;
            
        case 'azure-openai':
            const azureEndpoint = document.getElementById('azureEndpoint').value;
            const azureApiKey = document.getElementById('azureApiKey').value;
            const azureModel = document.getElementById('azureModel').value;
            const azureApiVersion = document.getElementById('azureApiVersion').value;
            
            providerConfig = `    provider:
      id: openai:${azureModel}
      config:
        apiKey: "${azureApiKey || 'your-api-key'}"
        apiBaseUrl: "${azureEndpoint || 'https://your-resource.openai.azure.com'}"
        apiVersion: "${azureApiVersion || '2024-02-15-preview'}"`;
            break;
            
        case 'google':
            const googleModel = document.getElementById('googleModel').value;
            const googleApiKey = document.getElementById('googleApiKey').value;
            
            providerConfig = `    provider:
      id: google:${googleModel}
      config:
        apiKey: "${googleApiKey || 'your-google-api-key'}"`;
            break;
            
        case 'custom':
            const customEndpoint = document.getElementById('customEndpoint').value;
            const customApiKey = document.getElementById('customApiKey').value;
            const customModel = document.getElementById('customModel').value;
            
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

// 切換 JavaScript 設定顯示 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.toggleJavascriptConfig() 替代
function toggleJavascriptConfig() {
    const checkbox = document.getElementById('enableJavascript');
    const config = document.getElementById('javascriptConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 切換 G-Eval 設定顯示 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.toggleGEvalConfig() 替代
function toggleGEvalConfig() {
    const checkbox = document.getElementById('enableGEval');
    const config = document.getElementById('gevalConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 更新 JavaScript 條件設定 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.updateJavascriptCondition() 替代
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

// 更新評分模型設定
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

// 添加 G-Eval 評分標準 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.addGEvalCriteria() 替代
function addGEvalCriteria() {
    const list = document.getElementById('gevalCriteriaList');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control">
        <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(div);
}

// 移除 G-Eval 評分標準 - 已移至 ScoringCriteria 模組
// 使用 ScoringCriteria.removeGEvalCriteria() 替代
function removeGEvalCriteria(button) {
    button.parentElement.remove();
}





// 處理檔案上傳
// handleFileUpload 函數已移至 utils.js 模組

// readFileAsBase64 函數已移至 utils.js 模組

// 切換問題輸入方式 - 已移至 ConfigForm 模組
// 使用 ConfigForm.toggleQuestionInput() 替代


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
            await loadConfigs();
            
            // 如果是編輯模式，顯示更新後的專案詳情
            if (isEdit) {
                await ConfigManager.selectConfig(ConfigManager.selectedConfig().id);
            } else {
                // 新增模式，隱藏表單，顯示提示
                ConfigForm.hideConfigForm();
            }
        } else {
            showAlert((isEdit ? '儲存' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('專案操作失敗:', error);
        showAlert('專案操作失敗', 'danger');
    }
}

// 取消專案表單 - 已移至 ConfigForm 模組
// 使用 ConfigForm.cancelConfigForm() 替代

// 隱藏專案表單 - 已移至 ConfigForm 模組
// 使用 ConfigForm.hideConfigForm() 替代

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
            await loadConfigs();
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

// 驗證友善表單
// validateFriendlyForm 函數已移至 utils.js 模組




// 載入執行結果
// loadResults 函數已移至 results-management.js 模組

// showResultDetails 函數已移至 results-management.js 模組

// 顯示結果詳情內容
function displayResultDetails(result) {
    const detailsContainer = document.getElementById('resultDetails');
    const titleElement = document.getElementById('resultDetailsTitle');
    const contentElement = document.getElementById('resultDetailsContent');
    
    // 設置標題
    titleElement.textContent = `結果詳情 - ${result.id}`;
    
    // 生成詳情內容
    const createdDate = new Date(result.created_at).toLocaleString('zh-TW');
    const passRate = parseFloat(result.pass_rate) || 0;
    let passRateClass = 'pass-rate-low';
    if (passRate === 100) {
        passRateClass = 'pass-rate-100';
    } else if (passRate >= 80) {
        passRateClass = 'pass-rate-80';
    }
    
    let testCasesHtml = '';
    if (result.test_cases && result.test_cases.length > 0) {
        testCasesHtml = result.test_cases.map((testCase, index) => {
            const resultClass = testCase.success ? 'test-result-pass' : 'test-result-fail';
            const statusIcon = testCase.success ? '✅' : '❌';
            const statusText = testCase.success ? 'PASS' : 'FAIL';
            
            return `
                <div class="${resultClass}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${testCase.success ? 'bg-success' : 'bg-danger'} me-2">${statusIcon} ${statusText}</span>
                            <small class="text-muted">延遲: ${testCase.latency || 'N/A'}ms</small>
                        </div>
                    </div>
                    <div class="prompt-text">${testCase.prompt}</div>
                    <div class="output-text">${testCase.output || testCase.error || '無輸出'}</div>
                </div>
            `;
        }).join('');
    } else {
        testCasesHtml = '<p class="text-muted">無測試案例詳情</p>';
    }
    
    contentElement.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>基本資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td>${result.id}</td></tr>
                    <tr><td><strong>描述:</strong></td><td>${result.description || '未命名'}</td></tr>
                    <tr><td><strong>執行時間:</strong></td><td>${createdDate}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>統計資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>通過率:</strong></td><td><span class="${passRateClass}">${passRate.toFixed(2)}%</span></td></tr>
                    <tr><td><strong>總測試數:</strong></td><td>${result.total_tests || 0}</td></tr>
                    <tr><td><strong>成功數:</strong></td><td>${result.success_count || 0}</td></tr>
                    <tr><td><strong>失敗數:</strong></td><td>${result.failure_count || 0}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="mb-3">
            <h6>測試案例詳情</h6>
            ${testCasesHtml}
        </div>
    `;
    
    // 顯示詳情面板
    detailsContainer.style.display = 'block';
    
    // 滾動到詳情面板
    detailsContainer.scrollIntoView({ behavior: 'smooth' });
}

// 評估結果相關功能已移至 evaluation-results.js

// 隱藏結果詳情
function hideResultDetails() {
    const detailsContainer = document.getElementById('resultDetails');
    detailsContainer.style.display = 'none';
}

// 顯示警告訊息
// showAlert 函數已移至 utils.js 模組



