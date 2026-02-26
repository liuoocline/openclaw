---
description: Fund portfolio daily operations - trade recording, cash updates, snapshots, reports. Use when user asks to record trades, check portfolio, update cash, or generate analysis reports.
---

# Fund Operations Quick Reference

All commands run from `E:\CursorRules\openclaw\.openclaw\workspace\fund-manager\DataTicker\tools`

## Record a Trade

// turbo

```powershell
python fund_ops.py trade buy CODE AMOUNT
```

Example: `python fund_ops.py trade buy 018476 1500` (buy 1500 yuan)

// turbo

```powershell
python fund_ops.py trade sell CODE --shares SHARES
```

Example: `python fund_ops.py trade sell 018476 --shares 2556` (sell 2556 shares)
Example: `python fund_ops.py trade sell 018476 --ratio 0.5` (sell half)

Options: `--price 1.05` (override NAV), `--date 2026-02-25`, `--status CONFIRMED`, `--remark "reason"`

## Update Cash Balance

// turbo

```powershell
python fund_ops.py cash AMOUNT
```

Example: `python fund_ops.py cash 35006.14`

## Portfolio Snapshot

// turbo

```powershell
python fund_ops.py snapshot
```

JSON output: `python fund_ops.py snapshot --json`

## View Pending Trades

// turbo

```powershell
python fund_ops.py pending
```

## Confirm a Trade

```powershell
python fund_ops.py confirm CODE PRICE
```

Example: `python fund_ops.py confirm 018476 1.0590 --fee 0.50`

## Generate Analysis Report

// turbo

```powershell
python fund_ops.py report analyst
```

Report saved to `分析/估值深度分析_YYYY-MM-DD.md`

## Data Collection

// turbo
Full collection:

```powershell
python one_click_data_collection.py
```

// turbo
Critical only (NAV + index + estimates):

```powershell
python one_click_data_collection.py --critical-only
```

// turbo
Intraday quick collection (estimates + index + flows):

```powershell
python one_click_data_collection.py --tasks "交易时段快速采集"
```

// turbo
Midday full collection:

```powershell
python one_click_data_collection.py --tasks "中午1点前数据采集"
```

// turbo
After-close collection (NAV + PnL + news, run after 18:00):

```powershell
python one_click_data_collection.py --tasks "收盘后数据采集"
```

// turbo
Data status check:

```powershell
python check_data_status.py
```

Individual scripts (run directly, no --help needed):

- `python fund_estimate_collector.py --action collect --force` — Intraday estimates
- `python fund_data_collector.py` — NAV collection
- `python market_index_spider.py` — Market indexes
- `python industry_flow_spider.py` — Industry fund flows
- `python northbound_flow_spider.py` — Northbound flows
- `python news_collector_v2.py` — News collection
- `python fund_daily_update.py` — Daily PnL calculation

## Existing Query Tools

// turbo

```powershell
python fund_quick_query.py summary
```

Other: `today`, `positions`, `estimates`, `news`, `sectors`

## Maintenance

// turbo
Database backup:

```powershell
python backup_database.py --keep 7
```

// turbo
Clean old reports:

```powershell
python fund_cleanup_old_reports.py
```

// turbo
Database backup via task group:

```powershell
python one_click_data_collection.py --tasks "数据库备份"
```

## Daily Workflow

Typical daily workflow:

1. **Morning (before market)**: `one_click_data_collection.py --tasks "中午1点前数据采集"`
2. **During trading**: `fund_ops.py snapshot` or `fund_quick_query.py today`
3. **Record trades**: `fund_ops.py trade buy/sell CODE AMOUNT`
4. **After close (18:00+)**: `one_click_data_collection.py --tasks "收盘后数据采集"`
5. **Generate report**: `fund_ops.py report analyst`
6. **Update cash**: `fund_ops.py cash AMOUNT`
7. **Check data**: `check_data_status.py`
