from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys
import time
import yaml
import json
import subprocess
import uuid
from pathlib import Path
import shutil
import csv
import io

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create Flask app
app = Flask(__name__)
CORS(app)  # 啟用跨域支援

# 確保必要的目錄存在
def ensure_directories():
    """確保必要的目錄存在"""
    directories = ['configs', 'results', 'temp']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)

# 初始化目錄
ensure_directories()

@app.route('/')
def index():
    """渲染主頁面"""
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康檢查"""
    return jsonify({
        'status': 'ok', 
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'platform': 'Python Flask'
    })

@app.route('/api/configs', methods=['GET'])
def get_configs():
    """獲取所有配置"""
    try:
        configs = []
        configs_dir = Path('configs')
        
        if configs_dir.exists():
            # 遍歷所有子目錄
            for config_dir in configs_dir.iterdir():
                if config_dir.is_dir():
                    config_file = config_dir / 'promptfooconfig.yaml'
                    if config_file.exists():
                        try:
                            with open(config_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                                config = yaml.safe_load(content)
                                
                                configs.append({
                                    'id': config_dir.name,
                                    'name': config.get('description', config_dir.name),
                                    'directory': config_dir.name,
                                    'filename': 'promptfooconfig.yaml',
                                    'content': content,
                                    'parsed': config,
                                    'hasProviders': bool(config.get('providers')),
                                    'hasDefaultTest': bool(config.get('defaultTest')),
                                    'hasAssert': bool(config.get('defaultTest', {}).get('assert') or config.get('assert')),
                                    'testCount': len(config.get('tests', []))
                                })
                        except Exception as e:
                            print(f"讀取配置檔案 {config_file} 失敗: {e}")
                            continue
        
        return jsonify(configs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/configs/<config_id>', methods=['GET'])
def get_config(config_id):
    """獲取特定配置"""
    try:
        config_dir = Path('configs') / config_id
        config_file = config_dir / 'promptfooconfig.yaml'
        
        print(f"嘗試讀取配置: {config_file}")
        print(f"配置文件是否存在: {config_file.exists()}")
        
        if not config_file.exists():
            print(f"配置文件不存在: {config_file}")
            return jsonify({'error': f'配置檔案不存在: {config_file}'}), 404
        
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
            config = yaml.safe_load(content)
        
        print(f"成功讀取配置: {config_id}")
        
        return jsonify({
            'id': config_id,
            'directory': config_id,
            'filename': 'promptfooconfig.yaml',
            'content': content,
            'parsed': config
        })
    except Exception as e:
        print(f"讀取配置錯誤: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/configs/<config_id>/check-files', methods=['GET'])
def check_config_files(config_id):
    """檢查配置相關檔案是否存在"""
    try:
        config_dir = Path('configs') / config_id
        config_file = config_dir / 'promptfooconfig.yaml'
        
        if not config_file.exists():
            return jsonify({'error': '配置檔案不存在'}), 404
        
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
            config = yaml.safe_load(content)
        
        # 檢查 tests 中提到的 CSV 檔案
        missing_files = []
        existing_files = []
        
        if 'tests' in config:
            for test_file in config['tests']:
                file_path = config_dir / test_file
                if file_path.exists():
                    existing_files.append(test_file)
                else:
                    missing_files.append(test_file)
        
        return jsonify({
            'config_id': config_id,
            'missing_files': missing_files,
            'existing_files': existing_files,
            'has_tests': 'tests' in config,
            'needs_upload': len(missing_files) > 0
        })
        
    except Exception as e:
        print(f"檢查檔案錯誤: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/configs', methods=['POST'])
def save_config():
    """保存配置"""
    try:
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        if not name:
            return jsonify({'error': '請提供配置名稱'}), 400
        
        # 驗證YAML格式
        try:
            yaml.safe_load(content)
        except yaml.YAMLError as e:
            return jsonify({'error': f'YAML格式錯誤: {str(e)}'}), 400
        
        # 生成配置ID - 保留中文名稱
        import re
        import time
        
        # 移除或替換檔案名中的無效字符，但保留中文字符
        config_id = re.sub(r'[<>:"/\\|?*]', '-', name)
        config_id = re.sub(r'-+', '-', config_id)  # 合併多個連字符
        config_id = config_id.strip('-')  # 移除首尾連字符
        
        # 如果清理後的名稱為空，使用預設名稱
        if not config_id:
            config_id = 'config'
        
        # 確保檔案名不會太長
        if len(config_id) > 50:
            config_id = config_id[:50]
        
        # 添加時間戳以避免重複
        timestamp = str(int(time.time()))[-6:]  # 取時間戳後6位
        config_id = f"{config_id}-{timestamp}"
        
        # 創建配置目錄
        config_dir = Path('configs') / config_id
        config_dir.mkdir(parents=True, exist_ok=True)
        
        # 在目錄下創建 promptfooconfig.yaml 檔案
        config_file_path = config_dir / 'promptfooconfig.yaml'
        
        # 保存檔案
        try:
            with open(config_file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 如果有上傳的檔案，保存到配置目錄
            if uploaded_file:
                import base64
                file_content = base64.b64decode(uploaded_file['content'])
                file_path = config_dir / uploaded_file['filename']
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                print(f"上傳檔案已保存: {file_path}")
            
            print(f"配置已保存: {config_file_path}")
            
            return jsonify({
                'id': config_id,
                'message': '配置已保存',
                'directory': config_id,
                'filename': 'promptfooconfig.yaml'
            })
        except OSError as e:
            print(f"檔案保存錯誤: {e}")
            return jsonify({'error': f'檔案保存失敗: {str(e)}'}), 500
        
    except Exception as e:
        print(f"配置保存錯誤: {e}")
        return jsonify({'error': f'配置保存失敗: {str(e)}'}), 500

@app.route('/api/configs/<config_id>', methods=['PUT'])
def update_config(config_id):
    """更新配置"""
    try:
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        if not name:
            return jsonify({'error': '請提供配置名稱'}), 400
        
        # 驗證YAML格式
        try:
            yaml.safe_load(content)
        except yaml.YAMLError as e:
            return jsonify({'error': f'YAML格式錯誤: {str(e)}'}), 400
        
        # 找到配置目錄
        config_dir = Path('configs') / config_id
        if not config_dir.exists():
            return jsonify({'error': '配置不存在'}), 404
        
        # 更新 promptfooconfig.yaml 檔案
        config_file_path = config_dir / 'promptfooconfig.yaml'
        
        try:
            with open(config_file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 處理檔案上傳
            if uploaded_file:
                import base64
                file_content = base64.b64decode(uploaded_file['content'])
                file_path = config_dir / uploaded_file['filename']
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                print(f"上傳檔案已更新: {file_path}")
            
            return jsonify({
                'id': config_id,
                'message': '配置已更新',
                'directory': config_id,
                'filename': 'promptfooconfig.yaml'
            })
        except OSError as e:
            return jsonify({'error': f'檔案更新失敗: {str(e)}'}), 500
        
    except Exception as e:
        print(f"配置更新錯誤: {e}")
        return jsonify({'error': f'配置更新失敗: {str(e)}'}), 500

@app.route('/api/configs/<config_id>', methods=['DELETE'])
def delete_config(config_id):
    """刪除配置"""
    try:
        import shutil
        
        # 找到配置目錄
        config_dir = Path('configs') / config_id
        if not config_dir.exists():
            return jsonify({'error': '配置不存在'}), 404
        
        # 刪除整個目錄
        shutil.rmtree(config_dir)
        
        return jsonify({'message': '配置已刪除'})
        
    except Exception as e:
        print(f"配置刪除錯誤: {e}")
        return jsonify({'error': f'配置刪除失敗: {str(e)}'}), 500

@app.route('/api/configs/<config_id>/run', methods=['POST'])
def run_config(config_id):
    """執行配置"""
    try:
        import subprocess
        import os
        
        # 找到配置目錄
        config_dir = Path('configs') / config_id
        if not config_dir.exists():
            return jsonify({'error': '配置不存在'}), 404
        
        # 檢查 promptfooconfig.yaml 是否存在
        config_file = config_dir / 'promptfooconfig.yaml'
        if not config_file.exists():
            return jsonify({'error': '配置檔案不存在'}), 404
        
        print(f"開始執行配置: {config_id}")
        print(f"配置目錄: {config_dir}")
        
        # 在配置目錄中執行 promptfoo eval
        try:
            result = subprocess.run(
                'promptfoo eval',
                cwd=str(config_dir),
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=300  # 5分鐘超時
            )
            
            if result.returncode == 0:
                return jsonify({
                    'message': '配置執行成功',
                    'output': result.stdout,
                    'config_id': config_id
                })
            else:
                return jsonify({
                    'error': '配置執行失敗',
                    'output': result.stdout,
                    'error_output': result.stderr,
                    'return_code': result.returncode
                }), 500
                
        except subprocess.TimeoutExpired:
            return jsonify({'error': '配置執行超時（5分鐘）'}), 500
        except FileNotFoundError:
            return jsonify({'error': '找不到 promptfoo 命令，請確保已安裝 promptfoo'}), 500
        
    except Exception as e:
        print(f"配置執行錯誤: {e}")
        return jsonify({'error': f'配置執行失敗: {str(e)}'}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """執行評測"""
    try:
        data = request.json
        config_id = data.get('configId', '')
        
        print(f"開始評測 - 配置ID: {config_id}")
        
        evaluation_id = str(uuid.uuid4())
        
        # 使用配置目錄
        config_dir = Path('configs') / config_id
        config_file = config_dir / 'promptfooconfig.yaml'
        
        if not config_file.exists():
            return jsonify({'error': f'配置檔案不存在: {config_file}'}), 404
        
        print(f"使用配置目錄: {config_dir}")
        print(f"配置文件: {config_file}")
        
        # 創建結果目錄
        result_dir = Path('results') / evaluation_id
        result_dir.mkdir(exist_ok=True)
        
        # 執行promptfoo eval（在配置目錄中執行）
        result_file = result_dir / 'results.json'
        command = [
            'promptfoo', 'eval',
            '--output', str(result_file)
        ]
        
        print(f"執行命令: {' '.join(command)}")
        print(f"工作目錄: {config_dir}")
        
        # 執行命令（在配置目錄中執行）
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=300,  # 5分鐘超時
            cwd=str(config_dir)  # 在配置目錄中執行
        )
        
        # 讀取結果
        results = None
        if result_file.exists():
            with open(result_file, 'r', encoding='utf-8') as f:
                results = json.load(f)
        
        # 清理工作目錄
        if eval_work_dir.exists():
            import shutil
            shutil.rmtree(eval_work_dir)
            print(f"已清理工作目錄: {eval_work_dir}")
        
        return jsonify({
            'evaluationId': evaluation_id,
            'status': 'completed',
            'results': results,
            'stdout': process.stdout,
            'stderr': process.stderr,
            'returncode': process.returncode
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': '評測執行超時'}), 500
    except Exception as e:
        print(f"評測執行錯誤: {e}")
        return jsonify({'error': f'評測執行失敗: {str(e)}'}), 500

@app.route('/api/results/<evaluation_id>', methods=['GET'])
def get_result(evaluation_id):
    """獲取評測結果"""
    try:
        result_path = Path('results') / evaluation_id / 'results.json'
        
        if not result_path.exists():
            return jsonify({'error': '評測結果不存在'}), 404
        
        with open(result_path, 'r', encoding='utf-8') as f:
            results = json.load(f)
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    """獲取所有評測結果"""
    try:
        evaluations = []
        results_dir = Path('results')
        
        if results_dir.exists():
            for result_dir in results_dir.iterdir():
                if result_dir.is_dir():
                    result_file = result_dir / 'results.json'
                    if result_file.exists():
                        try:
                            with open(result_file, 'r', encoding='utf-8') as f:
                                results = json.load(f)
                            
                            # 計算統計數據
                            total_tests = len(results.get('results', []))
                            scores = [r.get('score', 0) for r in results.get('results', []) if r.get('score', 0) > 0]
                            average_score = sum(scores) / len(scores) if scores else 0
                            
                            evaluations.append({
                                'id': result_dir.name,
                                'timestamp': results.get('timestamp', time.strftime('%Y-%m-%d %H:%M:%S')),
                                'summary': {
                                    'totalTests': total_tests,
                                    'averageScore': round(average_score, 2)
                                }
                            })
                        except Exception as e:
                            print(f"讀取結果檔案 {result_file} 失敗: {e}")
                            continue
        
        # 按時間排序
        evaluations.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(evaluations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assert-templates', methods=['GET'])
def get_assert_templates():
    """獲取Assert指標模板"""
    templates = [
        {
            'id': 'g-eval',
            'name': 'G-Eval 評分',
            'description': '使用LLM進行評分',
            'template': {
                'type': 'g-eval',
                'value': [
                    '評分標準1',
                    '評分標準2'
                ]
            }
        },
        {
            'id': 'javascript',
            'name': 'JavaScript 驗證',
            'description': '使用JavaScript表達式驗證',
            'template': {
                'type': 'javascript',
                'value': 'output.length >= 100'
            }
        },
        {
            'id': 'contains',
            'name': '包含檢查',
            'description': '檢查輸出是否包含特定內容',
            'template': {
                'type': 'contains',
                'value': 'expected text'
            }
        },
        {
            'id': 'not-contains',
            'name': '不包含檢查',
            'description': '檢查輸出不包含特定內容',
            'template': {
                'type': 'not-contains',
                'value': 'unwanted text'
            }
        },
        {
            'id': 'regex',
            'name': '正則表達式',
            'description': '使用正則表達式驗證',
            'template': {
                'type': 'regex',
                'value': '^[A-Z].*$'
            }
        },
        {
            'id': 'similar',
            'name': '相似度檢查',
            'description': '檢查與期望輸出的相似度',
            'template': {
                'type': 'similar',
                'value': 'expected output',
                'threshold': 0.8
            }
        }
    ]
    return jsonify(templates)

@app.route('/api/validate-config', methods=['POST'])
def validate_config():
    """驗證配置"""
    try:
        data = request.json
        content = data.get('content', '')
        
        # 驗證YAML格式
        try:
            parsed = yaml.safe_load(content)
        except yaml.YAMLError as e:
            return jsonify({
                'valid': False,
                'error': f'YAML格式錯誤: {str(e)}'
            }), 400
        
        validation = {
            'valid': True,
            'warnings': [],
            'errors': []
        }
        
        # 檢查必要欄位
        if not parsed.get('description'):
            validation['warnings'].append('缺少描述 (description)')
        
        if not parsed.get('providers') and not parsed.get('defaultTest'):
            validation['errors'].append('必須定義 providers 或 defaultTest')
            validation['valid'] = False
        
        if not parsed.get('tests') and not parsed.get('prompts'):
            validation['warnings'].append('建議定義測試問題 (tests 或 prompts)')
        
        # 檢查providers配置
        if parsed.get('providers'):
            for i, provider in enumerate(parsed['providers']):
                if not provider.get('id'):
                    validation['errors'].append(f'Provider {i + 1} 缺少 id')
                    validation['valid'] = False
                if not provider.get('config', {}).get('url'):
                    validation['errors'].append(f'Provider {i + 1} 缺少 URL')
                    validation['valid'] = False
        
        # 檢查defaultTest配置
        if parsed.get('defaultTest'):
            if (parsed['defaultTest'].get('options', {}).get('provider') and 
                not parsed['defaultTest']['options']['provider'].get('config', {}).get('url')):
                validation['errors'].append('defaultTest.provider 缺少 URL')
                validation['valid'] = False
        
        return jsonify(validation)
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': f'驗證失敗: {str(e)}'
        }), 500

# 檔案上傳處理

# 靜態檔案服務
@app.route('/static/<path:filename>')
def serve_static(filename):
    """提供靜態檔案"""
    return app.send_static_file(filename)

if __name__ == '__main__':
    print("🚀 啟動LLM評測平台...")
    print("📊 平台功能:")
    print("   - 配置管理")
    print("   - 評測執行")
    print("   - 結果分析")
    print("   - Assert指標管理")
    print("🌐 訪問地址: http://localhost:5500")
    print("📝 請確保已安裝 promptfoo: pip install promptfoo")
    
    app.run(debug=True, host='0.0.0.0', port=5500)
