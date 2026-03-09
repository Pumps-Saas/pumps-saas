path = r"C:\Users\pedro\OneDrive\Documentos\Antigravity\Pumps\backend\app\core\email_poller.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('if sender_type == \\"admin\\":', 'if sender_type == "admin":')
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Syntax error fixed successfully.")
