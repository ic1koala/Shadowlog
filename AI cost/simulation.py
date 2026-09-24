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
    daily_practices_per_user: float = 20.0,
    monthly_price_jpy: float = 500.0,
    credit_card_fee_pct: float = 3.6,
    days_per_month: int = 30,
    usd_to_jpy: float = 150.0,
    retry_ratio: float = 2.0,  # 1 phrase practiced ~2 times on avg (halves TTS & prompt gen per practice)
):
    # Standard unit cost (1 practice = full generation)
    standard_unit = calculate_single_practice_cost(usd_to_jpy)

    # Optimized unit cost taking into account app usage improvements:
    # 1. Manual phrase generation (no wasted calls)
    # 2. Re-practicing/retrying the same phrase (TTS audio reused, sentence gen amortized)
    opt_tts_usd = standard_unit["tts_usd"] / retry_ratio
    opt_gpt_usd = (standard_unit["gpt_usd"] / 2.0 / retry_ratio) + (standard_unit["gpt_usd"] / 2.0)  # gen is amortized, coach runs per recording
    opt_whisper_usd = standard_unit["whisper_usd"]
    opt_total_usd = opt_tts_usd + opt_whisper_usd + opt_gpt_usd
    opt_total_jpy = opt_total_usd * usd_to_jpy

    unit = {
        **standard_unit,
        "opt_total_usd": opt_total_usd,
        "opt_total_jpy": opt_total_jpy,
        "current_unit_jpy": opt_total_jpy,  # use optimized as realistic standard
    }

    # Volume
    monthly_practices_per_user = daily_practices_per_user * days_per_month
    total_monthly_practices = users * monthly_practices_per_user

    # Revenues & Processing fees
    total_revenue_jpy = users * monthly_price_jpy
    payment_fee_jpy = total_revenue_jpy * (credit_card_fee_pct / 100.0)
    net_revenue_jpy = total_revenue_jpy - payment_fee_jpy

    # AI Costs (using optimized cost from app usage)
    total_ai_cost_usd = total_monthly_practices * opt_total_usd
    total_ai_cost_jpy = total_monthly_practices * opt_total_jpy
    ai_cost_per_user_jpy = monthly_practices_per_user * opt_total_jpy

    # Gross Profit / Loss
    gross_profit_jpy = net_revenue_jpy - total_ai_cost_jpy
    profit_margin_pct = (gross_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0

    # Break-even calculations
    net_rev_per_user = monthly_price_jpy * (1.0 - credit_card_fee_pct / 100.0)
    break_even_monthly_practices = net_rev_per_user / opt_total_jpy
    break_even_daily_practices = break_even_monthly_practices / days_per_month

    # Break-even price for 20 uses/day
    break_even_price_for_uses = (ai_cost_per_user_jpy) / (1.0 - credit_card_fee_pct / 100.0)

    # Recommended price for 50% profit margin
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
        "break_even_price_for_uses": break_even_price_for_uses,
        "recommended_price_50pct_margin": recommended_price_50pct_margin,
        "usd_to_jpy": usd_to_jpy,
        "retry_ratio": retry_ratio,
    }

