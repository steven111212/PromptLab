"""配置執行服務"""
import subprocess
import os
from pathlib import Path


class ExecutionService:
    """配置執行相關服務"""
    
    def run_config(self, config_id):
        """執行配置"""
        try:
            # 找到配置目錄
            config_dir = Path('configs') / config_id
            if not config_dir.exists():
                return {'error': '配置不存在'}, 404
            
            # 檢查 promptfooconfig.yaml 是否存在
            config_file = config_dir / 'promptfooconfig.yaml'
            if not config_file.exists():
                return {'error': '配置檔案不存在'}, 404
            
            print(f"開始執行配置: {config_id}")
            print(f"配置目錄: {config_dir}")
            
            # 在配置目錄中執行 promptfoo eval
            try:
                # 構建完整的命令
                if os.name == 'nt':
                    # Windows: 嘗試多個可能的 conda 安裝位置
                    possible_paths = [
                        os.path.join(os.environ.get('USERPROFILE', ''), 'anaconda3', 'Scripts', 'activate.bat'),
                        os.path.join(os.environ.get('USERPROFILE', ''), 'miniconda3', 'Scripts', 'activate.bat'),
                        os.path.join(os.environ.get('LOCALAPPDATA', ''), 'anaconda3', 'Scripts', 'activate.bat'),
                        os.path.join(os.environ.get('LOCALAPPDATA', ''), 'miniconda3', 'Scripts', 'activate.bat'),
                        os.path.join(os.environ.get('PROGRAMFILES', ''), 'anaconda3', 'Scripts', 'activate.bat'),
                        os.path.join(os.environ.get('PROGRAMFILES', ''), 'miniconda3', 'Scripts', 'activate.bat'),
                        # 如果有設置 CONDA_BAT 環境變數
                        os.environ.get('CONDA_BAT', '')
                    ]
                    
                    conda_path = None
                    for path in possible_paths:
                        if path and os.path.exists(path):
                            conda_path = path
                            break
                    
                    if not conda_path:
                        print("嘗試過的路徑:")
                        for path in possible_paths:
                            print(f"- {path}")
                        return {'error': '找不到 Conda 執行檔，請確保已安裝 Anaconda 或 Miniconda'}, 500
                    
                    print(f"找到 conda 執行檔: {conda_path}")
                    
                    # 構建完整命令
                    activate_cmd = f'"{conda_path}" activate LLM'
                    eval_cmd = f'cmd /c "{activate_cmd} && promptfoo eval"'
                    
                    print(f"執行命令: {eval_cmd}")
                    
                    # 設定環境變數
                    env = os.environ.copy()
                    env['PROMPTFOO_DISABLE_JSON_AUTOESCAPE'] = 'true'
                    
                    result = subprocess.run(
                        eval_cmd,
                        cwd=str(config_dir),
                        shell=True,
                        capture_output=True,
                        text=True,
                        encoding='utf-8',
                        errors='replace',
                        timeout=300,  # 5分鐘超時
                        env=env  # 傳遞環境變數
                    )
                else:
                    # Linux/Mac
                    eval_cmd = 'conda activate LLM && promptfoo eval'
                    result = subprocess.run(
                        eval_cmd,
                        cwd=str(config_dir),
                        shell=True,
                        capture_output=True,
                        text=True,
                        encoding='utf-8',
                        errors='replace',
                        timeout=300,  # 5分鐘超時
                        executable='/bin/bash'
                    )
                
                print(f"命令輸出: {result.stdout}")
                print(f"錯誤輸出: {result.stderr}")
                print(f"返回碼: {result.returncode}")
                
                # 檢查是否成功執行（即使有測試失敗，只要沒有嚴重錯誤就算成功）
                # 檢查多個可能的成功標誌
                success_indicators = [
                    "Evaluation complete",
                    "Done",
                    "Writing output",
                    "Writing results",
                    "✓",
                    "Success"
                ]
                
                # 檢查是否有任何成功標誌
                has_success_indicator = any(indicator in result.stdout or indicator in result.stderr 
                                          for indicator in success_indicators)
                
                # 檢查是否有嚴重錯誤
                critical_errors = [
                    "Error: Cannot find module",
                    "Command not found",
                    "SyntaxError",
                    "Fatal error",
                    "ENOENT"
                ]
                
                has_critical_error = any(error in result.stderr or error in result.stdout 
                                       for error in critical_errors)
                
                # 判斷成功條件：返回碼為0，或有成功標誌且沒有嚴重錯誤
                if result.returncode == 0 or (has_success_indicator and not has_critical_error):
                    return {
                        'message': '配置執行成功',
                        'output': result.stdout,
                        'config_id': config_id,
                        'return_code': result.returncode
                    }, 200
                else:
                    return {
                        'error': '配置執行失敗',
                        'output': result.stdout,
                        'error_output': result.stderr,
                        'return_code': result.returncode
                    }, 500
                    
            except subprocess.TimeoutExpired:
                return {'error': '配置執行超時（5分鐘）'}, 500
            except FileNotFoundError:
                return {'error': '找不到 promptfoo 命令，請確保已安裝 promptfoo'}, 500
            
        except Exception as e:
            print(f"配置執行錯誤: {e}")
            return {'error': f'配置執行失敗: {str(e)}'}, 500
