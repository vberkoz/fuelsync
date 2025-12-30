#!/usr/bin/env python3
import sqlite3
import boto3
from decimal import Decimal
from datetime import datetime
import uuid

DB_PATH = "/Users/basilsergius/Downloads/Топливомер_БД_20221120_160204_1281347789493688515.db3"
DYNAMODB_TABLE = "FuelSyncTable"
USER_ID = "default-user"  # Change to your Cognito user ID

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE)

def to_decimal(val):
    return Decimal(str(val)) if val else Decimal('0')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # cars -> vehicles
    for row in cur.execute("SELECT * FROM cars"):
        vehicle_id = str(uuid.uuid4())
        table.put_item(Item={
            'PK': f"USER#{USER_ID}",
            'SK': f"VEHICLE#{vehicle_id}",
            'vehicleId': vehicle_id,
            'make': row['brand'] or '',
            'model': row['model'] or '',
            'fuelType': 'gasoline',
            'comment': row['comment'] or ''
        })
    
    # refills
    for row in cur.execute("SELECT * FROM refills"):
        refill_id = str(uuid.uuid4())
        timestamp = row['time'] if row['time'] else int(datetime.now().timestamp() * 1000)
        table.put_item(Item={
            'PK': f"VEHICLE#{row['car']}",
            'SK': f"REFILL#{timestamp}#{refill_id}",
            'refillId': refill_id,
            'odometer': to_decimal(row['odometer']),
            'volume': to_decimal(row['amount']),
            'pricePerUnit': to_decimal(row['price']),
            'totalCost': to_decimal(row['sum']),
            'timestamp': timestamp,
            'date': row['date'] or '',
            'comment': row['comment'] or ''
        })
    
    # costs -> expenses
    for row in cur.execute("SELECT * FROM costs"):
        expense_id = str(uuid.uuid4())
        timestamp = row['time'] if row['time'] else int(datetime.now().timestamp() * 1000)
        table.put_item(Item={
            'PK': f"VEHICLE#{row['car_id']}",
            'SK': f"EXPENSE#{timestamp}#{expense_id}",
            'expenseId': expense_id,
            'category': row['type'] or 'other',
            'amount': to_decimal(row['sum']),
            'odometer': to_decimal(row['odometer']),
            'description': row['title'] or '',
            'timestamp': timestamp,
            'date': row['date'] or '',
            'comment': row['comment'] or ''
        })
    
    conn.close()
    print("Migration completed!")

if __name__ == "__main__":
    migrate()
