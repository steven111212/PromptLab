// 評估 API 管理模組
// 處理所有與後端 API 的交互

class EvaluationAPI {
    // 獲取評估結果列表
    static async getResults() {
        try {
            const response = await fetch('/api/evaluation-results');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取評估結果失敗:', error);
            throw new Error(`獲取評估結果失敗: ${error.message}`);
        }
    }

    // 獲取評估詳細結果
    static async getDetail(evalId) {
        try {
            const response = await fetch(`/api/evaluation-results/${encodeURIComponent(evalId)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取評估詳情失敗:', error);
            throw new Error(`獲取評估詳情失敗: ${error.message}`);
        }
    }

    // 開始新的評估
    static async startEvaluation(type, config = {}) {
        try {
            const response = await fetch('/api/start-evaluation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    config: config
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('開始評估失敗:', error);
            throw new Error(`開始評估失敗: ${error.message}`);
        }
    }

    // 獲取評估狀態
    static async getEvaluationStatus(evalId) {
        try {
            const response = await fetch(`/api/evaluation-status/${encodeURIComponent(evalId)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取評估狀態失敗:', error);
            throw new Error(`獲取評估狀態失敗: ${error.message}`);
        }
    }

    // 刪除評估結果
    static async deleteResult(evalId) {
        try {
            const response = await fetch(`/api/evaluation-results/${encodeURIComponent(evalId)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('刪除評估結果失敗:', error);
            throw new Error(`刪除評估結果失敗: ${error.message}`);
        }
    }

    // 導出評估結果
    static async exportResult(evalId, format = 'json') {
        try {
            const response = await fetch(`/api/export-result/${encodeURIComponent(evalId)}?format=${format}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 根據格式處理響應
            if (format === 'csv') {
                const blob = await response.blob();
                return blob;
            } else {
                return await response.json();
            }
        } catch (error) {
            console.error('導出評估結果失敗:', error);
            throw new Error(`導出評估結果失敗: ${error.message}`);
        }
    }

    // 獲取配置列表
    static async getConfigs() {
        try {
            const response = await fetch('/api/configs');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('獲取配置列表失敗:', error);
            throw new Error(`獲取配置列表失敗: ${error.message}`);
        }
    }

    // 保存配置
    static async saveConfig(configName, configData) {
        try {
            const response = await fetch('/api/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: configName,
                    data: configData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('保存配置失敗:', error);
            throw new Error(`保存配置失敗: ${error.message}`);
        }
    }

    // 加載配置
    static async loadConfig(configName) {
        try {
            const response = await fetch(`/api/configs/${encodeURIComponent(configName)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('加載配置失敗:', error);
            throw new Error(`加載配置失敗: ${error.message}`);
        }
    }
}

// 導出到全局作用域
window.EvaluationAPI = EvaluationAPI;
