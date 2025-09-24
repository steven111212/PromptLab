// 配置表單步驟管理模組
// 負責多步驟表單的導航和進度管理

// 下一步
function nextStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果進入步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && ConfigManager.selectedConfig() && ConfigManager.selectedConfig().content) {
        showCurrentTestInfo(ConfigManager.selectedConfig().content);
    }
}

// 上一步
function prevStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果回到步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && ConfigManager.selectedConfig() && ConfigManager.selectedConfig().content) {
        showCurrentTestInfo(ConfigManager.selectedConfig().content);
    }
}

// 更新進度步驟
function updateProgressSteps(activeStep) {
    // 移除所有步驟的 active 類別
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 為當前步驟和之前的步驟添加 active 類別
    for (let i = 1; i <= activeStep; i++) {
        const step = document.querySelector(`[data-step="${i}"]`);
        if (step) {
            step.classList.add('active');
        }
    }
}

// 跳轉到指定步驟
function jumpToStep(stepNumber) {
    // 隱藏當前步驟
    const currentStep = document.querySelector('.form-step[style*="display: block"]');
    if (currentStep) {
        currentStep.style.display = 'none';
    }
    
    // 顯示目標步驟
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // 更新進度指示器
    updateProgressSteps(stepNumber);
    
    // 如果跳轉到步驟3且有配置數據，重新顯示測試問題信息
    if (stepNumber === 3 && ConfigManager.selectedConfig() && ConfigManager.selectedConfig().content) {
        showCurrentTestInfo(ConfigManager.selectedConfig().content);
    }
}
