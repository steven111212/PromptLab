// 配置載入模組
// 負責配置的載入和顯示功能

// 顯示當前測試問題信息
function showCurrentTestInfo(yamlContent) {
    let testInfoHtml = '';
    
    // 優先檢查 tests: 是否有具體檔案
    if (yamlContent.includes('tests:')) {
        const testsMatch = yamlContent.match(/tests:\s*\n((?:.*\n?)*?)(?=\n[a-zA-Z]|$)/);
        if (testsMatch) {
            const tests = testsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*/, ''))
                .filter(line => line.trim());
            if (tests.length > 0) {
                // 解析檔案名稱（處理 file:// 前綴）
                const fileNames = tests.map(file => {
                    if (file.startsWith('file://')) {
                        return file.replace('file://', '');
                    }
                    return file;
                });
                
                testInfoHtml = `
                    <div class="alert alert-info mb-4">
                        <i class="fas fa-file-csv me-2"></i>
                        <strong>目前已配置的測試檔案：</strong>
                        <ul class="mb-0 mt-2">
                            ${fileNames.map(file => `<li><code>${file}</code></li>`).join('')}
                        </ul>
                        <small class="text-muted d-block mt-2">
                            <i class="fas fa-lightbulb me-1"></i>
                            如果要更改測試問題，可以上傳新的 CSV 檔案替換現有配置
                        </small>
                    </div>
                `;
            }
        }
    }
    // 如果沒有 tests: 或 tests: 為空，再檢查 prompts:
    else if (yamlContent.includes('prompts:')) {
        const promptsMatch = yamlContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (promptsMatch) {
            const prompts = promptsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']$/, ''))
                .filter(line => line.trim() && !line.includes('{{question}}') && !line.includes('{{prompt}}'));
            
            if (prompts.length > 0) {
                testInfoHtml = `
                    <div class="alert alert-success mb-4">
                        <i class="fas fa-list-ul me-2"></i>
                        <strong>目前已配置 ${prompts.length} 個測試問題：</strong>
                        <div class="mt-2 p-2 bg-light rounded">
                            ${prompts.slice(0, 3).map((prompt, index) => `<div class="small mb-1"><strong>${index + 1}.</strong> ${prompt}</div>`).join('')}
                            ${prompts.length > 3 ? `<div class="small text-muted">... 還有 ${prompts.length - 3} 個問題</div>` : ''}
                        </div>
                        <small class="text-muted d-block mt-2">
                            <i class="fas fa-lightbulb me-1"></i>
                            如果要修改問題，可以上傳新的 CSV 檔案替換現有配置
                        </small>
                    </div>
                `;
            } else {
                testInfoHtml = `
                    <div class="alert alert-warning mb-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>檢測到 prompts 配置但沒有具體問題</strong>
                    </div>
                `;
            }
        }
    }
    
    // 將測試問題提醒插入到測試問題配置區域
    if (testInfoHtml) {
        // 使用 setTimeout 確保 DOM 已經渲染完成
        setTimeout(() => {
            // 尋找步驟3的測試問題配置區域
            const step3 = document.getElementById('step3');
            if (step3) {
                // 移除舊的提醒
                const existingAlert = step3.querySelector('.alert');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                // 在步驟標題後插入提醒
                const stepHeader = step3.querySelector('.step-header');
                if (stepHeader) {
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = testInfoHtml;
                    stepHeader.insertAdjacentElement('afterend', infoDiv.firstElementChild);
                }
            } else {
                // 如果不是步驟式界面，使用原來的邏輯
                const questionConfigTitle = Array.from(document.querySelectorAll('h6')).find(h6 => 
                    h6.textContent.includes('測試問題配置')
                );
                
                if (questionConfigTitle) {
                    // 移除舊的提醒
                    const existingAlert = questionConfigTitle.parentElement.querySelector('.alert');
                    if (existingAlert) {
                        existingAlert.remove();
                    }
                    
                    // 在標題後插入提醒
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = testInfoHtml;
                    questionConfigTitle.insertAdjacentElement('afterend', infoDiv.firstElementChild);
                }
            }
        }, 100);
    }
}