def print_report(res):
    u = res["unit"]
    print("=" * 72)
    print("      📊 ShadowLog 有料化・AIコスト収支試算シミュレーション レポート")
    print("=" * 72)
    print(f"為替レート想定: 1 USD = {res['usd_to_jpy']:.1f} 円 | 決済手数料: {res['credit_card_fee_pct']:.1f}% (Stripe等)")
    print()

    print("▶ 1. 練習1回あたりの原価（アプリ仕様改善後の再試算）")
    print("-" * 72)
    print(f"  【従来（毎回フル生成・リトライなしの場合）】: 約 {u['total_jpy']:.3f} 円 / 回 (${u['total_usd']:.5f})")
    print(f"  【最適化後（手動生成化＋平均{res['retry_ratio']:.0f}回リトライ・TTS再利用）】:")
    print(f"    ・TTS-1 (音声再利用により半減)     : 約 {u['tts_jpy']/res['retry_ratio']:.3f} 円")
    print(f"    ・Whisper-1 (発話音声認識/約10秒)   : 約 {u['whisper_jpy']:.3f} 円")
    print(f"    ・GPT-4o-mini (文生成+コーチ指導)   : 約 {((u['gpt_jpy']/2.0/res['retry_ratio']) + u['gpt_jpy']/2.0):.3f} 円")
    print(f"    ★ 練習1回あたりの実質AI原価        : 約 {u['opt_total_jpy']:.3f} 円 (${u['opt_total_usd']:.5f}) [約31%圧縮!]")
    print()

    print(f"▶ 2. ユーザーご指定条件での試算（{res['users']}人 × 毎日{res['daily_practices']:.0f}回 × 月額{res['monthly_price_jpy']:.0f}円）")
    print("-" * 72)
    print(f"  ・有料会員数                        : {res['users']} 名")
    print(f"  ・1人あたりの利用頻度               : 毎日 {res['daily_practices']:.0f} 回 (月 {res['monthly_practices_per_user']:,.0f} 回)")
    print(f"  ・サービス全体の月間総練習回数      : {res['total_monthly_practices']:,.0f} 回 / 月")
    print()
    print(f"  【売上】")
    print(f"  ・月間総売上 ({res['users']}人 × {res['monthly_price_jpy']:.0f}円)     :  {res['total_revenue_jpy']:,.0f} 円")
    print(f"  ・クレカ決済手数料 ({res['credit_card_fee_pct']}%)            : -{res['payment_fee_jpy']:,.0f} 円")
    print(f"  ・決済後ネット手取売上              :  {res['net_revenue_jpy']:,.0f} 円")
    print()
    print(f"  【原価 (AIコスト - 抑制後)】")
    print(f"  ・1人あたりの月間AIコスト           :  {res['ai_cost_per_user_jpy']:,.0f} 円 / 人")
    print(f"  ・全体の月間AI総コスト              : -{res['total_ai_cost_jpy']:,.0f} 円 (${res['total_ai_cost_usd']:,.2f})")
    print()
    print(f"  ----------------------------------------------------------------------")
    profit_symbol = "🟢 [黒字]" if res["gross_profit_jpy"] >= 0 else "🔴 [赤字]"
    print(f"  ★ 月間最終損益 (粗利)              : {profit_symbol} +{res['gross_profit_jpy']:,.0f} 円" if res["gross_profit_jpy"] >= 0 else f"  ★ 月間最終損益 (粗利)              : {profit_symbol} {res['gross_profit_jpy']:,.0f} 円")
    print(f"  ★ 利益率                           : {res['profit_margin_pct']:.1f}%")
    print("=" * 72)
    print()

    print("▶ 3. 2大プラン（ベースプラン vs Proプラン）比較シミュレーション")
    print("-" * 72)
    print(f"{'プラン名':<16} | {'月額料金':<8} | {'想定1日回数':<9} | {'1人AI原価':<10} | {'1人月間粗利':<12} | {'粗利率':<7} | {'判定'}")
    print("-" * 72)
    plan_cases = [
        ("ベースプラン (指定)", 500, 20),
        ("Proプラン (指定)", 1480, 40),
        ("Proプラン (ヘビー50回)", 1480, 50),
    ]
    for pname, price, daily in plan_cases:
        m_cnt = daily * 30
        c_person = m_cnt * u["opt_total_jpy"]
        p_person = (price * (1 - res["credit_card_fee_pct"] / 100)) - c_person
        pmargin = (p_person / price) * 100
        pstat = "🟢 大幅黒字" if pmargin >= 50 else ("🟢 黒字" if pmargin > 0 else "🔴 赤字")
        print(f"{pname:<16} | ¥{price:<7} | {daily:>4}回/日   | ¥{c_person:>7.0f}/月 | +¥{p_person:>8.0f}/月  | {pmargin:>5.1f}% | {pstat}")
    print("-" * 72)
    print()

    print("▶ 4. 収益化・運営のための重要ポイント")
    print("-" * 72)
    print(f"  ① 【ベースプラン 500円 / 1日20回制限】")
    print(f"     1人原価は約 {20*30*u['opt_total_jpy']:.0f} 円。手取 482 円に対し、1人あたり +{482 - 20*30*u['opt_total_jpy']:.0f} 円（粗利率 {((482 - 20*30*u['opt_total_jpy'])/500)*100:.1f}%）の健全な高収益体質です。")
    print()
    print(f"  ② 【Proプラン 1,480円 / 毎日40〜50回】")
    print(f"     毎日40〜50回ガチ練習しても1人原価は約 400〜500 円。1人あたり +900〜1,000 円超（粗利率 ~65%）の極めて高いLTVを実現できます。")
    print("=" * 72)

def main():
    parser = argparse.ArgumentParser(description="ShadowLog AI Cost & Profit Simulator")
    parser.add_argument("--users", type=int, default=50, help="Number of paying users (default: 50)")
    parser.add_argument("--daily-uses", type=float, default=20.0, help="Daily practices per user (default: 20)")
    parser.add_argument("--price", type=float, default=500.0, help="Monthly subscription price in JPY (default: 500)")
    parser.add_argument("--usd-jpy", type=float, default=150.0, help="USD to JPY exchange rate (default: 150.0)")
    parser.add_argument("--fee", type=float, default=3.6, help="Credit card processing fee % (default: 3.6)")
    parser.add_argument("--retry-ratio", type=float, default=2.0, help="Average practices per generated phrase (default: 2.0)")

    args = parser.parse_args()

    results = run_simulation(
        users=args.users,
        daily_practices_per_user=args.daily_uses,
        monthly_price_jpy=args.price,
        credit_card_fee_pct=args.fee,
        usd_to_jpy=args.usd_jpy,
        retry_ratio=args.retry_ratio,
    )

    print_report(results)

if __name__ == "__main__":
    main()
