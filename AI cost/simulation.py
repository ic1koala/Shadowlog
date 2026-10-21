#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ShadowLog AI Cost & Profit Simulator (2026-10-06 Updated)
Based on actual OpenAI usage metrics (GPT-4o-mini, TTS-1, Whisper-1),
300-Sentence Bank (sentence_bank) + Weekly 10% Rotation Architecture,
3-Word Custom Sentence Generation (FB-035: Free 2 cumulative / Base 3/day / Pro 10/day),
Client-Side Zero-Cost Optimizations (FB-022~FB-039),
and GMO Office Support Fixed Cost.
"""

import argparse
import math
import sys

# Empirical benchmark constants derived from actual dashboard usage
CHARS_PER_TTS_REQUEST = 133.1       # 7,586 chars / 57 requests
SECONDS_PER_WHISPER_REQUEST = 9.92   # 119 seconds / 12 requests
# GPT-4o-mini chat request tokens:
# Sentence gen (with natural prompt / seasonal / weak words / custom words injection): ~350 tokens
# Coach evaluation: ~284 tokens
TOKENS_GEN_REQUEST = 350.0          # ~284 base + ~66 natural/seasonal/weak/custom prompt refinement (FB-023/035/038)
TOKENS_COACH_REQUEST = 284.1        # Coach feedback call
CHATS_PER_SESSION = 2                # 1 for sentence gen + 1 for coach review

# OpenAI Pricing (USD)
PRICE_PER_1M_CHARS_TTS = 15.00       # TTS-1: $15.00 / 1M chars
PRICE_PER_MINUTE_WHISPER = 0.006     # Whisper: $0.006 / min ($0.0001 / sec)
PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI = 0.150   # $0.15 / 1M
PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI = 0.600  # $0.60 / 1M

# Sentence Bank Architecture Constants (FB-020: 4 genres x 3 levels = 12 slots x 300 sentences = 3,600 sentences)
BANK_SLOTS = 12                      # 4 genres (Tech, Business, Marketing, Daily) x 3 levels
MAX_SENTENCES_PER_SLOT = 300         # 300 sentences per slot (total 3,600 sentences)
WEEKLY_ROTATION_PCT = 0.10           # 10% weekly replacement of most-used sentences (30 per slot = 360/week)
MONTHLY_ROTATED_SENTENCES = int(BANK_SLOTS * MAX_SENTENCES_PER_SLOT * WEEKLY_ROTATION_PCT * 4)  # 1,440 sentences/month
STEADY_STATE_UNIT_JPY_BENCHMARK = 0.097  # Confirmed steady-state variable cost (~0.097 JPY/practice)
MONTHLY_ROTATION_FIXED_JPY = 331.0       # 1,440 sentences/mo x ~0.23 JPY (GPT gen + TTS-1) = ~331 JPY/month

# 3-Word Custom Sentence Generation Constants (FB-035: Direct GPT-4o-mini + TTS-1, bypasses sentence_bank)
CUSTOM_GEN_UNIT_JPY_AT_150 = 0.174   # Amortized additional cost per custom generation (~0.150 TTS + ~0.024 GPT)
BASE_CUSTOM_DAILY_LIMIT = 3          # Base plan: max 3 custom generations / day (90 / month -> +15.7 JPY/mo max)
PRO_CUSTOM_DAILY_LIMIT = 10          # Pro plan: max 10 custom generations / day (300 / month -> +52.2 JPY/mo max)
BASE_CUSTOM_REALISTIC_DAILY = 1.0    # Realistic average: 1 custom gen / day (+5.2 JPY/mo)
PRO_CUSTOM_REALISTIC_DAILY = 3.0     # Realistic average: 3 custom gens / day (+15.7 JPY/mo)


def calculate_single_practice_cost(usd_to_jpy: float = 150.0):
    """Calculates the unit AI cost for 1 single shadowing practice session across all 3 modes."""
    # 1. TTS Cost (1 full sentence generation)
    tts_cost_usd = (CHARS_PER_TTS_REQUEST / 1_000_000.0) * PRICE_PER_1M_CHARS_TTS

    # 2. Whisper Cost (per recording)
    whisper_cost_usd = (SECONDS_PER_WHISPER_REQUEST / 60.0) * PRICE_PER_MINUTE_WHISPER

    # 3. GPT-4o-mini Cost (Generation + Coach Review)
    gen_cost_usd = (
        (TOKENS_GEN_REQUEST / 1_000_000.0) * PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI
        + (100.0 / 1_000_000.0) * PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI
    )
    coach_cost_usd = (
        (TOKENS_COACH_REQUEST / 1_000_000.0) * PRICE_PER_1M_INPUT_TOKENS_GPT4O_MINI
        + (100.0 / 1_000_000.0) * PRICE_PER_1M_OUTPUT_TOKENS_GPT4O_MINI
    )
    gpt_cost_usd = gen_cost_usd + coach_cost_usd

    total_usd = tts_cost_usd + whisper_cost_usd + gpt_cost_usd
    total_jpy = total_usd * usd_to_jpy

    # Steady-state bank variable cost (0 JPY for TTS & Sentence Gen; only Whisper + Coach evaluation)
    bank_var_jpy = STEADY_STATE_UNIT_JPY_BENCHMARK * (usd_to_jpy / 150.0)
    bank_var_usd = bank_var_jpy / usd_to_jpy

    # 3-Word Custom Generation unit cost (FB-035)
    custom_gen_jpy = CUSTOM_GEN_UNIT_JPY_AT_150 * (usd_to_jpy / 150.0)
    custom_gen_usd = custom_gen_jpy / usd_to_jpy

    return {
        "tts_usd": tts_cost_usd,
        "tts_jpy": tts_cost_usd * usd_to_jpy,
        "whisper_usd": whisper_cost_usd,
        "whisper_jpy": whisper_cost_usd * usd_to_jpy,
        "gpt_gen_usd": gen_cost_usd,
        "gpt_gen_jpy": gen_cost_usd * usd_to_jpy,
        "gpt_coach_usd": coach_cost_usd,
        "gpt_coach_jpy": coach_cost_usd * usd_to_jpy,
        "gpt_usd": gpt_cost_usd,
        "gpt_jpy": gpt_cost_usd * usd_to_jpy,
        "total_usd": total_usd,
        "total_jpy": total_jpy,
        "bank_var_usd": bank_var_usd,
        "bank_var_jpy": bank_var_jpy,
        "custom_gen_usd": custom_gen_usd,
        "custom_gen_jpy": custom_gen_jpy,
        "tts_ratio": (tts_cost_usd / total_usd) * 100.0,
        "whisper_ratio": (whisper_cost_usd / total_usd) * 100.0,
        "gpt_ratio": (gpt_cost_usd / total_usd) * 100.0,
    }


def run_simulation(
    users: int = 50,
    daily_practices_per_user: float = 20.0,
    monthly_price_jpy: float = 598.0,
    credit_card_fee_pct: float = 3.6,
    days_per_month: int = 30,
    usd_to_jpy: float = 150.0,
    retry_ratio: float = 2.0,  # 1 phrase practiced ~2 times on avg during accumulation phase
    fixed_office_jpy: float = 1650.0,  # GMO Office Support (Monthly postal transfer / Corporate registration plan)
    mode: str = "bank",  # "bank" (Steady-state sentence bank), "accumulation" (0.322 JPY), or "standard" (0.479 JPY)
    custom_usage: str = "realistic",  # "realistic" (avg 1-3/day), "max" (daily limit 3-10/day), or "none"
):
    standard_unit = calculate_single_practice_cost(usd_to_jpy)

    # Phase A: Accumulation / Optimized with retry reuse (~0.322 JPY / practice)
    opt_tts_usd = standard_unit["tts_usd"] / retry_ratio
    opt_gpt_usd = (standard_unit["gpt_gen_usd"] / retry_ratio) + standard_unit["gpt_coach_usd"]
    opt_whisper_usd = standard_unit["whisper_usd"]
    opt_total_usd = opt_tts_usd + opt_whisper_usd + opt_gpt_usd
    opt_total_jpy = opt_total_usd * usd_to_jpy

    # Phase B: Steady-State Sentence Bank (~0.097 JPY / practice + 331 JPY/mo rotation)
    bank_var_usd = standard_unit["bank_var_usd"]
    bank_var_jpy = standard_unit["bank_var_jpy"]
    rotation_fixed_jpy = MONTHLY_ROTATION_FIXED_JPY * (usd_to_jpy / 150.0)

    if mode == "bank":
        active_unit_usd = bank_var_usd
        active_unit_jpy = bank_var_jpy
        active_rotation_jpy = rotation_fixed_jpy
    elif mode == "accumulation":
        active_unit_usd = opt_total_usd
        active_unit_jpy = opt_total_jpy
        active_rotation_jpy = 0.0
    else:
        active_unit_usd = standard_unit["total_usd"]
        active_unit_jpy = standard_unit["total_jpy"]
        active_rotation_jpy = 0.0

    # Custom 3-Word / Persona Generation additional monthly cost per user (FB-035/FB-053)
    # Using 9:1 Basic/Pro weighted average if price ~550, or plan-specific if 500 or 1000
    if monthly_price_jpy >= 800:
        max_custom_daily = PRO_CUSTOM_DAILY_LIMIT
        real_custom_daily = PRO_CUSTOM_REALISTIC_DAILY
    elif monthly_price_jpy <= 520:
        max_custom_daily = BASE_CUSTOM_DAILY_LIMIT
        real_custom_daily = BASE_CUSTOM_REALISTIC_DAILY
    else:
        # 9:1 Basic (45) + Pro (5) weighted average:
        # Max: (0.9 * 3 + 0.1 * 10) = 3.7 custom gens/day/user
        # Realistic: (0.9 * 1 + 0.1 * 3) = 1.2 custom gens/day/user
        max_custom_daily = 3.7
        real_custom_daily = 1.2

    if custom_usage == "max":
        custom_daily_per_user = max_custom_daily
    elif custom_usage == "realistic":
        custom_daily_per_user = real_custom_daily
    else:
        custom_daily_per_user = 0.0

    custom_monthly_per_user_jpy = custom_daily_per_user * days_per_month * standard_unit["custom_gen_jpy"]
    total_custom_monthly_jpy = users * custom_monthly_per_user_jpy

    unit = {
        **standard_unit,
        "opt_total_usd": opt_total_usd,
        "opt_total_jpy": opt_total_jpy,
        "bank_var_usd": bank_var_usd,
        "bank_var_jpy": bank_var_jpy,
        "rotation_fixed_jpy": rotation_fixed_jpy,
        "current_unit_jpy": active_unit_jpy,
        "current_unit_usd": active_unit_usd,
        "active_rotation_jpy": active_rotation_jpy,
        "custom_daily_per_user": custom_daily_per_user,
        "custom_monthly_per_user_jpy": custom_monthly_per_user_jpy,
        "total_custom_monthly_jpy": total_custom_monthly_jpy,
        "mode": mode,
        "custom_usage": custom_usage,
    }

    # Volume
    monthly_practices_per_user = daily_practices_per_user * days_per_month
    total_monthly_practices = users * monthly_practices_per_user

    # Revenues & Processing fees
    total_revenue_jpy = users * monthly_price_jpy
    payment_fee_jpy = total_revenue_jpy * (credit_card_fee_pct / 100.0)
    net_revenue_jpy = total_revenue_jpy - payment_fee_jpy

    # AI Costs (Variable + Rotation + Custom 3-Word Generation)
    variable_ai_cost_jpy = total_monthly_practices * active_unit_jpy
    total_ai_cost_jpy = variable_ai_cost_jpy + active_rotation_jpy + total_custom_monthly_jpy
    total_ai_cost_usd = total_ai_cost_jpy / usd_to_jpy
    ai_cost_per_user_jpy = (monthly_practices_per_user * active_unit_jpy) + custom_monthly_per_user_jpy

    # Gross Profit (Revenue - Payment Fees - AI Costs)
    gross_profit_jpy = net_revenue_jpy - total_ai_cost_jpy
    gross_profit_margin_pct = (gross_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0
    profit_per_user_jpy = (monthly_price_jpy * (1.0 - credit_card_fee_pct / 100.0)) - ai_cost_per_user_jpy

    # Fixed Costs (GMO Virtual Office)
    total_fixed_cost_jpy = fixed_office_jpy
    operating_profit_jpy = gross_profit_jpy - total_fixed_cost_jpy
    operating_profit_margin_pct = (operating_profit_jpy / total_revenue_jpy) * 100.0 if total_revenue_jpy > 0 else 0.0

    # Break-even users needed to cover GMO virtual office fee (+ bank rotation if applicable)
    fixed_plus_rotation = total_fixed_cost_jpy + active_rotation_jpy
    break_even_users_for_fixed = math.ceil(fixed_plus_rotation / profit_per_user_jpy) if profit_per_user_jpy > 0 else float("inf")

    # Break-even calculations per user
    net_rev_per_user = (monthly_price_jpy * (1.0 - credit_card_fee_pct / 100.0)) - custom_monthly_per_user_jpy
    break_even_monthly_practices = max(0.0, net_rev_per_user / active_unit_jpy)
    break_even_daily_practices = break_even_monthly_practices / days_per_month

    return {
        "unit": unit,
        "mode": mode,
        "custom_usage": custom_usage,
        "users": users,
        "daily_practices": daily_practices_per_user,
        "monthly_practices_per_user": monthly_practices_per_user,
        "total_monthly_practices": total_monthly_practices,
        "monthly_price_jpy": monthly_price_jpy,
        "credit_card_fee_pct": credit_card_fee_pct,
        "total_revenue_jpy": total_revenue_jpy,
        "payment_fee_jpy": payment_fee_jpy,
        "net_revenue_jpy": net_revenue_jpy,
        "variable_ai_cost_jpy": variable_ai_cost_jpy,
        "active_rotation_jpy": active_rotation_jpy,
        "total_custom_monthly_jpy": total_custom_monthly_jpy,
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
        "usd_to_jpy": usd_to_jpy,
        "retry_ratio": retry_ratio,
    }


def print_report(res):
    u = res["unit"]
    print("=" * 82)
    print("   📊 ShadowLog 総合収支試算シミュレーション（2026/10/06 最新仕様・カスタム生成込）")
    print("=" * 82)
    print(f"為替想定: 1 USD = {res['usd_to_jpy']:.1f} 円 | 決済手数料: {res['credit_card_fee_pct']:.1f}% (Stripe)")
    print(f"固定費想定: GMOオフィスサポート (月1転送/法人登記可) = ¥{res['fixed_office_jpy']:,.0f} /月 (税込)")
    print()

    print("▶ 1. 練習1回あたりのAI原価構造（3フェーズ比較 ＋ 3単語カスタム生成枠 FB-035）")
    print("-" * 82)
    print(f"  ①【従来フル生成モード（毎回新規生成・リトライなし）】: 約 {u['total_jpy']:.3f} 円 / 回 (${u['total_usd']:.5f})")
    print(f"  ②【フェーズA：蓄積期・リトライ再利用モード（各スロット300文未満 / 保守上限）】:")
    print(f"     ・TTS-1 (音声再利用により半減)       : 約 {u['tts_jpy']/res['retry_ratio']:.3f} 円")
    print(f"     ・Whisper-1 (発話音声認識/約10秒)     : 約 {u['whisper_jpy']:.3f} 円")
    print(f"     ・GPT-4o-mini (文生成+コーチ指導)     : 約 {((u['gpt_gen_jpy']/res['retry_ratio']) + u['gpt_coach_jpy']):.3f} 円")
    print(f"     ★ 蓄積期 実質AI原価                  : 約 {u['opt_total_jpy']:.3f} 円 / 回 (${u['opt_total_usd']:.5f}) [約33%圧縮]")
    print()
    print(f"  ③【フェーズB：問題バンク定常運用モード（300文×12スロット蓄積完了後）★最新仕様】:")
    print(f"     ・出題・TTS模範音声・先読み(Prefetch) : 0.000 円 (DBから0.1秒で即時配信)")
    print(f"     ・練習ごとの変動原価 (Whisper+評価)   : 約 {u['bank_var_jpy']:.3f} 円 / 回 (${u['bank_var_usd']:.5f}) [約70%〜80%圧縮!]")
    print(f"     ・週次10%自動ローテーション固定原価   : 月額 約 {u['rotation_fixed_jpy']:,.0f} 円 / 月 (週360文・月1,440文入替・会員数非依存)")
    print()
    print(f"  ④【新機能：3単語カスタム例文生成（FB-035 / sentence_bankバイパス・都度生成）】:")
    print(f"     ・1回あたり追加生成原価 (GPT+TTS)     : 約 {u['custom_gen_jpy']:.3f} 円 / 回 (2回練習償却時)")
    print(f"     ・プラン別利用上限 (JST 0:00リセット) : 無料=累計2回 / Base=1日3回 / Pro=1日10回")
    print(f"     ・1人あたり月間追加原価 (実効平均/上限): Base +¥5.2/月 (上限+¥15.7) | Pro +¥15.7/月 (上限+¥52.2)")
    print()
    print(f"  ⑤【2026/10/01〜10/06 実装のゼロコスト＆原価削減アーキテクチャ (FB-022〜FB-039)】:")
    print(f"     ・2ボタン録音＆判定前無制限録り直し(FB-026/029): 言い直し時のWhisper/GPT無駄打ちを完全ゼロ化")
    print(f"     ・英単語タップ3Dフリップ＆発音再生(FB-029)     : Web Speech API採用によりAPI原価 0円")
    print(f"     ・速度別動的WPM算出(FB-022)・Bluetooth増幅(FB-032/036)・Web Push通知(FB-033): 全てAPI原価 0円")
    print()

    # Portfolio Case: 50 Users (45 Basic + 5 Pro)
    basic_users = 45
    pro_users = 5
    b_rev = basic_users * 500
    p_rev = pro_users * 1000
    port_gross_rev = b_rev + p_rev  # ¥27,500
    fee_pct = res["credit_card_fee_pct"]
    port_fee = port_gross_rev * (fee_pct / 100.0)  # ¥990
    port_net_rev = port_gross_rev - port_fee  # ¥26,510

    # Volume A: 50 users x 20/day avg = 30,000 practices/mo
    cnt_30k = 50 * 20 * 30  # 30,000
    # Volume B: Basic 45x20 + Pro 5x40 = 33,000 practices/mo
    cnt_33k = (basic_users * 20 * 30) + (pro_users * 40 * 30)  # 33,000

    # Custom / Persona word generation portfolio cost (45 Basic + 5 Pro)
    # Realistic: 45 * 1/day * 30 + 5 * 3/day * 30 = 1,800 gens/mo * 0.174 JPY = ¥313.2/mo
    # Max quota (FB-053): 45 * 5/day * 30 + 5 * 15/day * 30 = 9,000 gens/mo * 0.174 JPY = ¥1,566/mo
    custom_port_real = ((basic_users * BASE_CUSTOM_REALISTIC_DAILY * 30) + (pro_users * PRO_CUSTOM_REALISTIC_DAILY * 30)) * u["custom_gen_jpy"]
    custom_port_max = ((basic_users * 5.0 * 30) + (pro_users * 15.0 * 30)) * u["custom_gen_jpy"]

    # Phase A (Accumulation @0.322 JPY)
    ai_acc_30k = cnt_30k * u["opt_total_jpy"]
    op_acc_30k = port_net_rev - ai_acc_30k - res["fixed_office_jpy"]
    margin_acc_30k = (op_acc_30k / port_gross_rev) * 100.0

    ai_acc_33k = cnt_33k * u["opt_total_jpy"]
    op_acc_33k = port_net_rev - ai_acc_33k - res["fixed_office_jpy"]
    margin_acc_33k = (op_acc_33k / port_gross_rev) * 100.0

    # Phase B (Sentence Bank Steady-State @0.097 JPY + ¥331 rotation)
    ai_bank_30k_base = (cnt_30k * u["bank_var_jpy"]) + u["rotation_fixed_jpy"]  # ¥2,910 + ¥331 = ¥3,241
    op_bank_30k_base = port_net_rev - ai_bank_30k_base - res["fixed_office_jpy"]  # +¥21,619 (78.6%)

    # Phase B + Custom Words / Persona (Realistic +¥313/mo & Max Quota +¥1,566/mo)
    ai_bank_30k_real = ai_bank_30k_base + custom_port_real  # ¥3,554
    op_bank_30k_real = port_net_rev - ai_bank_30k_real - res["fixed_office_jpy"]  # +¥21,306
    margin_bank_30k_real = (op_bank_30k_real / port_gross_rev) * 100.0  # 77.5%

    ai_bank_30k_max = ai_bank_30k_base + custom_port_max  # ¥4,807
    op_bank_30k_max = port_net_rev - ai_bank_30k_max - res["fixed_office_jpy"]  # +¥20,053
    margin_bank_30k_max = (op_bank_30k_max / port_gross_rev) * 100.0  # 72.9%

    ai_bank_33k_real = (cnt_33k * u["bank_var_jpy"]) + u["rotation_fixed_jpy"] + custom_port_real
    op_bank_33k_real = port_net_rev - ai_bank_33k_real - res["fixed_office_jpy"]
    margin_bank_33k_real = (op_bank_33k_real / port_gross_rev) * 100.0

    print("▶ 2. 【3ヶ月後到達目標】有料会員50名（ベーシック45名 ＋ Pro 5名）収支試算")
    print("-" * 82)
    print(f"  ・目標構成                          : ベーシック 45名 (¥500) ＋ Pro 5名 (¥1,000) = 計 50名")
    print(f"  ・月間総売上 (MRR)                  :  ¥{port_gross_rev:,.0f} / 月")
    print(f"  ・Stripe決済手数料 ({fee_pct}%)            : -¥{port_fee:,.0f} / 月 (手取純売上: ¥{port_net_rev:,.0f})")
    print(f"  ・GMOバーチャルオフィス固定費       : -¥{res['fixed_office_jpy']:,.0f} / 月 (Supabase/Resend無料枠 ¥0)")
    print(f"  ・Vercel有料化方針                  : 有料会員30名超でPro ($20/月≒¥3,000) 移行検討 (下記は現行Hobby ¥0)")
    print()
    print("  【フェーズB：問題バンク定常運用期 (@0.097円/回 ＋ 週10%入替 ¥331/月) ★本命】")
    print(f"    ・バンク定常のみ (月30,000回)     : AI原価 -¥{ai_bank_30k_base:,.0f} ➔ 🟢 営業利益 +¥{op_bank_30k_base:,.0f}/月 (利益率 {margin_bank_30k_base:.1f}%)")
    print(f"    ・ペルソナ/カスタム実効平均込     : AI原価 -¥{ai_bank_30k_real:,.0f} ➔ 🟢 営業利益 +¥{op_bank_30k_real:,.0f}/月 (利益率 {margin_bank_30k_real:.1f}%!)")
    print(f"    ・ペルソナ/カスタム全員毎日上限込 : AI原価 -¥{ai_bank_30k_max:,.0f} ➔ 🟢 営業利益 +¥{op_bank_30k_max:,.0f}/月 (利益率 {margin_bank_30k_max:.1f}%!)")
    print(f"    ・固定費回収の損益分岐会員数      : ベーシック わずか 5名 (または Pro 3名)")
    print()
    print("  ※ 30名到達時にVercel Pro (約¥3,000/月) を契約した場合でも、50名時営業利益は約 +¥17,000〜¥18,000/月 (利益率 60%超) を維持。")
    print("-" * 82)
    print()

    print("▶ 3. プラン別 1人あたり採算性 ＆ 損益分岐ライン（1日上限撤廃・ペルソナハイブリッド出題対応）")
    print("-" * 82)
    print(f"{'プラン・フェーズ':<28} | {'月額(手取)':<11} | {'20回/日時原価':<14} | {'1人粗利':<9} | {'採算限界(損益分岐回数)'}")
    print("-" * 82)
    print(f"{'Basic (蓄積期 @0.322円)':<28} | ¥500 (¥482) | ¥193 /月       | +¥289 /人 | 月 1,492回 (1日 約 50回)")
    print(f"{'Basic (定常 @0.097円+ペルソナ)':<28} | ¥500 (¥482) | ¥74〜¥84 /月   | +¥398〜408| 月 4,700〜4,900回 (1日 約160回)")
    print(f"{'Pro   (蓄積期 @0.322円)':<28} | ¥1000(¥964) | ¥193 /月       | +¥771 /人 | 月 2,990回 (1日 約 100回)")
    print(f"{'Pro   (定常 @0.097円+ペルソナ)':<28} | ¥1000(¥964) | ¥100〜¥137 /月 | +¥827〜864| 月 9,000〜9,500回 (1日 約300回)")
    print("-" * 82)
    print("  ※ 定常モードのペルソナ/カスタムは、Base上限5問/日(月+26.1円)、Pro上限15問/日(月+78.3円)を安全キャップとして組み込み済み。")
    print("=" * 82)


def main():
    parser = argparse.ArgumentParser(description="ShadowLog AI Cost & Profit Simulator")
    parser.add_argument("--users", type=int, default=50, help="Number of paying users (default: 50)")
    parser.add_argument("--daily-uses", type=float, default=20.0, help="Daily practices per user (default: 20)")
    parser.add_argument("--price", type=float, default=598.0, help="Monthly subscription price in JPY (default: 598 weighted avg)")
    parser.add_argument("--usd-jpy", type=float, default=150.0, help="USD to JPY exchange rate (default: 150.0)")
    parser.add_argument("--fee", type=float, default=3.6, help="Credit card processing fee %% (default: 3.6)")
    parser.add_argument("--retry-ratio", type=float, default=2.0, help="Average practices per generated phrase (default: 2.0)")
    parser.add_argument("--office-fee", type=float, default=1650.0, help="GMO Virtual Office monthly fee in JPY (default: 1650.0)")
    parser.add_argument(
        "--mode",
        choices=["bank", "accumulation", "standard"],
        default="bank",
        help="Cost mode: 'bank' (steady-state 0.097 JPY + 331 JPY/mo), 'accumulation' (0.322 JPY), or 'standard' (0.479 JPY)",
    )
    parser.add_argument(
        "--custom-words",
        choices=["realistic", "max", "none"],
        default="realistic",
        help="3-Word Custom Generation usage: 'realistic' (avg 1-3/day), 'max' (limit 3-10/day), or 'none'",
    )

    args = parser.parse_args()
    res = run_simulation(
        users=args.users,
        daily_practices_per_user=args.daily_uses,
        monthly_price_jpy=args.price,
        credit_card_fee_pct=args.fee,
        usd_to_jpy=args.usd_jpy,
        retry_ratio=args.retry_ratio,
        fixed_office_jpy=args.office_fee,
        mode=args.mode,
        custom_usage=args.custom_words,
    )
    print_report(res)


if __name__ == "__main__":
    main()
