import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.supabase import supabase_admin_client

possible_rpcs = ["execute_sql", "run_sql", "exec_sql", "sql", "exec_query"]

for rpc in possible_rpcs:
    try:
        print(f"Testing RPC '{rpc}'...")
        res = supabase_admin_client.rpc(rpc, {"query": "SELECT 1"}).execute()
        print(f"Success! RPC '{rpc}' exists. Result: {res.data}")
        break
    except Exception as e:
        print(f"RPC '{rpc}' failed: {e}")
else:
    print("No SQL execution RPC found.")
