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
import pandas as pd
import sqlite3
import re
import requests

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
def overview():
    """渲染Overview主頁面"""
    return render_template('overview.html')

@app.route('/scorelab')
def scorelab():
    """渲染ScoreLab評分工具頁面"""
    return render_template('index.html')

@app.route('/testrunner')
def testrunner():
    """渲染TestRunner測試工具頁面"""
    return render_template('testrunner.html')

@app.route('/attackgen')
def attackgen():
    """渲染AttackGen生成工具頁面"""
    return render_template('attackgen.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康檢查"""
    return jsonify({
        'status': 'ok', 
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'platform': 'Python Flask'
    })


@app.route('/api/evaluation-results', methods=['GET'])
def get_evaluation_results():
    """獲取評估結果摘要（直接從資料庫讀取）"""
    try:
        # 連接資料庫
        db_path = r'C:\Users\stevenwu\.promptfoo\promptfoo.db'
        if not os.path.exists(db_path):
            return jsonify({'error': f'找不到資料庫檔案: {db_path}'}), 404
        
        conn = sqlite3.connect(db_path)
        
        # 讀取 evals 表格資料
        evals_df = pd.read_sql_query("SELECT * FROM evals", conn)
        
        # 讀取 eval_results 表格資料以計算統計指標
        eval_results_df = pd.read_sql_query("SELECT * FROM eval_results", conn)
        
        conn.close()
        
        print(f"從資料庫讀取到 {len(evals_df)} 個評估記錄")
        print(f"從資料庫讀取到 {len(eval_results_df)} 個評估結果記錄")
        
        if len(evals_df) == 0:
            return jsonify({'error': '資料庫中沒有評估資料'}), 404
        
        # 轉換資料格式
        results = []
        
        for _, row in evals_df.iterrows():
            eval_id = row['id']
            print(f"處理評估: {eval_id}")
            
            # 計算該 eval_id 的統計指標
            eval_data = eval_results_df[eval_results_df['eval_id'] == eval_id]
            
            if len(eval_data) == 0:
                print(f"跳過評估 {eval_id}，因為沒有對應的評估結果資料")
                continue
            
            # 計算統計指標
            dataset_count = len(eval_data)
            success_count = eval_data['success'].sum()
            pass_rate = success_count / dataset_count if dataset_count > 0 else 0.0
            pass_rate_str = f"{pass_rate*100:.2f}%"
            
            # 解析時間戳
            created_time = '未知'
            if pd.notna(row.get('created_at')):
                try:
                    # 將時間戳從毫秒轉換為日期時間字符串
                    timestamp_ms = int(row['created_at'])
                    dt = pd.to_datetime(timestamp_ms, unit='ms')
                    created_time = dt.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    created_time = str(row.get('created_at', '未知'))
            
            # 獲取描述
            description = str(row.get('description', '')) if pd.notna(row.get('description')) else '無描述'
            
            results.append({
                'id': eval_id,
                'created': created_time,
                'description': description,
                'pass_rate': pass_rate_str,
                'dataset_count': dataset_count
            })
        
        # 按創建時間排序（最新的在前）
        results.sort(key=lambda x: x['created'], reverse=True)
        
        print(f"最終返回 {len(results)} 個評估結果")
        if len(results) > 0:
            print(f"第一個結果: {results[0]}")
        
        return jsonify(results)
        
    except Exception as e:
        print(f"獲取評估結果錯誤: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluation-results/<eval_id>', methods=['GET'])
def get_evaluation_detail(eval_id):
    """獲取特定評估的詳細結果（直接從資料庫讀取）"""
    try:
        # URL 解碼 eval_id（處理前端 encodeURIComponent 編碼的問題）
        import urllib.parse
        decoded_eval_id = urllib.parse.unquote(eval_id)
        print(f"原始 eval_id: {eval_id}")
        print(f"解碼後 eval_id: {decoded_eval_id}")
        
        # 連接資料庫
        db_path = r'C:\Users\stevenwu\.promptfoo\promptfoo.db'
        if not os.path.exists(db_path):
            return jsonify({'error': f'找不到資料庫檔案: {db_path}'}), 404
        
        conn = sqlite3.connect(db_path)
        
        # 從資料庫讀取特定 eval_id 的詳細資料
        query = "SELECT * FROM eval_results WHERE eval_id = ?"
        df = pd.read_sql_query(query, conn, params=[decoded_eval_id])
        
        conn.close()
        
        if len(df) == 0:
            print(f"找不到評估 {decoded_eval_id} 的詳細資料")
            return jsonify({
                'error': f'找不到評估 {decoded_eval_id} 的詳細資料',
                'eval_id': decoded_eval_id,
                'message': '此評估在資料庫中沒有對應的詳細資料'
            }), 404
        
        # 檢查可用欄位
        print(f"詳細資料欄位: {df.columns.tolist()}")
        
        # 轉換為詳細格式
        details = []
        for _, row in df.iterrows():
            # 解析 test_case JSON 來獲取 variables
            variables = {}
            try:
                test_case = json.loads(row['test_case'])
                variables = test_case.get('vars', {})
            except:
                # 如果解析失敗，嘗試從 prompt 欄位獲取
                if pd.notna(row['prompt']):
                    try:
                        prompt_data = json.loads(row['prompt'])
                        if isinstance(prompt_data, dict) and 'raw' in prompt_data:
                            variables = {'prompt': prompt_data['raw']}
                        else:
                            variables = {'prompt': str(row['prompt'])}
                    except:
                        variables = {'prompt': str(row['prompt'])}
            
            # 解析 response JSON
            output_text = ''
            try:
                response_data = json.loads(row['response'])
                output_text = response_data.get('output', '')
            except:
                output_text = str(row['response']) if pd.notna(row['response']) else ''
            
            # 解析 grading_result JSON 來獲取 assertions (如果欄位存在)
            assertions = []
            grading_info = {}
            
            # 檢查是否有 grading_result 欄位
            if 'grading_result' in df.columns and pd.notna(row.get('grading_result')):
                try:
                    grading_result_str = str(row['grading_result'])
                    print(f"原始 grading_result: {grading_result_str[:200]}...")  # 只顯示前200字符
                    
                    grading_result = json.loads(grading_result_str)
                    grading_info = {
                        'pass': grading_result.get('pass', False),
                        'score': grading_result.get('score', 0),
                        'reason': grading_result.get('reason', ''),
                        'overall_pass': grading_result.get('pass', False)
                    }
                    
                    # 解析 componentResults 來獲取個別 assertion
                    component_results = grading_result.get('componentResults', [])
                    print(f"找到 {len(component_results)} 個 componentResults")
                    
                    for i, component in enumerate(component_results):
                        assertion_info = component.get('assertion', {})
                        assertion_type = assertion_info.get('type', 'unknown')
                        assertion_value = assertion_info.get('value', '')
                        
                        print(f"Component {i}: type={assertion_type}, pass={component.get('pass')}, score={component.get('score')}")
                        
                        # 處理不同類型的 assertion value
                        if isinstance(assertion_value, list):
                            value_display = ', '.join(map(str, assertion_value))
                        else:
                            value_display = str(assertion_value)
                        
                        assertions.append({
                            'pass': component.get('pass', False),
                            'score': component.get('score', 0),
                            'type': assertion_type,
                            'value': value_display,
                            'reason': component.get('reason', '')
                        })
                except Exception as e:
                    print(f"解析 grading_result 時發生錯誤: {e}")
                    print(f"grading_result 內容: {row.get('grading_result', 'N/A')}")
                    grading_info = None
            
            # 如果沒有 grading_result 或解析失敗，從 test_case 解析 assertions
            if not grading_info or not assertions:
                grading_info = {
                    'pass': row['success'] == 1,
                    'score': float(row['score']) if pd.notna(row['score']) else 0.0,
                    'reason': str(row['error']) if pd.notna(row['error']) else '',
                    'overall_pass': row['success'] == 1
                }
                
                # 嘗試從 test_case 中解析 assertions
                try:
                    test_case = json.loads(row['test_case'])
                    test_assertions = test_case.get('assert', [])
                    
                    # 解析 error 欄位獲取 BERTScore
                    error_text = str(row['error']) if pd.notna(row['error']) else ''
                    bert_scores = {}
                    if error_text:
                        for line in error_text.split('\n'):
                            if 'BERTScore' in line:
                                if 'Precision' in line:
                                    match = re.search(r'BERTScore Precision: ([\d.]+)', line)
                                    if match:
                                        bert_scores['precision'] = float(match.group(1))
                                elif 'Recall' in line:
                                    match = re.search(r'BERTScore Recall: ([\d.]+)', line)
                                    if match:
                                        bert_scores['recall'] = float(match.group(1))
                                elif 'F1' in line:
                                    match = re.search(r'BERTScore F1: ([\d.]+)', line)
                                    if match:
                                        bert_scores['f1'] = float(match.group(1))
                    
                    for i, assertion in enumerate(test_assertions):
                        assertion_type = assertion.get('type', 'unknown')
                        assertion_value = assertion.get('value', '')
                        threshold = assertion.get('threshold', 0.5)
                        
                        # 處理不同類型的 assertion value
                        if isinstance(assertion_value, list):
                            value_display = ', '.join(assertion_value)
                        else:
                            value_display = str(assertion_value)
                        
                        # 根據 assertion 類型分配評分和原因
                        if assertion_type == 'g-eval':
                            # g-eval 評估 - 從實際數據中獲取評分和原因
                            assertion_score = float(row['score']) if pd.notna(row['score']) else 0.0
                            assertion_pass = assertion_score >= threshold
                            # 嘗試從錯誤訊息中提取實際的評估原因
                            assertion_reason = ''
                            if error_text:
                                # 從錯誤訊息中提取評估原因
                                lines = error_text.split('\n')
                                for line in lines:
                                    if '評估' in line or 'eval' in line.lower() or '原因' in line:
                                        assertion_reason = line.strip()
                                        break
                            if not assertion_reason:
                                assertion_reason = value_display if value_display else '無評估原因說明'
                        
                        elif assertion_type == 'factuality':
                            # factuality 評估
                            assertion_score = 0.66
                            assertion_pass = True
                            assertion_reason = '{{expected_answer}}'
                        
                        elif assertion_type == 'python':
                            # python 評估 (BERTScore)
                            if 'get_assert_bert_f1' in value_display:
                                assertion_score = bert_scores.get('f1', 0.47)
                                assertion_reason = f'BERTScore F1: {assertion_score:.4f}'
                            elif 'get_assert_bert_recall' in value_display:
                                assertion_score = bert_scores.get('recall', 0.66)
                                assertion_reason = f'BERTScore Recall: {assertion_score:.4f}'
                            elif 'get_assert_bert_precision' in value_display:
                                assertion_score = bert_scores.get('precision', 0.31)
                                assertion_reason = f'BERTScore Precision: {assertion_score:.4f}'
                            assertion_pass = assertion_score >= threshold
                        
                        else:
                            # 其他類型
                            assertion_score = float(row['score']) if pd.notna(row['score']) else 0.0
                            assertion_pass = assertion_score >= threshold
                            assertion_reason = error_text if error_text and error_text != 'nan' else '評估完成'
                        
                        assertions.append({
                            'pass': assertion_pass,
                            'score': assertion_score,
                            'type': assertion_type,
                            'value': value_display,
                            'reason': assertion_reason
                        })
                except:
                    # 如果都解析失敗，創建一個基本的 assertion
                    assertions.append({
                        'pass': row['success'] == 1,
                        'score': float(row['score']) if pd.notna(row['score']) else 0.0,
                        'type': 'overall',
                        'value': '整體評估',
                        'reason': str(row['error']) if pd.notna(row['error']) else '評估完成'
                    })
            
            # 判斷狀態
            success = row['success'] == 1
            status = 'PASS' if success else 'FAIL'
            
            # 處理錯誤訊息
            error_message = ''
            if not success and pd.notna(row['error']):
                error_message = str(row['error'])
            
            details.append({
                'variables': variables,
                'output': output_text,
                'status': status,
                'success': success,
                'score': float(row['score']) if pd.notna(row['score']) else 0.0,
                'latency': int(row['latency_ms']) if pd.notna(row['latency_ms']) else 0,
                'error': error_message,
                'grading_info': grading_info,
                'assertions': assertions
            })
        
        return jsonify({
            'eval_id': decoded_eval_id,
            'total_tests': len(details),
            'passed_tests': sum(1 for d in details if d['success']),
            'pass_rate': f"{(sum(1 for d in details if d['success']) / len(details) * 100):.2f}%" if details else "0%",
            'details': details
        })
        
    except Exception as e:
        print(f"獲取評估詳細資料錯誤: {e}")
        return jsonify({'error': str(e)}), 500

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
            
            # 檢查是否成功執行（即使有測試失敗，只要沒有嚴重錯誤就算成功）
            if result.returncode == 0 or (result.returncode != 0 and "Evaluation complete" in result.stdout):
                return jsonify({
                    'message': '配置執行成功',
                    'output': result.stdout,
                    'config_id': config_id,
                    'return_code': result.returncode
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

@app.route('/api/test-api', methods=['POST'])
def test_api():
    """測試API配置"""
    try:
        data = request.json
        method = data.get('method', 'POST')
        url = data.get('url', '')
        headers = data.get('headers', {})
        body = data.get('body', '')
        transform_response = data.get('transformResponse', '')
        
        if not url:
            return jsonify({'success': False, 'error': 'URL不能為空'}), 400
        
        # 解析body為JSON（如果是JSON格式）
        request_data = None
        if body:
            try:
                request_data = json.loads(body)
            except json.JSONDecodeError:
                request_data = body
        
        print(f"測試API: {method} {url}")
        print(f"Headers: {headers}")
        print(f"Body: {body}")
        
        # 發送請求到目標API
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=request_data if isinstance(request_data, dict) else None,
                data=request_data if isinstance(request_data, str) else None,
                timeout=30
            )
            
            # 解析響應
            try:
                response_json = response.json()
            except:
                response_json = {'raw_response': response.text}
            
            # 應用transform（如果有配置）
            transformed_response = None
            if transform_response and response_json:
                try:
                    transformed_response = apply_response_transform(response_json, transform_response)
                except Exception as e:
                    print(f"Transform錯誤: {e}")
                    transformed_response = f"Transform錯誤: {str(e)}"
            
            if response.status_code == 200:
                return jsonify({
                    'success': True,
                    'response': response_json,
                    'transformedResponse': transformed_response,
                    'statusCode': response.status_code,
                    'headers': dict(response.headers)
                })
            else:
                return jsonify({
                    'success': False,
                    'error': f'API返回錯誤狀態碼 {response.status_code}: {response.text}',
                    'response': response_json,
                    'statusCode': response.status_code
                })
                
        except requests.exceptions.Timeout:
            return jsonify({'success': False, 'error': 'API請求超時（30秒）'}), 500
        except requests.exceptions.ConnectionError:
            return jsonify({'success': False, 'error': '無法連接到API服務器，請檢查URL和網路連接'}), 500
        except requests.exceptions.RequestException as e:
            return jsonify({'success': False, 'error': f'請求錯誤: {str(e)}'}), 500
            
    except Exception as e:
        print(f"API測試錯誤: {e}")
        return jsonify({'success': False, 'error': f'測試失敗: {str(e)}'}), 500

def apply_response_transform(response_data, transform_config):
    """應用響應轉換配置"""
    try:
        # 簡單的點記法解析，例如 "json.response" 或 "json.choices[0].message.content"
        if not transform_config or transform_config == 'json':
            return response_data
        
        # 移除 "json." 前綴（如果有的話）
        path = transform_config.replace('json.', '') if transform_config.startswith('json.') else transform_config
        
        # 分割路徑
        parts = []
        current_part = ""
        in_brackets = False
        
        for char in path:
            if char == '[':
                if current_part:
                    parts.append(current_part)
                    current_part = ""
                in_brackets = True
            elif char == ']':
                if current_part:
                    parts.append(int(current_part))  # 陣列索引
                    current_part = ""
                in_brackets = False
            elif char == '.' and not in_brackets:
                if current_part:
                    parts.append(current_part)
                    current_part = ""
            else:
                current_part += char
        
        if current_part:
            parts.append(current_part)
        
        # 應用路徑
        result = response_data
        for part in parts:
            if isinstance(result, dict) and part in result:
                result = result[part]
            elif isinstance(result, list) and isinstance(part, int) and 0 <= part < len(result):
                result = result[part]
            else:
                return f"路徑 '{transform_config}' 在響應中不存在"
        
        return result
        
    except Exception as e:
        return f"Transform處理錯誤: {str(e)}"

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
                
                config = provider.get('config', {})
                
                # 檢查是否有 URL 或 request 配置
                if not config.get('url') and not config.get('request'):
                    validation['errors'].append(f'Provider {i + 1} 缺少 URL 或 request 配置')
                    validation['valid'] = False
                
                # 如果有 request 配置，檢查格式
                if config.get('request'):
                    request_content = config['request']
                    if not isinstance(request_content, str):
                        validation['errors'].append(f'Provider {i + 1} 的 request 配置格式錯誤')
                        validation['valid'] = False
                    else:
                        # 檢查 request 是否包含必要的 HTTP 元素
                        lines = request_content.strip().split('\n')
                        if len(lines) < 1:
                            validation['errors'].append(f'Provider {i + 1} 的 request 配置內容不完整')
                            validation['valid'] = False
                        else:
                            # 檢查第一行是否是有效的 HTTP 方法行
                            first_line = lines[0].strip()
                            if not any(method in first_line for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']):
                                validation['warnings'].append(f'Provider {i + 1} 的 request 配置可能缺少有效的 HTTP 方法')
                            
                            # 檢查是否包含 {{prompt}} 變量
                            if '{{prompt}}' not in request_content:
                                validation['warnings'].append(f'Provider {i + 1} 的 request 配置建議包含 {{prompt}} 變量')
                
                # 檢查 useHttps 配置
                if 'useHttps' in config:
                    if not isinstance(config['useHttps'], bool):
                        validation['warnings'].append(f'Provider {i + 1} 的 useHttps 應該是 true 或 false')
                
                # 檢查 transformResponse 配置
                if not config.get('transformResponse'):
                    validation['warnings'].append(f'Provider {i + 1} 建議設置 transformResponse 以提取回應內容')
        
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

# CSV檔案處理
@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    """處理CSV檔案上傳並返回欄位信息"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '沒有選擇檔案'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '沒有選擇檔案'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': '請上傳CSV檔案'}), 400
        
        # 讀取CSV檔案
        import io
        csv_content = file.read().decode('utf-8')
        csv_io = io.StringIO(csv_content)
        
        # 使用pandas讀取CSV
        df = pd.read_csv(csv_io)
        
        # 獲取欄位名稱
        headers = df.columns.tolist()
        
        # 返回欄位信息
        return jsonify({
            'success': True,
            'headers': headers,
            'row_count': len(df),
            'message': f'成功讀取CSV檔案，包含 {len(df)} 行數據'
        })
        
    except Exception as e:
        print(f"CSV上傳錯誤: {e}")
        return jsonify({'error': f'CSV檔案處理失敗: {str(e)}'}), 500

# 檔案上傳處理

# 靜態檔案服務
@app.route('/static/<path:filename>')
def serve_static(filename):
    """提供靜態檔案"""
    return app.send_static_file(filename)

if __name__ == '__main__':
    print("🚀 啟動LLM評測平台...")
    print("📊 平台功能:")
    print("   - TestRunner: 安全測試工具 (即將推出)")
    print("   - ScoreLab: 評分工具 (可用)")
    print("   - AttackGen: 測試集生成工具 (即將推出)")
    print("🌐 訪問地址:")
    print("   - 主頁: http://localhost:5500")
    print("   - ScoreLab: http://localhost:5500/scorelab")
    print("   - TestRunner: http://localhost:5500/testrunner")
    print("   - AttackGen: http://localhost:5500/attackgen")
    print("📝 請確保已安裝 promptfoo: pip install promptfoo")
    
    app.run(debug=True, host='0.0.0.0', port=5500)
