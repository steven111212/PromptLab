from typing import Dict, Any, Union
from bert_score import score

def get_assert_bert_f1(output: str, context: Dict[str, Any]) -> Dict[str, Any]:
    reference = context["vars"].get("summary", "")
    
    if not reference:
        return {
            "pass": False,
            "score": 0.0,
            "reason": "No reference provided in context.vars.summary"
        }



    # BERTScore（使用中文模型）
    P, R, F1 = score([output], [reference], lang="zh", rescale_with_baseline=True)
    bert_f1 = F1[0].item()
    
    pass_condition = bert_f1 >= 0.5

    return {
        "pass": pass_condition,
        "score": bert_f1,
        "reason": f"BERTScore F1: {bert_f1:.4f}",
        "named_scores": {
            "bert-score": bert_f1
        }
    }

def get_assert_bert_recall(output: str, context: Dict[str, Any]) -> Dict[str, Any]:
    reference = context["vars"].get("summary", "")
    
    if not reference:
        return {
            "pass": False,
            "score": 0.0,
            "reason": "No reference provided in context.vars.summary"
        }



    # BERTScore（使用中文模型）
    P, R, F1 = score([output], [reference], lang="zh", rescale_with_baseline=True)
    bert_R = R[0].item()
    
    pass_condition = bert_R >= 0.5

    return {
        "pass": pass_condition,
        "score": bert_R,
        "reason": f"BERTScore Recall: {bert_R:.4f}",
        "named_scores": {
            "bert-score": bert_R
        }
    }

def get_assert_bert_precision(output: str, context: Dict[str, Any]) -> Dict[str, Any]:
    reference = context["vars"].get("summary", "")
    
    if not reference:
        return {
            "pass": False,
            "score": 0.0,
            "reason": "No reference provided in context.vars.summary"
        }



    # BERTScore（使用中文模型）
    P, R, F1 = score([output], [reference], lang="zh", rescale_with_baseline=True)
    bert_P = P[0].item()
    
    pass_condition = bert_P >= 0.5

    return {
        "pass": pass_condition,
        "score": bert_P,
        "reason": f"BERTScore Precision: {bert_P:.4f}",
        "named_scores": {
            "bert-score": bert_P
        }
    }
