// API測試模組
// 負責API測試相關的功能

// 測試API
async function testAPI() {
    const testButton = document.getElementById('testAPIButton');
    const testResult = document.getElementById('testResult');
    const testError = document.getElementById('testError');
    const testQuestion = document.getElementById('testQuestion').value.trim();
    
    if (!testQuestion) {
        showAlert('請輸入測試問題', 'warning');
        return;
    }
    
    // 隱藏之前的結果
    testResult.style.display = 'none';
    testError.style.display = 'none';
    
    // 設置按鈕為載入狀態
    testButton.disabled = true;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>測試中...';
    
    try {
        // 收集API配置
        const apiConfig = collectAPIConfig();
        
        console.log('收集到的API配置:', apiConfig);
        
        if (!apiConfig.isValid) {
            throw new Error(apiConfig.error);
        }
        
        // 構建請求
        const requestConfig = buildAPIRequest(apiConfig, testQuestion);
        
        console.log('構建的請求配置:', requestConfig);
        console.log('測試問題:', testQuestion);
        console.log('Request Body 替換後:', requestConfig.body);
        
        // 顯示請求詳情
        document.getElementById('requestDetails').textContent = 
            `${requestConfig.method} ${requestConfig.url}`;
        
        // 發送測試請求
        const startTime = Date.now();
        const response = await fetch('/api/test-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestConfig)
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        console.log('API測試結果:', result);
        
        if (response.ok && result.success) {
            // 顯示成功結果
            displayTestSuccess(result, responseTime, apiConfig.transformResponse);
        } else {
            // 顯示錯誤
            throw new Error(result.error || '測試失敗');
        }
        
    } catch (error) {
        console.error('API測試錯誤:', error);
        displayTestError(error.message);
    } finally {
        // 恢復按鈕狀態
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-play me-2"></i>測試API';
    }
}

// 收集API配置
function collectAPIConfig() {
    try {
        // 從表單獲取基本配置
        const useHttps = document.getElementById('useHttps')?.checked || false;
        const httpMethod = document.getElementById('httpMethod')?.value || 'POST';
        const httpPath = document.getElementById('httpPath')?.value?.trim();
        const httpHost = document.getElementById('httpHost')?.value?.trim();
        const httpContentType = document.getElementById('httpContentType')?.value?.trim();
        const authType = document.getElementById('authType')?.value;
        const authValue = document.getElementById('authValue')?.value?.trim();
        const requestBody = document.getElementById('requestBody')?.value?.trim();
        const transformResponse = document.getElementById('transformResponse')?.value?.trim();
        
        // 檢查必填欄位
        if (!httpHost) {
            return { isValid: false, error: '請填寫Host' };
        }
        
        if (!httpPath) {
            return { isValid: false, error: '請填寫HTTP路徑' };
        }
        
        if (!requestBody) {
            return { isValid: false, error: '請填寫Request Body' };
        }
        

        
        return {
            isValid: true,
            useHttps,
            httpMethod,
            httpPath,
            httpHost,
            httpContentType,
            authType,
            authValue,
            requestBody,
            transformResponse
        };
    } catch (error) {
        return { isValid: false, error: '配置格式錯誤: ' + error.message };
    }
}

// 解析原始HTTP請求格式
function parseRawHttpRequest(requestText) {
    try {
        const lines = requestText.split('\n');
        let method = 'POST';
        let path = '/';
        let host = '';
        let useHttps = false;
        let contentType = 'application/json';
        let authorization = '';
        let body = '';
        let transformResponse = document.getElementById('transformResponse')?.value?.trim();
        
        let inBody = false;
        let bodyLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (i === 0) {
                // 第一行：方法和路徑
                const parts = line.split(' ');
                if (parts.length >= 2) {
                    method = parts[0];
                    path = parts[1];
                }
            } else if (line === '') {
                // 空行表示headers結束，body開始
                inBody = true;
            } else if (!inBody) {
                // Headers
                if (line.toLowerCase().startsWith('host:')) {
                    host = line.substring(5).trim();
                } else if (line.toLowerCase().startsWith('content-type:')) {
                    contentType = line.substring(13).trim();
                } else if (line.toLowerCase().startsWith('authorization:')) {
                    authorization = line.substring(14).trim();
                }
            } else {
                // Body
                bodyLines.push(line);
            }
        }
        
        body = bodyLines.join('\n').trim();
        
        // 檢查HTTPS
        if (host.includes('api.deepseek.com') || host.includes('api.openai.com')) {
            useHttps = true;
        }
        
        if (!host) {
            return { isValid: false, error: '無法解析Host' };
        }
        
        
        return {
            isValid: true,
            isRawRequest: true,
            useHttps,
            httpMethod: method,
            httpPath: path,
            httpHost: host,
            httpContentType: contentType,
            authorization,
            requestBody: body,
            transformResponse
        };
        
    } catch (error) {
        return { isValid: false, error: '解析HTTP請求格式錯誤: ' + error.message };
    }
}

