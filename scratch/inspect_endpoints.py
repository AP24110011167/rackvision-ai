import re

with open('backend/app/api/endpoints.py', 'r', encoding='utf-8') as f:
    text = f.read()

endpoints = re.findall(r'@router\.(get|post|put|delete|patch)\(([^)]+)\)', text)
print(f"Total API Endpoints: {len(endpoints)}")
for method, path in endpoints:
    clean_path = path.split(",")[0].strip().strip("'\"")
    print(f"  {method.upper():6} {clean_path}")
