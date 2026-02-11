from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=10000)
            page.wait_for_load_state("networkidle")
            
            title = page.title()
            print(f"Page Title: {title}")
            
            # Check for error overlay
            if page.locator("text=Uncaught error").count() > 0:
                print("ERROR FOUND ON PAGE!")
                print(page.locator("body").inner_text())
            elif page.locator("text=Active Simulation").count() > 0:
                print("SUCCESS: Dashboard loaded. Found 'Active Simulation'.")
                # Optional: Check for calculation buttons
                if page.locator("text=Calculate").count() > 0:
                    print("SUCCESS: Calculate button found.")
            else:
                print("WARNING: Unknown state. Dumping body text:")
                print(page.locator("body").inner_text())

            page.screenshot(path="frontend_verification.png")
            print("Screenshot saved to frontend_verification.png")
            
        except Exception as e:
            print(f"FAILED to load page: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
