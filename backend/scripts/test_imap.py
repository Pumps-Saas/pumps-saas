import imaplib
import os
import email

password = "srwlpfjlgrssxrhw"
user = "admin@pumps-saas.com"

print("Connecting...")
mail = imaplib.IMAP4_SSL("imap.gmail.com")
mail.login(user, password)
print("Logged in!")

print("Folders:")
status, folders = mail.list()
for f in folders:
    print(f.decode())

print("Selecting 'Suporte'...")
status, messages = mail.select("Suporte")
print(status, messages)

if status == "OK":
    status, messages = mail.search(None, 'UNSEEN')
    print("UNSEEN:", status, messages)
    if messages and messages[0]:
        for msg_id in messages[0].split():
            res, msg_data = mail.fetch(msg_id, '(RFC822)')
            print(f"Fetched {msg_id}")

mail.logout()
