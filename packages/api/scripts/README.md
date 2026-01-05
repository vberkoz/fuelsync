# Auto-Tag Refills Script

This script analyzes existing refill data and automatically tags them with driving types (city/highway/mixed) based on heuristic analysis.

## How It Works

The script uses multiple heuristics to determine driving type:

1. **Distance-based**: 
   - >400km = highway
   - <80km = city

2. **Efficiency-based**:
   - >15% above average = highway
   - >15% below average = city

3. **Time + Distance patterns**:
   - Long time + long distance = highway
   - Short time + short distance = city

4. **Default**: Mixed driving

## Usage

```bash
cd packages/api
AWS_PROFILE=your-profile TABLE_NAME=FuelSyncTable node scripts/auto-tag-refills.js
```

## Safety Features

- **Non-destructive**: Only adds tags to untagged refills
- **Skips existing**: Won't overwrite manually tagged refills
- **Per-vehicle analysis**: Calculates efficiency baselines per vehicle
- **Logging**: Shows progress and results

## Expected Results

- Highway trips: Long distances, high efficiency
- City driving: Short distances, lower efficiency  
- Mixed: Everything else

Run once after implementing the driving type feature to tag historical data.