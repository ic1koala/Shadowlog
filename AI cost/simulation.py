#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ShadowLog AI Cost & Profit Simulator
Based on actual OpenAI usage metrics (GPT-4o-mini, TTS-1, Whisper-1).
"""

import argparse
import sys

# Empirical benchmark constants derived from actual dashboard usage
CHARS_PER_TTS_REQUEST = 133.1       # 7,586 chars / 57 requests
SECONDS_PER_WHISPER_REQUEST = 9.92   # 119 seconds / 12 requests
TOKENS_PER_CHAT_REQUEST = 284.1      # 19,321 tokens / 68 requests (avg per call)
CHATS_PER_SESSION = 2                # 1 for sentence gen + 1 for coach review

# OpenAI Pricing (USD)
PRICE_PER_1M_CHARS_TTS = 15.00       # TTS-1: $15.00 / 1M chars
PRICE_PER_MINUTE_WHISPER = 0.006     # Whisper: $0.006 / min ($0.0001 / sec)
PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI = 0.150   # $0.15 / 1M
PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI = 0.600  # $0.60 / 1M

def calculate_single_practice_cost(usd_to_jpy: float = 150.0):
    """Calculates the unit AI cost for 1 single shadowing practice session."""
    # 1. TTS Cost
    tts_cost_usd = (CHARS_PER_TTS_REQUEST / 1_000_000.0) * PRICE_PER_1M_CHARS_TTS

    # 2. Whisper Cost
    whisper_cost_usd = (SECONDS_PER_WHISPER_REQUEST / 60.0) * PRICE_PER_MINUTE_WHISPER

    # 3. GPT-4o-mini Cost (Generation + Coach Review)
    # Average ~284 input tokens, ~100 output tokens per call * 2 calls
    input_tokens = TOKENS_PER_CHAT_REQUEST * CHATS_PER_SESSION
    output_tokens = 100.0 * CHATS_PER_SESSION
    gpt_cost_usd = (
        (input_tokens / 1_000_000.0) * PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI
        + (output_tokens / 1_000_000.0) * PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI
    )

    total_usd = tts_cost_usd + whisper_cost_usd + gpt_cost_usd
    total_jpy = total_usd * usd_to_jpy

    return {
        "tts_usd": tts_cost_usd,
        "tts_jpy": tts_cost_usd * usd_to_jpy,
        "whisper_usd": whisper_cost_usd,
        "whisper_jpy": whisper_cost_usd * usd_to_jpy,
        "gpt_usd": gpt_cost_usd,
        "gpt_jpy": gpt_cost_usd * usd_to_jpy,
        "total_usd": total_usd,
        "total_jpy": total_jpy,
        "tts_ratio": (tts_cost_usd / total_usd) * 100.0,
        "whisper_ratio": (whisper_cost_usd / total_usd) * 100.0,
        "gpt_ratio": (gpt_cost_usd / total_usd) * 100.0,
    }

def run_simulation(
    users: int = 50,
    daily_practices_per_user: float = 50.0,
    monthly_price_jpy: float = 300.0,
    credit_card_fee_pct: float = 3.6,
    days_per_month: int = 30,
    usd_to_jpy: float = 150.0,
):
    unit = calculate_single_practice_cost(usd_to_jpy)

    # Volume
    monthly_practices_per_user = daily_practices_per_user * days_per_month
    total_monthly_practices = users * monthly_practices_per_user

    # Revenues & Processing fees
    total_revenue_jpy = users * monthly_price_jpy
    payment_fee_jpy = total_revenue_jpy * (credit_card_fee_pct / 100.0)
    net_revenue_jpy = total_revenue_jpy - payment_fee_jpy

    # AI Costs
    total_ai_cost_usd = total_monthly_practices * unit["total_usd"]
    total_ai_cost_jpy = total_monthly_practices * unit["total_jpy"]
    ai_cost_per_user_jpy = monthly_practices_per_user * unit["total_jpy"]

    # Gross Profit / Loss
    gross_profit_jpy = net_revenue_jpy - total_ai_cost_jpy
    profit_margin_pct = (gross_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0

    # Break-even calculations
    # 1. Break-even daily practices for current price (300 JPY)
    net_rev_per_user = monthly_price_jpy * (1.0 - credit_card_fee_pct / 100.0)
    break_even_monthly_practices = net_rev_per_user / unit["total_jpy"]
    break_even_daily_practices = break_even_monthly_practices / days_per_month

    # 2. Break-even price for current volume (50 uses/day)
    break_even_price_for_50_uses = (ai_cost_per_user_jpy) / (1.0 - credit_card_fee_pct / 100.0)

    # 3. Recommended price for 50% profit margin
    recommended_price_50pct_margin = (ai_cost_per_user_jpy / 0.50) / (1.0 - credit_card_fee_pct / 100.0)

    return {
        "unit": unit,
        "users": users,
        "daily_practices": daily_practices_per_user,
        "monthly_practices_per_user": monthly_practices_per_user,
        "total_monthly_practices": total_monthly_practices,
        "monthly_price_jpy": monthly_price_jpy,
        "credit_card_fee_pct": credit_card_fee_pct,
        "total_revenue_jpy": total_revenue_jpy,
        "payment_fee_jpy": payment_fee_jpy,
        "net_revenue_jpy": net_revenue_jpy,
        "total_ai_cost_usd": total_ai_cost_usd,
        "total_ai_cost_jpy": total_ai_cost_jpy,
        "ai_cost_per_user_jpy": ai_cost_per_user_jpy,
        "gross_profit_jpy": gross_profit_jpy,
        "profit_margin_pct": profit_margin_pct,
        "break_even_daily_practices": break_even_daily_practices,
        "break_even_monthly_practices": break_even_monthly_practices,
        "break_even_price_for_50_uses": break_even_price_for_50_uses,
        "recommended_price_50pct_margin": recommended_price_50pct_margin,
        "usd_to_jpy": usd_to_jpy,
    }

def print_report(res):
    u = res["unit"]
    print("=" * 72)
    print("      📊 ShadowLog 有料化・AIコスト収支試算シミュレーション レポート")
    print("=" * 72)
    print(f"為替レート想定: 1 USD = {res['usd_to_jpy']:.1f} 円")
    print(f"決済手数料想定: {res['credit_card_fee_pct']:.1f}% (Stripe等)")
    print()

    print("▶ 1. 練習1回あたりの原価内訳（実測実績値ベース）")
    print("-" * 72)
    print(f"  ・TTS-1 (模範音声生成/約133文字)    : ${u['tts_usd']:.5f} ({u['tts_jpy']:.3f}円) [{u['tts_ratio']:.1f}%]")
    print(f"  ・Whisper-1 (発話音声認識/約10秒)   : ${u['whisper_usd']:.5f} ({u['whisper_jpy']:.3f}円) [{u['whisper_ratio']:.1f}%]")
    print(f"  ・GPT-4o-mini (文生成 + コーチ指導) : ${u['gpt_usd']:.5f} ({u['gpt_jpy']:.3f}円) [{u['gpt_ratio']:.1f}%]")
    print(f"  ----------------------------------------------------------------------")
    print(f"  ★ 練習1回の合計AI原価              : ${u['total_usd']:.5f} (約 {u['total_jpy']:.3f} 円)")
    print()

    print("▶ 2. ユーザーご指定条件での試算（50人 × 毎日50回 × 月額300円）")
    print("-" * 72)
    print(f"  ・有料会員数                        : {res['users']} 名")
    print(f"  ・1人あたりの利用頻度               : 毎日 {res['daily_practices']:.0f} 回 (月 {res['monthly_practices_per_user']:,.0f} 回)")
    print(f"  ・サービス全体の月間総練習回数      : {res['total_monthly_practices']:,.0f} 回 / 月")
    print()
    print(f"  【売上】")
    print(f"  ・月間総売上 (50人 × 300円)         :  {res['total_revenue_jpy']:,.0f} 円")
    print(f"  ・クレカ決済手数料 ({res['credit_card_fee_pct']}%)            : -{res['payment_fee_jpy']:,.0f} 円")
    print(f"  ・決済後ネット売上                  :  {res['net_revenue_jpy']:,.0f} 円")
    print()
    print(f"  【原価 (AIコスト)】")
    print(f"  ・1人あたりの月間AIコスト           :  {res['ai_cost_per_user_jpy']:,.0f} 円 / 人")
    print(f"  ・全体の月間AI総コスト              : -{res['total_ai_cost_jpy']:,.0f} 円 (${res['total_ai_cost_usd']:,.2f})")
    print()
    print(f"  ----------------------------------------------------------------------")
    profit_symbol = "🟢 [黒字]" if res["gross_profit_jpy"] >= 0 else "🔴 [赤字]"
    print(f"  ★ 月間最終損益 (粗利)              : {profit_symbol} {res['gross_profit_jpy']:,.0f} 円")
    print(f"  ★ 利益率                           : {res['profit_margin_pct']:.1f}%")
    print("=" * 72)
    print()

    print("▶ 3. ユーザー行動別（利用頻度別）の損益分岐点・感度分析")
    print("-" * 72)
    print(f"{'利用パターン':<14} | {'1日回数':<7} | {'月間回数':<8} | {'1人AI原価':<10} | {'300円時の1人利益':<15} | {'判定'}")
    print("-" * 72)
    patterns = [
        ("ライト層", 5),
        ("標準層", 15),
        ("積極層 (損益分岐)", int(res["break_even_daily_practices"])),
        ("ヘビー層 (想定)", 30),
        ("超ヘビー層 (指定)", 50),
    ]
    for name, times in patterns:
        monthly_cnt = times * 30
        cost_per_person = monthly_cnt * u["total_jpy"]
        profit_per_person = (300 * (1 - res["credit_card_fee_pct"] / 100)) - cost_per_person
        status = "🟢 黒字" if profit_per_person >= 0 else "🔴 赤字"
        print(f"{name:<14} | {times:>5}回 | {monthly_cnt:>6}回 | {cost_per_person:>8.1f}円 | {profit_per_person:>12.1f}円 | {status}")
    print("-" * 72)
    print()

    print("▶ 4. 改善・収益化のための重要アドバイス")
    print("-" * 72)
    print(f"  ① 【月額300円を維持する場合の上限設定】")
    print(f"     300円で赤字を出さないための最大練習回数は「1日 約 {res['break_even_daily_practices']:.1f} 回（月 {res['break_even_monthly_practices']:.0f} 回）」です。")
    print(f"     → 「300円プランは1日15〜20回まで」の制限を設けるのがベストです。")
    print()
    print(f"  ② 【毎日50回練習を無制限で許可する場合の適正価格】")
    print(f"     毎日50回利用時の1人原価は約 {res['ai_cost_per_user_jpy']:.0f} 円です。")
    print(f"     ・トントンになる最低月額 : 約 {res['break_even_price_for_50_uses']:.0f} 円")
    print(f"     ・健全な利益率50%の推奨月額: 約 {res['recommended_price_50pct_margin']:.0f} 円 (例: 月額 1,480 円プラン)")
    print()
    print(f"  ③ 【TTSコスト削減の劇的施策】")
    print(f"     全体の63%を占めているのは「TTS-1（音声読み上げ）」です。")
    print(f"     過去に生成した模範音声やプリセット英文の音声を Supabase Storage等にキャッシュして再利用すれば、")
    print(f"     リピート練習時のAIコストを最大60%カット（1回 0.18円）まで削減可能です。")
    print("=" * 72)

def main():
    parser = argparse.ArgumentParser(description="ShadowLog AI Cost & Profit Simulator")
    parser.add_argument("--users", type=int, default=50, help="Number of paying users (default: 50)")
    parser.add_argument("--daily-uses", type=float, default=50.0, help="Daily practices per user (default: 50)")
    parser.add_argument("--price", type=float, default=300.0, help="Monthly subscription price in JPY (default: 300)")
    parser.add_argument("--usd-jpy", type=float, default=150.0, help="USD to JPY exchange rate (default: 150.0)")
    parser.add_argument("--fee", type=float, default=3.6, help="Credit card processing fee % (default: 3.6)")

    args = parser.parse_args()

    results = run_simulation(
        users=args.users,
        daily_practices_per_user=args.daily_uses,
        monthly_price_jpy=args.price,
        credit_card_fee_pct=args.fee,
        usd_to_jpy=args.usd_jpy,
    )

    print_report(results)

if __name__ == "__main__":
    main()