// 將配置載入到表單中
async function loadConfigToForm(config) {
    try {
        console.log('開始載入配置到表單:', config);
        
        // 解析 YAML 配置
        const yamlContent = config.content;
        console.log('YAML 內容:', yamlContent);
        
        // 檢查並顯示當前配置的測試問題信息
        showCurrentTestInfo(yamlContent);
        
        // 基本資訊
        const descriptionMatch = yamlContent.match(/description:\s*["']?([^"'\n]+)["']?/);
        if (descriptionMatch) {
            document.getElementById('configName').value = descriptionMatch[1];
            console.log('設置配置名稱:', descriptionMatch[1]);
        }
        
        // 檢查是否有 providers 配置（格式一）
        if (yamlContent.includes('providers:')) {
            // 解析 useHttps 配置
            const useHttpsMatch = yamlContent.match(/useHttps:\s*(true|false)/);
            if (useHttpsMatch) {
                document.getElementById('useHttps').checked = useHttpsMatch[1] === 'true';
            }
            
            // 解析 request 格式
            const requestMatch = yamlContent.match(/request:\s*\|\s*\n((?:.*\n)*?)(?=\n\s*transformResponse|\n\s*[a-zA-Z]|\n\s*$)/);
            if (requestMatch) {
                const requestLines = requestMatch[1].trim().split('\n');
                
                // 解析第一行：POST /chat/completions HTTP/1.1
                if (requestLines.length > 0) {
                    const firstLine = requestLines[0].trim();
                    const methodMatch = firstLine.match(/^(\w+)\s+([^\s]+)(?:\s+HTTP\/[\d.]+)?$/);
                    if (methodMatch) {
                        document.getElementById('httpMethod').value = methodMatch[1];
                        document.getElementById('httpPath').value = methodMatch[2];
                        console.log('解析到的方法:', methodMatch[1]);
                        console.log('解析到的路徑:', methodMatch[2]);
                    }
                }
                
                // 解析 Host
                const hostLine = requestLines.find(line => line.trim().startsWith('Host:'));
                if (hostLine) {
                    const hostValue = hostLine.replace('Host:', '').trim();
                    document.getElementById('httpHost').value = hostValue;
                }
                
                // 解析 Content-Type
                const contentTypeLine = requestLines.find(line => line.trim().startsWith('Content-Type:'));
                if (contentTypeLine) {
                    const contentTypeValue = contentTypeLine.replace('Content-Type:', '').trim();
                    document.getElementById('httpContentType').value = contentTypeValue;
                }
                
                // 解析 Authorization
                const authLine = requestLines.find(line => line.trim().startsWith('Authorization:'));
                if (authLine) {
                    const authValue = authLine.replace('Authorization:', '').trim();
                    if (authValue.startsWith('Bearer ')) {
                        document.getElementById('authType').value = 'bearer';
                        document.getElementById('authValue').value = authValue.replace('Bearer ', '');
                    } else if (authValue.startsWith('Basic ')) {
                        document.getElementById('authType').value = 'basic';
                        document.getElementById('authValue').value = authValue.replace('Basic ', '');
                    } else {
                        document.getElementById('authType').value = 'custom';
                        document.getElementById('authValue').value = authValue;
                    }
                }
                
                // 解析 body
                const bodyStart = requestLines.findIndex(line => line.trim() === '');
                if (bodyStart !== -1 && bodyStart < requestLines.length - 1) {
                    const bodyLines = requestLines.slice(bodyStart + 1);
                    // 過濾掉 transformResponse 相關的內容和空白行
                    const filteredBodyLines = bodyLines.filter(line => 
                        !line.trim().startsWith('transformResponse:') && 
                        line.trim() !== ''
                    );
                    // 移除開頭的空白行
                    const trimmedBodyLines = filteredBodyLines.filter((line, index) => {
                        // 如果是第一行且為空，則跳過
                        if (index === 0 && line.trim() === '') {
                            return false;
                        }
                        return true;
                    });
                    
                    const bodyText = trimmedBodyLines.join('\n');
                    
                    // 直接設置 Request Body 內容
                    document.getElementById('requestBody').value = bodyText;
                }
            }
            
            // 解析 transformResponse
            const transformMatch = yamlContent.match(/transformResponse:\s*([^\n]+)/);
            if (transformMatch) {
                document.getElementById('transformResponse').value = transformMatch[1].trim();
            }
        }
        
        // 測試問題信息已在 showCurrentTestInfo 函數中處理
        
        // 載入 Grader Provider 配置（無論是否有評分標準）
        const providerMatch = yamlContent.match(/defaultTest:\s*\n\s*options:\s*\n\s*provider:\s*\n\s*id:\s*([^\n]+)/);
        if (providerMatch) {
            const providerId = providerMatch[1].trim();
            console.log('找到 Provider ID:', providerId);
            
            // 解析 provider 類型和模型
            // 先檢查是否為Azure OpenAI（優先級最高）
            if (providerId.startsWith('openai:') && 
                (yamlContent.includes('apiBaseUrl') || yamlContent.includes('apiVersion'))) {
                // Azure OpenAI配置
                document.getElementById('llmProvider').value = 'azure-openai';
                const model = providerId.replace('openai:', '');
                setTimeout(() => {
                    ScoringCriteria.updateLLMProviderConfig();
                    setTimeout(() => {
                        const azureModelSelect = document.getElementById('azureModel');
                        if (azureModelSelect) {
                            azureModelSelect.value = model;
                        }
                        
                        // 載入 Azure 配置
                        const apiKeyMatch = yamlContent.match(/apiKey:\s*["]?([^"\n]+)["]?/);
                        if (apiKeyMatch) {
                            const azureApiKey = document.getElementById('azureApiKey');
                            if (azureApiKey) {
                                azureApiKey.value = apiKeyMatch[1].trim();
                            }
                        }
                        
                        const apiBaseUrlMatch = yamlContent.match(/apiBaseUrl:\s*["]?([^"\n]+)["]?/);
                        if (apiBaseUrlMatch) {
                            const azureApiBaseUrl = document.getElementById('azureApiBaseUrl');
                            if (azureApiBaseUrl) {
                                azureApiBaseUrl.value = apiBaseUrlMatch[1].trim();
                            }
                        }
                        
                        const apiVersionMatch = yamlContent.match(/apiVersion:\s*["]?([^"\n]+)["]?/);
                        if (apiVersionMatch) {
                            const azureApiVersion = document.getElementById('azureApiVersion');
                            if (azureApiVersion) {
                                azureApiVersion.value = apiVersionMatch[1].trim();
                            }
                        }
                    }, 100);
                }, 100);
            } else if (providerId.startsWith('openai:')) {
                // 一般OpenAI配置
                document.getElementById('llmProvider').value = 'openai';
                const model = providerId.replace('openai:', '');
                setTimeout(() => {
                    ScoringCriteria.updateLLMProviderConfig();
                    setTimeout(() => {
                        const openaiModelSelect = document.getElementById('openaiModel');
                        if (openaiModelSelect) {
                            openaiModelSelect.value = model;
                        }
                        
                        // 載入 API Key
                        const apiKeyMatch = yamlContent.match(/apiKey:\s*["]?([^"\n]+)["]?/);
                        if (apiKeyMatch) {
                            const openaiApiKey = document.getElementById('openaiApiKey');
                            if (openaiApiKey) {
                                openaiApiKey.value = apiKeyMatch[1].trim();
                            }
                        }
                    }, 100);
                }, 100);
            } else if (providerId.startsWith('anthropic:')) {
                document.getElementById('llmProvider').value = 'anthropic';
                const model = providerId.replace('anthropic:', '');
                setTimeout(() => {
                    ScoringCriteria.updateLLMProviderConfig();
                    setTimeout(() => {
                        const anthropicModelSelect = document.getElementById('anthropicModel');
                        if (anthropicModelSelect) {
                            anthropicModelSelect.value = model;
                        }
                    }, 100);
                }, 100);
            } else if (providerId.startsWith('google:')) {
                document.getElementById('llmProvider').value = 'google';
                const model = providerId.replace('google:', '');
                setTimeout(() => {
                    ScoringCriteria.updateLLMProviderConfig();
                    setTimeout(() => {
                        const googleModelSelect = document.getElementById('googleModel');
                        if (googleModelSelect) {
                            googleModelSelect.value = model;
                        }
                    }, 100);
                }, 100);
            } else if (providerId.startsWith('azure:')) {
                document.getElementById('llmProvider').value = 'azure-openai';
                const model = providerId.replace('azure:', '');
                setTimeout(() => {
                    ScoringCriteria.updateLLMProviderConfig();
                    setTimeout(() => {
                        const azureModelSelect = document.getElementById('azureModel');
                        if (azureModelSelect) {
                            azureModelSelect.value = model;
                        }
                    }, 100);
                }, 100);
            }
        }

        // 檢查評分標準
        if (yamlContent.includes('assert:')) {
            // 檢查 JavaScript 驗證
            if (yamlContent.includes('type: javascript')) {
                document.getElementById('enableJavascript').checked = true;
                ScoringCriteria.toggleJavascriptConfig();
                
                const jsMatch = yamlContent.match(/type:\s*javascript\s*\n\s*value:\s*([^\n]+)/);
                if (jsMatch) {
                    const jsValue = jsMatch[1].trim();
                    if (jsValue.includes('length')) {
                        document.getElementById('javascriptCondition').value = 'length';
                        ScoringCriteria.updateJavascriptCondition();
                        
                        const lengthMatch = jsValue.match(/length\s*>=\s*(\d+)/);
                        if (lengthMatch) {
                            document.getElementById('minLength').value = lengthMatch[1];
                        }
                    } else {
                        document.getElementById('javascriptCondition').value = 'custom';
                        ScoringCriteria.updateJavascriptCondition();
                        document.getElementById('customJavascript').value = jsValue;
                    }
                }
            }
            
            // 檢查事實性檢查
            if (yamlContent.includes('type: factuality')) {
                document.getElementById('enableFactuality').checked = true;
                ScoringCriteria.toggleFactualityConfig();
                
                // 載入事實性檢查變數
                const factualityMatch = yamlContent.match(/type:\s*factuality\s*\n\s*value:\s*["]?([^"\n]+)["]?/);
                if (factualityMatch) {
                    const factualityVariable = factualityMatch[1].trim();
                    const factualityVariableSelect = document.getElementById('factualityVariable');
                    if (factualityVariableSelect) {
                        factualityVariableSelect.value = factualityVariable;
                    }
                }
            }
            
            // 檢查 BERT Score (F1)
            if (yamlContent.includes('get_assert_bert_f1')) {
                document.getElementById('enableBertScore').checked = true;
            }
            
            // 檢查 BERT Recall
            if (yamlContent.includes('get_assert_bert_recall')) {
                document.getElementById('enableBertRecall').checked = true;
            }
            
            // 檢查 BERT Precision
            if (yamlContent.includes('get_assert_bert_precision')) {
                document.getElementById('enableBertPrecision').checked = true;
            }
            
            // 檢查 G-Eval
            if (yamlContent.includes('type: g-eval') || yamlContent.includes('type: llm-rubric')) {
                document.getElementById('enableGEval').checked = true;
                ScoringCriteria.toggleGEvalConfig();
                
                // 嘗試解析 G-Eval 配置
                // 先嘗試解析多行評分標準（value: 後面跟著列表）
                const valueSection = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*\n((?:\s+-\s*.*\n?)+)/);
                if (valueSection) {
                    const criteria = valueSection[1].trim().split('\n')
                        .map(line => line.replace(/^\s*-\s*/, '').replace(/^["']/, '').replace(/["']$/, ''))
                        .filter(line => line.trim());
                    
                    console.log('解析到的 G-Eval 評分標準:', criteria);
                    
                    // 使用 setTimeout 確保 DOM 已經渲染完成
                    setTimeout(() => {
                        // 清空現有的評分標準列表
                        const gevalCriteriaList = document.getElementById('gevalCriteriaList');
                        if (gevalCriteriaList) {
                            gevalCriteriaList.innerHTML = '';
                            
                            // 為每個評分標準添加輸入框
                            criteria.forEach((criterion, index) => {
                                ScoringCriteria.addGEvalCriteria();
                                
                                // 使用不同的延遲時間避免覆蓋
                                setTimeout(() => {
                                    const inputGroups = gevalCriteriaList.querySelectorAll('.input-group');
                                    const targetInputGroup = inputGroups[index];
                                    if (targetInputGroup) {
                                        const input = targetInputGroup.querySelector('input[type="text"]');
                                        if (input) {
                                            input.value = criterion;
                                            console.log(`設置評分標準 ${index + 1}:`, criterion);
                                        }
                                    }
                                }, 50 + (index * 20)); // 每個評分標準增加20ms延遲
                            });
                        }
                    }, 100);
                } else {
                    // 嘗試解析單行評分標準
                    const gevalMatch = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*([^\n]+)/);
                    if (gevalMatch) {
                        const criterion = gevalMatch[1].trim();
                        console.log('解析到的單行 G-Eval 評分標準:', criterion);
                        
                        // 使用 setTimeout 確保 DOM 已經渲染完成
                        setTimeout(() => {
                            // 清空現有的評分標準列表
                            const gevalCriteriaList = document.getElementById('gevalCriteriaList');
                            if (gevalCriteriaList) {
                                gevalCriteriaList.innerHTML = '';
                                
                                // 添加單個評分標準
                                ScoringCriteria.addGEvalCriteria();
                                
                                // 設置值
                                setTimeout(() => {
                                    const inputGroups = gevalCriteriaList.querySelectorAll('.input-group');
                                    const lastInputGroup = inputGroups[inputGroups.length - 1];
                                    if (lastInputGroup) {
                                        const input = lastInputGroup.querySelector('input[type="text"]');
                                        if (input) {
                                            input.value = criterion;
                                            console.log('設置單行評分標準:', criterion);
                                        }
                                    }
                                }, 50);
                            }
                        }, 100);
                    }
                }
            }
        }
        
        console.log('配置載入完成');
        
    } catch (error) {
        console.error('載入配置到表單失敗:', error);
        showAlert('載入配置到表單失敗', 'danger');
    }
}

// 匯出配置載入相關的函數供其他模組使用
window.ConfigLoader = {
    showCurrentTestInfo,
    loadConfigToForm
};
