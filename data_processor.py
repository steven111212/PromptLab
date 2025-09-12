#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
資料處理程式：從資料庫讀取資料並生成包含統計指標的分析報告

功能：
1. 從 SQLite 資料庫讀取評估結果
2. 根據 eval_id 分割資料並儲存為個別 CSV 檔案
3. 計算每個 eval_id 的通過率和資料集數量
4. 生成包含統計指標的最終分析檔案
"""

import pandas as pd
import sqlite3
import os
import re


def clean_filename(filename):
    """清理檔案名稱中的無效字符"""
    invalid_chars = r'[<>:"/\\|?*]'
    cleaned = re.sub(invalid_chars, '_', filename)
    return cleaned


def process_evaluation_data():
    """主要處理函數"""
    print("🚀 開始資料處理流程...")
    
    # ================================
    # 步驟 1: 連接資料庫並讀取資料
    # ================================
    print("\n📊 步驟 1: 從資料庫讀取資料...")
    
    try:
        conn = sqlite3.connect(r'C:\Users\stevenwu\.promptfoo\promptfoo.db')
        df = pd.read_sql_query("SELECT * FROM eval_results", conn)
        df2 = pd.read_sql_query("SELECT * FROM evals", conn)
        conn.close()
        
        print(f"✅ eval_results 資料表: {len(df)} 筆資料")
        print(f"✅ evals 資料表: {len(df2)} 筆資料")
        
    except Exception as e:
        print(f"❌ 資料庫連接錯誤: {str(e)}")
        return None
    
    # ================================
    # 步驟 2: 資料篩選和準備
    # ================================
    
    print(f"✅ 篩選後的評估結果: {len(df)} 筆資料")
    print(f"✅ 描述資料: {len(df2)} 筆資料")
    
    # ================================
    # 步驟 3: 創建資料夾結構
    # ================================
    print("\n📁 步驟 3: 創建資料夾結構...")
    
    os.makedirs('temp', exist_ok=True)
    os.makedirs('temp/eval_id', exist_ok=True)
    
    # ================================
    # 步驟 4: 根據 eval_id 分割資料並儲存
    # ================================
    print("\n✂️ 步驟 4: 根據 eval_id 分割並儲存 CSV 檔案...")
    
    unique_eval_ids = df['eval_id'].unique()
    print(f"找到 {len(unique_eval_ids)} 個不同的 eval_id")
    
    for eval_id in unique_eval_ids:
        # 過濾出特定 eval_id 的資料
        df_subset = df[df['eval_id'] == eval_id]
        
        # 清理 eval_id 作為檔案名稱
        clean_eval_id = clean_filename(str(eval_id))
        filename = f'temp/eval_id/{clean_eval_id}.csv'
        
        # 儲存 CSV 檔案
        df_subset.to_csv(filename, index=False, encoding='utf-8-sig')
        
        print(f"✅ {eval_id}: {len(df_subset)} 筆資料已儲存至 {filename}")
    
    # ================================
    # 步驟 5: 計算統計指標並增強描述資料
    # ================================
    print("\n📈 步驟 5: 計算統計指標...")
    
    # 複製描述資料並新增欄位
    df2_enhanced = df2.copy()
    df2_enhanced['pass_rate'] = 0.0
    df2_enhanced['dataset_count'] = 0
    
    # 遍歷每個 eval_id 計算統計資料
    for index, row in df2_enhanced.iterrows():
        eval_id = row['id']
        
        # 清理檔案名稱
        clean_eval_id = clean_filename(str(eval_id))
        csv_file_path = f'temp/eval_id/{clean_eval_id}.csv'
        
        try:
            # 讀取對應的 CSV 檔案
            eval_data = pd.read_csv(csv_file_path)
            
            # 計算資料集數量（總行數）
            dataset_count = len(eval_data)
            
            # 計算 pass_rate（success 欄位為 1 的比例）
            success_count = eval_data['success'].sum()
            pass_rate = success_count / dataset_count if dataset_count > 0 else 0.0
            
            # 更新 dataframe
            df2_enhanced.at[index, 'pass_rate'] = round(pass_rate, 4)
            df2_enhanced.at[index, 'dataset_count'] = dataset_count
            
            print(f"✅ {eval_id}: 資料集數量={dataset_count}, 通過數量={success_count}, 通過率={pass_rate:.4f}")
            
        except FileNotFoundError:
            print(f"❌ 找不到檔案: {csv_file_path}")
        except Exception as e:
            print(f"❌ 處理 {eval_id} 時發生錯誤: {str(e)}")
    
    # ================================
    # 步驟 6: 儲存最終結果並顯示統計摘要
    # ================================
    print("\n💾 步驟 6: 儲存最終結果...")
    
    # 儲存包含統計指標的最終檔案
    output_file = 'temp/df2_enhanced.csv'
    df2_enhanced.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✅ 包含統計指標的資料已儲存至 {output_file}")
    
    # 顯示統計摘要
    print("\n" + "="*50)
    print("📊 最終統計摘要")
    print("="*50)
    print(f"總共處理了 {len(df2_enhanced)} 個 eval_id")
    print(f"平均通過率: {df2_enhanced['pass_rate'].mean():.4f}")
    print(f"平均資料集數量: {df2_enhanced['dataset_count'].mean():.1f}")
    print(f"最高通過率: {df2_enhanced['pass_rate'].max():.4f}")
    print(f"最低通過率: {df2_enhanced['pass_rate'].min():.4f}")
    
    # 按通過率排序顯示
    print("\n🏆 按通過率排序:")
    df_sorted = df2_enhanced.sort_values('pass_rate', ascending=False)
    print(df_sorted[['id', 'description', 'pass_rate', 'dataset_count']].to_string(index=False))
    
    print("\n🎉 資料處理完成！")
    print("📁 生成的檔案:")
    print(f"   - {output_file} (包含統計指標的最終分析檔案)")
    print("   - temp/eval_id/*.csv (各個 eval_id 的分割檔案)")
    
    return df2_enhanced


if __name__ == "__main__":
    # 執行主要處理函數
    result = process_evaluation_data()
    
    if result is not None:
        print(f"\n✨ 處理成功！最終資料包含 {len(result)} 筆記錄")
    else:
        print("\n❌ 處理失敗，請檢查錯誤訊息")
