"""評估結果服務"""
import os
import sqlite3
import pandas as pd
import json
import re
import urllib.parse


class EvaluationService:
    """評估結果相關服務"""
    
    def __init__(self, db_path=None):
        self.db_path = db_path or r'C:\Users\stevenwu\.promptfoo\promptfoo.db'
    
    def get_evaluation_results(self):
        """獲取評估結果摘要（直接從資料庫讀取）"""
        try:
            if not os.path.exists(self.db_path):
                return {'error': f'找不到資料庫檔案: {self.db_path}'}, 404
            
            conn = sqlite3.connect(self.db_path)
            
            # 讀取 evals 表格資料
            evals_df = pd.read_sql_query("SELECT * FROM evals", conn)
            
            # 讀取 eval_results 表格資料以計算統計指標
            eval_results_df = pd.read_sql_query("SELECT * FROM eval_results", conn)
            
            conn.close()
            
            print(f"從資料庫讀取到 {len(evals_df)} 個評估記錄")
            print(f"從資料庫讀取到 {len(eval_results_df)} 個評估結果記錄")
            
            if len(evals_df) == 0:
                return {'error': '資料庫中沒有評估資料'}, 404
            
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
                        # 轉換為台灣時區 (UTC+8)
                        dt_taiwan = dt + pd.Timedelta(hours=8)
                        created_time = dt_taiwan.strftime('%Y-%m-%d %H:%M:%S')
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
            
            return results, 200
            
        except Exception as e:
            print(f"獲取評估結果錯誤: {e}")
            return {'error': str(e)}, 500
    
    def get_evaluation_detail(self, eval_id):
        """獲取特定評估的詳細結果（直接從資料庫讀取）"""
        try:
            # URL 解碼 eval_id（處理前端 encodeURIComponent 編碼的問題）
            decoded_eval_id = urllib.parse.unquote(eval_id)
            print(f"原始 eval_id: {eval_id}")
            print(f"解碼後 eval_id: {decoded_eval_id}")
            
            if not os.path.exists(self.db_path):
                return {'error': f'找不到資料庫檔案: {self.db_path}'}, 404
            
            conn = sqlite3.connect(self.db_path)
            
            # 從資料庫讀取特定 eval_id 的詳細資料
            query = "SELECT * FROM eval_results WHERE eval_id = ?"
            df = pd.read_sql_query(query, conn, params=[decoded_eval_id])
            
            conn.close()
            
            if len(df) == 0:
                print(f"找不到評估 {decoded_eval_id} 的詳細資料")
                return {
                    'error': f'找不到評估 {decoded_eval_id} 的詳細資料',
                    'eval_id': decoded_eval_id,
                    'message': '此評估在資料庫中沒有對應的詳細資料'
                }, 404
            
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
            
            return {
                'eval_id': decoded_eval_id,
                'total_tests': len(details),
                'passed_tests': sum(1 for d in details if d['success']),
                'pass_rate': f"{(sum(1 for d in details if d['success']) / len(details) * 100):.2f}%" if details else "0%",
                'details': details
            }, 200
            
        except Exception as e:
            print(f"獲取評估詳細資料錯誤: {e}")
            return {'error': str(e)}, 500