// 構建API請求
function buildAPIRequest(config, testQuestion) {
    const protocol = config.useHttps ? 'https' : 'http';
    const url = `${protocol}://${config.httpHost}${config.httpPath.startsWith('/') ? config.httpPath : '/' + config.httpPath}`;
    
    console.log('構建URL詳情:');
    console.log('  - protocol:', protocol);
    console.log('  - host:', config.httpHost);
    console.log('  - path:', config.httpPath);
    console.log('  - 最終URL:', url);
    
    // 構建headers
    const headers = {
        'Content-Type': config.httpContentType || 'application/json'
    };
    
    // 添加認證
    if (config.authType && config.authValue) {
        switch (config.authType) {
            case 'bearer':
                headers['Authorization'] = `Bearer ${config.authValue}`;
                break;
            case 'basic':
                headers['Authorization'] = `Basic ${btoa(config.authValue)}`;
                break;
            case 'apikey':
                headers['Authorization'] = `Bearer ${config.authValue}`;
                break;
            case 'custom':
                headers['Authorization'] = config.authValue;
                break;
        }
    }
    
    console.log('構建的headers:', headers);
    
    // 替換prompt變量
    const body = config.requestBody.replace(/\{\{prompt\}\}/g, testQuestion);
    
    console.log('原始body:', config.requestBody);
    console.log('替換後body:', body);
    
    return {
        method: config.httpMethod,
        url: url,
        headers: headers,
        body: body,
        transformResponse: config.transformResponse
    };
}

// 顯示測試成功結果
function displayTestSuccess(result, responseTime, transformResponse) {
    const testResult = document.getElementById('testResult');
    const apiResponse = document.getElementById('apiResponse');
    const transformedResult = document.getElementById('transformedResult');
    
    // 只顯示根據transformResponse處理後的內容
    if (transformResponse && result.transformedResponse !== null && result.transformedResponse !== undefined) {
        // 顯示處理後的結果
        apiResponse.textContent = result.transformedResponse;
        
        // 更新標籤
        const apiResponseLabel = document.querySelector('label[for="apiResponse"]');
        if (apiResponseLabel) apiResponseLabel.textContent = 'API回應';
    } else {
        // 如果沒有transform或transform失敗，顯示錯誤信息
        apiResponse.textContent = 'Transform處理失敗或未配置，請檢查transformResponse設定';
        
        const apiResponseLabel = document.querySelector('label[for="apiResponse"]');
        if (apiResponseLabel) apiResponseLabel.textContent = 'API回應';
    }
    
    // 隱藏原始回應區域
    transformedResult.style.display = 'none';
    
    // 更新請求詳情，添加響應時間
    const requestDetails = document.getElementById('requestDetails');
    requestDetails.innerHTML = `${requestDetails.textContent} <span class="badge bg-success ms-2">${responseTime}ms</span>`;
    
    testResult.style.display = 'block';
    showAlert('API測試成功！', 'success');
}

// 顯示測試錯誤
function displayTestError(errorMessage) {
    const testError = document.getElementById('testError');
    const errorMessageElement = document.getElementById('errorMessage');
    
    errorMessageElement.textContent = errorMessage;
    testError.style.display = 'block';
    showAlert('API測試失敗', 'error');
}

// 匯出API測試相關的函數供其他模組使用
window.APITest = {
    testAPI,
    collectAPIConfig,
    parseRawHttpRequest,
    buildAPIRequest,
    displayTestSuccess,
    displayTestError
};
