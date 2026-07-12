import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.supabase import supabase_admin_client, safe_supabase_call

try:
    print("Checking if audit_logs table exists...")
    res = safe_supabase_call(
        supabase_admin_client.table("audit_logs").select("*").limit(1).execute
    )
    print("Table audit_logs exists! Data:")
    print(res.data)
except Exception as e:
    print(f"Table audit_logs does not exist or query failed: {e}")
