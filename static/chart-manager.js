// 圖表管理模組
// 處理主頁面的統計圖表功能

class ChartManager {
    static currentChart = null;
    static currentData = null;

    // 初始化圖表
    static initializeChart(detail) {
        this.currentData = detail;
        this.createChartByType('assertions', detail);
    }

    // 切換圖表類型
    static switchType(evalId, type) {
        if (this.currentData) {
            this.createChartByType(type, this.currentData);
        }
    }

    // 根據類型創建圖表
    static createChartByType(type, detail) {
        const ctx = document.getElementById('combinedChart');
        if (!ctx) return;
        
        // 檢查 Chart.js 是否可用
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 未載入');
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('Chart.js 載入失敗', 50, 100);
            return;
        }

        // 銷毀舊圖表
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }

        switch (type) {
            case 'assertions':
                this.createAssertionsChart(detail);
                break;
            case 'latency':
                this.createLatencyChart(detail);
                break;
            case 'passing':
                this.createPassingRateChart(detail);
                break;
            default:
                this.createAssertionsChart(detail);
        }
    }

    // 創建 Assertions 圖表
    static createAssertionsChart(detail) {
        const ctx = document.getElementById('combinedChart');
        
        // 收集 assertions 數據，精確區分不同指標
        const assertionTypes = {};
        detail.details.forEach(test => {
            if (test.assertions && test.assertions.length > 0) {
                test.assertions.forEach(assertion => {
                    let displayName = assertion.type || 'unknown';
                    
                    // 對於 python 類型，根據 value 區分不同指標
                    if (assertion.type === 'python' && assertion.value) {
                        if (assertion.value.includes('bert_f1')) {
                            displayName = 'BERTScore F1';
                        } else if (assertion.value.includes('bert_recall')) {
                            displayName = 'BERTScore Recall';
                        } else if (assertion.value.includes('bert_precision')) {
                            displayName = 'BERTScore Precision';
                        } else {
                            displayName = 'Python評估';
                        }
                    }
                    
                    // 對於 g-eval 類型，根據內容進一步區分
                    if (assertion.type === 'g-eval' && assertion.value) {
                        if (assertion.value.length > 50) {
                            if (assertion.value.includes('台電') || assertion.value.includes('服務相關')) {
                                displayName = 'G-Eval (服務相關性)';
                            } else if (assertion.value.includes('無關') || assertion.value.includes('問題')) {
                                displayName = 'G-Eval (問題相關性)';
                            } else {
                                displayName = 'G-Eval';
                            }
                        } else {
                            displayName = 'G-Eval';
                        }
                    }
                    
                    if (!assertionTypes[displayName]) {
                        assertionTypes[displayName] = { pass: 0, fail: 0 };
                    }
                    if (assertion.pass) {
                        assertionTypes[displayName].pass++;
                    } else {
                        assertionTypes[displayName].fail++;
                    }
                });
            }
        });

        const labels = Object.keys(assertionTypes);
        if (labels.length === 0) {
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Assertions 數據', 50, 100);
            return;
        }

        const passData = labels.map(label => assertionTypes[label].pass);
        const failData = labels.map(label => assertionTypes[label].fail);

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pass',
                        data: passData,
                        backgroundColor: '#28a745',
                        borderColor: '#1e7e34',
                        borderWidth: 1
                    },
                    {
                        label: 'Fail',
                        data: failData,
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: '數量' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Assertions 通過/失敗統計'
                    }
                }
            }
        });
    }

    // 創建 Latency 圖表
    static createLatencyChart(detail) {
        const ctx = document.getElementById('combinedChart');
        
        // 收集延遲數據
        const latencies = detail.details
            .filter(test => test.latency && test.latency > 0)
            .map(test => test.latency);

        if (latencies.length === 0) {
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Latency 數據', 50, 100);
            return;
        }

        // 創建延遲分佈直方圖
        const bins = 5;
        const min = Math.min(...latencies);
        const max = Math.max(...latencies);
        const binSize = (max - min) / bins;
        
        const latencyBins = new Array(bins).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < bins; i++) {
            const start = Math.round(min + i * binSize);
            const end = Math.round(min + (i + 1) * binSize);
            binLabels.push(`${start}-${end}ms`);
        }
        
        latencies.forEach(latency => {
            const binIndex = Math.min(Math.floor((latency - min) / binSize), bins - 1);
            latencyBins[binIndex]++;
        });

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: '測試數量',
                    data: latencyBins,
                    backgroundColor: '#17a2b8',
                    borderColor: '#138496',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: '測試數量' }
                    },
                    x: {
                        title: { display: true, text: 'Latency (ms)' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Latency 分佈 (${latencies.length} 個測試)`
                    },
                    legend: { display: false }
                }
            }
        });
    }

    // 創建 Passing Rate 分佈圖表
    static createPassingRateChart(detail) {
        const ctx = document.getElementById('combinedChart');
        
        // 計算每個測試的通過率
        const passingRates = [];
        detail.details.forEach(test => {
            if (test.assertions && test.assertions.length > 0) {
                const passCount = test.assertions.filter(a => a.pass).length;
                const totalCount = test.assertions.length;
                const rate = (passCount / totalCount) * 100;
                passingRates.push(rate);
            } else {
                // 如果沒有 assertions，根據 success 判斷
                passingRates.push(test.success ? 100 : 0);
            }
        });

        if (passingRates.length === 0) {
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Passing Rate 數據', 50, 100);
            return;
        }

        // 創建通過率分佈
        const rateBins = [0, 0, 0, 0, 0]; // 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
        const rateLabels = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
        
        passingRates.forEach(rate => {
            if (rate <= 20) rateBins[0]++;
            else if (rate <= 40) rateBins[1]++;
            else if (rate <= 60) rateBins[2]++;
            else if (rate <= 80) rateBins[3]++;
            else rateBins[4]++;
        });

        this.currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: rateLabels,
                datasets: [{
                    data: rateBins,
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'],
                    borderColor: ['#c82333', '#e8590c', '#e0a800', '#1aa179', '#1e7e34'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Passing Rate 分佈 (${passingRates.length} 個測試)`
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 銷毀當前圖表
    static destroy() {
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        this.currentData = null;
    }
}

// 導出到全局作用域
window.ChartManager = ChartManager;
