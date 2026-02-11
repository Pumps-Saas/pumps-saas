from playwright.sync_api import sync_playwright
import time

def run():
    with open("frontend_logs.txt", "w", encoding="utf-8") as f:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            f.write("--- Browser Console Logs ---\n")
            page.on("console", lambda msg: f.write(f"[{msg.type}] {msg.text}\n"))
            page.on("pageerror", lambda exc: f.write(f"[PAGE ERROR] {exc}\n"))
            
            try:
                print(f"Navigating to http://localhost:3000...")
                response = page.goto("http://localhost:3000", timeout=10000)
                f.write(f"Response Status: {response.status}\n")
                
                page.wait_for_timeout(5000) # Wait for execution
                
                title = page.title()
                f.write(f"Page Title: {title}\n")
                
                content = page.content()
                f.write(f"Page Content Length: {len(content)}\n")
                
                page.screenshot(path="debug_screenshot.png")
                print("Screenshot saved.")
                
            except Exception as e:
                f.write(f"FAILED: {e}\n")
                print(f"FAILED: {e}")
            finally:
                browser.close()

if __name__ == "__main__":
    run()
