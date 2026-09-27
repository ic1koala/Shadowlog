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
# GPT-4o-mini chat request tokens:
# Sentence gen (with personalization / weak words injection ~50 tokens): ~334 tokens
# Coach evaluation: ~284 tokens
TOKENS_GEN_REQUEST = 334.0          # ~284 base + ~50 weak words / personalized prompt
TOKENS_COACH_REQUEST = 284.1        # Coach feedback call
CHATS_PER_SESSION = 2                # 1 for sentence gen + 1 for coach review

# OpenAI Pricing (USD)
PRICE_PER_1M_CHARS_TTS = 15.00       # TTS-1: $15.00 / 1M chars
PRICE_PER_MINUTE_WHISPER = 0.006     # Whisper: $0.006 / min ($0.0001 / sec)
PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI = 0.150   # $0.15 / 1M
PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI = 0.600  # $0.60 / 1M

def calculate_single_practice_cost(usd_to_jpy: float = 150.0):
    """Calculates the unit AI cost for 1 single shadowing practice session with personalized prompt."""
    # 1. TTS Cost
    tts_cost_usd = (CHARS_PER_TTS_REQUEST / 1_000_000.0) * PRICE_PER_1M_CHARS_TTS

    # 2. Whisper Cost
    whisper_cost_usd = (SECONDS_PER_WHISPER_REQUEST / 60.0) * PRICE_PER_MINUTE_WHISPER

    # 3. GPT-4o-mini Cost (Generation + Coach Review)
    # Gen: ~334 input, ~100 output; Coach: ~284 input, ~100 output
    input_tokens = TOKENS_GEN_REQUEST + TOKENS_COACH_REQUEST
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
    fixed_office_jpy: float = 1650.0,  # GMO Office Support (Monthly postal transfer / Corporate registration plan)
):
    import math

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

    # Gross Profit (Revenue - Payment Fees - AI Costs)
    gross_profit_jpy = net_revenue_jpy - total_ai_cost_jpy
    gross_profit_margin_pct = (gross_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0
    profit_per_user_jpy = (monthly_price_jpy * (1.0 - credit_card_fee_pct / 100.0)) - ai_cost_per_user_jpy

    # Fixed Costs (GMO Virtual Office)
    total_fixed_cost_jpy = fixed_office_jpy
    operating_profit_jpy = gross_profit_jpy - total_fixed_cost_jpy
    operating_profit_margin_pct = (operating_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0

    # Break-even users needed to cover GMO virtual office fee
    break_even_users_for_fixed = math.ceil(total_fixed_cost_jpy / profit_per_user_jpy) if profit_per_user_jpy > 0 else float("inf")

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
        "gross_profit_margin_pct": gross_profit_margin_pct,
        "profit_per_user_jpy": profit_per_user_jpy,
        "fixed_office_jpy": fixed_office_jpy,
        "total_fixed_cost_jpy": total_fixed_cost_jpy,
        "operating_profit_jpy": operating_profit_jpy,
        "operating_profit_margin_pct": operating_profit_margin_pct,
        "break_even_users_for_fixed": break_even_users_for_fixed,
        "break_even_daily_practices": break_even_daily_practices,
        "break_even_monthly_practices": break_even_monthly_practices,
        "break_even_price_for_uses": break_even_price_for_uses,
        "recommended_price_50pct_margin": recommended_price_50pct_margin,
        "usd_to_jpy": usd_to_jpy,
        "retry_ratio": retry_ratio,
    }

def print_report(res):
    u = res["unit"]
    print("=" * 74)
    print("      📊 ShadowLog 総合収支試算シミュレーション（GMO固定費連動版）")
    print("=" * 74)
    print(f"為替想定: 1 USD = {res['usd_to_jpy']:.1f} 円 | 決済手数料: {res['credit_card_fee_pct']:.1f}% (Stripe等)")
    print(f"固定費想定: GMOオフィスサポート (月1転送/法人登記可) = ¥{res['fixed_office_jpy']:,.0f} /月 (税込)")
    print()

    print("▶ 1. 練習1回あたりの原価（アプリ仕様改善後の再試算）")
    print("-" * 74)
    print(f"  【従来フル生成・リトライなしの場合】: 約 {u['total_jpy']:.3f} 円 / 回 (${u['total_usd']:.5f})")
    print(f"  【最適化後（手動生成化＋平均{res['retry_ratio']:.0f}回リトライ・TTS再利用）】:")
    print(f"    ・TTS-1 (音声再利用により半減)     : 約 {u['tts_jpy']/res['retry_ratio']:.3f} 円")
    print(f"    ・Whisper-1 (発話音声認識/約10秒)   : 約 {u['whisper_jpy']:.3f} 円")
    print(f"    ・GPT-4o-mini (文生成+コーチ指導)   : 約 {((u['gpt_jpy']/2.0/res['retry_ratio']) + u['gpt_jpy']/2.0):.3f} 円")
    print(f"    ★ 練習1回あたりの実質AI原価        : 約 {u['opt_total_jpy']:.3f} 円 (${u['opt_total_usd']:.5f}) [約31%圧縮!]")
    print()

    print(f"▶ 2. ユーザーご指定条件での総合試算（{res['users']}人 × 毎日{res['daily_practices']:.0f}回 × 月額{res['monthly_price_jpy']:.0f}円）")
    print("-" * 74)
    print(f"  ・有料会員数                        : {res['users']} 名")
    print(f"  ・1人あたりの利用頻度               : 毎日 {res['daily_practices']:.0f} 回 (月 {res['monthly_practices_per_user']:,.0f} 回)")
    print(f"  ・サービス全体の月間総練習回数      : {res['total_monthly_practices']:,.0f} 回 / 月")
    print()
    print(f"  【① 売上】")
    print(f"  ・月間総売上 ({res['users']}人 × {res['monthly_price_jpy']:.0f}円)     :  {res['total_revenue_jpy']:,.0f} 円")
    print(f"  ・クレカ決済手数料 ({res['credit_card_fee_pct']}%)            : -{res['payment_fee_jpy']:,.0f} 円")
    print(f"  ・決済後ネット手取売上              :  {res['net_revenue_jpy']:,.0f} 円")
    print()
    print(f"  【② 変動費 (AI原価 - 抑制後)】")
    print(f"  ・1人あたりの月間AIコスト           :  {res['ai_cost_per_user_jpy']:,.0f} 円 / 人")
    print(f"  ・全体の月間AI総コスト              : -{res['total_ai_cost_jpy']:,.0f} 円 (${res['total_ai_cost_usd']:,.2f})")
    print(f"  ・粗利益 (売上 - 手数料 - AI原価)   :  {res['gross_profit_jpy']:,.0f} 円 (粗利率 {res['gross_profit_margin_pct']:.1f}%)")
    print()
    print(f"  【③ 固定費 (バーチャルオフィス代)】")
    print(f"  ・GMOオフィスサポート (月1転送)     : -{res['fixed_office_jpy']:,.0f} 円 / 月")
    print(f"  ・固定費回収に必要な損益分岐会員数  :  ★ わずか {res['break_even_users_for_fixed']} 名 で固定費完全ペイ！")
    print()
    print(f"  ----------------------------------------------------------------------")
    profit_symbol = "🟢 [営業黒字]" if res["operating_profit_jpy"] >= 0 else "🔴 [営業赤字]"
    print(f"  ★ 月間最終営業利益 (固定費控除後)  : {profit_symbol} +{res['operating_profit_jpy']:,.0f} 円" if res["operating_profit_jpy"] >= 0 else f"  ★ 月間最終営業利益 (固定費控除後)  : {profit_symbol} {res['operating_profit_jpy']:,.0f} 円")
    print(f"  ★ 営業利益率                       : {res['operating_profit_margin_pct']:.1f}%")
    print("=" * 74)
    print()

    print("▶ 3. プラン別 損益分岐点 & 営業利益シミュレーション（GMO固定費込）")
    print("-" * 74)
    print(f"{'プラン名':<18} | {'月額料金':<6} | {'1日回数':<6} | {'1人粗利':<9} | {'固定費回収会員':<10} | {'50人時営業利益':<12} | {'営業利益率'}")
    print("-" * 74)
    import math
    plan_cases = [
        ("ベース (実効平均20回)", 500, 20),
        ("ベース (上限30回フル)", 500, 30),
        ("Proプラン (実効40回)", 1480, 40),
        ("Proプラン (ヘビー50回)", 1480, 50),
    ]
    for pname, price, daily in plan_cases:
        m_cnt = daily * 30
        c_person = m_cnt * u["opt_total_jpy"]
        p_person = (price * (1 - res["credit_card_fee_pct"] / 100)) - c_person
        needed_users = math.ceil(res["fixed_office_jpy"] / p_person) if p_person > 0 else float("inf")
        op_50 = (p_person * 50) - res["fixed_office_jpy"]
        op_margin = (op_50 / (price * 50)) * 100
        print(f"{pname:<18} | ¥{price:<6} | {daily:>3}回/日 | +¥{p_person:>6.0f}/人 | {needed_users:>3} 名で黒字化  | +¥{op_50:>8.0f}/月   | {op_margin:>5.1f}%")
    print("-" * 74)
    print()

    # Portfolio Case: 50 Users (45 Basic + 5 Pro)
    basic_users = 45
    pro_users = 5
    b_rev = basic_users * 500
    p_rev = pro_users * 1480
    port_gross_rev = b_rev + p_rev  # ¥29,900
    fee_pct = res["credit_card_fee_pct"]
    port_fee = port_gross_rev * (fee_pct / 100.0)  # ¥1,076
    port_net_rev = port_gross_rev - port_fee  # ¥28,824

    # Case A: Realistic average usage (Basic: 20/day, Pro: 40/day)
    b_cnt_a = basic_users * 20 * 30  # 27,000
    p_cnt_a = pro_users * 40 * 30    # 6,000
    total_cnt_a = b_cnt_a + p_cnt_a  # 33,000
    ai_cost_a = total_cnt_a * u["opt_total_jpy"]  # ~¥10,659
    gross_profit_a = port_net_rev - ai_cost_a    # ~¥18,165
    gross_margin_a = (gross_profit_a / port_gross_rev) * 100  # 60.8%
    op_profit_a = gross_profit_a - res["fixed_office_jpy"]    # ~¥16,515
    op_margin_a = (op_profit_a / port_gross_rev) * 100        # 55.2%

    # Case B: Maximum load (Basic: 30/day full limit, Pro: 60/day heavy)
    b_cnt_b = basic_users * 30 * 30  # 40,500
    p_cnt_b = pro_users * 60 * 30    # 9,000
    total_cnt_b = b_cnt_b + p_cnt_b  # 49,500
    ai_cost_b = total_cnt_b * u["opt_total_jpy"]  # ~¥15,989
    gross_profit_b = port_net_rev - ai_cost_b    # ~¥12,835
    gross_margin_b = (gross_profit_b / port_gross_rev) * 100  # 42.9%
    op_profit_b = gross_profit_b - res["fixed_office_jpy"]    # ~¥11,185
    op_margin_b = (op_profit_b / port_gross_rev) * 100        # 37.4%

    print("▶ 4. 【3ヶ月後到達目標】有料会員50名（ベーシック45名 ＋ Pro 5名）収支試算")
    print("-" * 74)
    print(f"  ・目標構成                          : ベーシック 45名 (90%) ＋ Pro 5名 (10%) = 計 50名")
    print(f"  ・月間総売上 (MRR)                  :  ¥{port_gross_rev:,.0f} / 月")
    print(f"  ・Stripe決済手数料 ({fee_pct}%)            : -¥{port_fee:,.0f} / 月 (手取: ¥{port_net_rev:,.0f})")
    print(f"  ・GMOバーチャルオフィス固定費       : -¥{res['fixed_office_jpy']:,.0f} / 月")
    print()
    print("  【シナリオA：実効稼働（ベーシック20回/日、Pro 40回/日）】★推奨標準")
    print(f"    ・月間総練習回数                  : {total_cnt_a:,} 回 / 月 (約 {total_cnt_a/30:,.0f} 回/日)")
    print(f"    ・月間AI総原価                    : -¥{ai_cost_a:,.0f} / 月 (${ai_cost_a/res['usd_to_jpy']:.2f})")
    print(f"    ・月間粗利益                      : 🟢 +¥{gross_profit_a:,.0f} / 月 (粗利率 {gross_margin_a:.1f}%)")
    print(f"    ★ 最終営業利益 (固定費控除後)     : 🟢 +¥{op_profit_a:,.0f} / 月 (営業利益率 {op_margin_a:.1f}%)")
    print()
    print("  【シナリオB：上限フル利用・最大負荷（ベーシック30回上限、Pro 60回ヘビー）】")
    print(f"    ・月間総練習回数                  : {total_cnt_b:,} 回 / 月 (約 {total_cnt_b/30:,.0f} 回/日)")
    print(f"    ・月間AI総原価                    : -¥{ai_cost_b:,.0f} / 月 (${ai_cost_b/res['usd_to_jpy']:.2f})")
    print(f"    ・月間粗利益                      : 🟢 +¥{gross_profit_b:,.0f} / 月 (粗利率 {gross_margin_b:.1f}%)")
    print(f"    ★ 最終営業利益 (固定費控除後)     : 🟢 +¥{op_profit_b:,.0f} / 月 (営業利益率 {op_margin_b:.1f}%)")
    print("-" * 74)
    print()

    print("▶ 5. APIキャパシティ限界・レートリミット検証（ボトルネック分析）")
    print("-" * 74)
    print("  【各APIの公式レートリミットと現在の負荷率（50名時・日次1,100〜1,650回）】")
    print("  ① Whisper-1 (音声認識): 上限 50 RPM (リクエスト/分)")
    print("     ・50名稼働時: 1分あたり約 1.5〜2.3 回の利用。")
    print("     ・キャパシティ使用率: ★わずか 3.0% 〜 4.6%（安全率 約25倍〜33倍）")
    print("     ・ボトルネック評価: 全く問題なし。将来1,000名規模でTier2（100 RPM）へ申請推奨。")
    print()
    print("  ② TTS-1 (音声合成): 上限 50 RPM")
    print("     ・リトライ時メモリキャッシュにより実効呼び出しは約50%削減（約0.8〜1.2回/分）。")
    print("     ・キャパシティ使用率: ★わずか 1.6% 〜 2.4%（安全率 約40倍〜60倍）")
    print()
    print("  ③ GPT-4o-mini (文生成): 上限 500 RPM / 200,000 TPM")
    print("     ・1回約434トークン消費。1分あたり約650トークン消費。")
    print("     ・キャパシティ使用率: ★わずか 0.3%（安全率 300倍以上）")
    print()
    print("  ④ ユーザー1人あたりの損益分岐回数（採算限界）")
    print("     ・ベーシック (¥500): 482円 ÷ 0.323円 ＝ 月 1,492 回（1日 49.7 回）で損益分岐。")
    print("       ★ 現在の仕様は「1日30回上限（月900回）」のため、全ユーザーで100%黒字が確定！")
    print("     ・Pro (¥1,480): 1,426円 ÷ 0.323円 ＝ 月 4,414 回（1日 147 回）で損益分岐。")
    print("       ★ 毎日147回（約2.5時間）ぶっ続け練習されない限り赤字化せず、実質ノーリスク。")
    print("=" * 74)

def main():
    parser = argparse.ArgumentParser(description="ShadowLog AI Cost & Profit Simulator")
    parser.add_argument("--users", type=int, default=50, help="Number of paying users (default: 50)")
    parser.add_argument("--daily-uses", type=float, default=20.0, help="Daily practices per user (default: 20)")
    parser.add_argument("--price", type=float, default=500.0, help="Monthly subscription price in JPY (default: 500)")
    parser.add_argument("--usd-jpy", type=float, default=150.0, help="USD to JPY exchange rate (default: 150.0)")
    parser.add_argument("--fee", type=float, default=3.6, help="Credit card processing fee %% (default: 3.6)")
    parser.add_argument("--retry-ratio", type=float, default=2.0, help="Average practices per generated phrase (default: 2.0)")
    parser.add_argument("--office-fee", type=float, default=1650.0, help="GMO Virtual Office monthly fee in JPY (default: 1650.0)")

    args = parser.parse_args()

    results = run_simulation(
        users=args.users,
        daily_practices_per_user=args.daily_uses,
        monthly_price_jpy=args.price,
        credit_card_fee_pct=args.fee,
        usd_to_jpy=args.usd_jpy,
        retry_ratio=args.retry_ratio,
        fixed_office_jpy=args.office_fee,
    )

    print_report(results)

if __name__ == "__main__":
    main()
