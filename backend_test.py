import requests
import sys
import base64
import io
from PIL import Image
from datetime import datetime
import json

class PokemonPixelizerTester:
    def __init__(self, base_url="https://pixel-pokemon-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"\n{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def create_test_image(self, format="PNG"):
        """Create a simple test image with visual features"""
        # Create a 100x100 image with some visual features (not blank)
        img = Image.new('RGB', (100, 100), color='white')
        pixels = img.load()
        
        # Add some visual features - a simple pattern
        for i in range(100):
            for j in range(100):
                if (i + j) % 20 < 10:
                    pixels[i, j] = (255, 0, 0)  # Red squares
                elif i % 30 < 15:
                    pixels[i, j] = (0, 255, 0)  # Green stripes
                else:
                    pixels[i, j] = (0, 0, 255)  # Blue background
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format=format)
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_api_root(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_message = "Pokemon Pixelizer API"
                if data.get("message") == expected_message:
                    self.log_test("API Root Endpoint", True, f"Status: {response.status_code}, Message: {data.get('message')}")
                else:
                    self.log_test("API Root Endpoint", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Error: {str(e)}")

    def test_pixelify_valid_image(self):
        """Test pixelify endpoint with valid image"""
        try:
            # Create test image
            test_image_b64 = self.create_test_image("PNG")
            
            payload = {
                "image_base64": f"data:image/png;base64,{test_image_b64}"
            }
            
            print("   Sending image to GPT-4o for processing...")
            response = requests.post(
                f"{self.api_url}/pixelify", 
                json=payload, 
                timeout=60  # Longer timeout for AI processing
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "original_image", "result_text", "timestamp"]
                
                missing_fields = [field for field in required_fields if field not in data]
                if not missing_fields:
                    result_length = len(data.get("result_text", ""))
                    if result_length > 50:  # Expect substantial response from GPT
                        self.log_test("Pixelify Valid Image", True, 
                                    f"Response length: {result_length} chars, ID: {data.get('id')[:8]}...")
                        return data.get("id")  # Return ID for history test
                    else:
                        self.log_test("Pixelify Valid Image", False, 
                                    f"Response too short: {result_length} chars")
                else:
                    self.log_test("Pixelify Valid Image", False, 
                                f"Missing fields: {missing_fields}")
            else:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "Unknown error")
                except:
                    error_detail = response.text[:200]
                
                self.log_test("Pixelify Valid Image", False, 
                            f"Status: {response.status_code}, Error: {error_detail}")
                
        except Exception as e:
            self.log_test("Pixelify Valid Image", False, f"Error: {str(e)}")
        
        return None

    def test_pixelify_invalid_image(self):
        """Test pixelify endpoint with invalid image data"""
        try:
            payload = {
                "image_base64": "invalid_base64_data"
            }
            
            response = requests.post(f"{self.api_url}/pixelify", json=payload, timeout=30)
            
            # Should return 400 for invalid image
            if response.status_code == 400:
                self.log_test("Pixelify Invalid Image", True, f"Correctly rejected invalid image")
            else:
                self.log_test("Pixelify Invalid Image", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Pixelify Invalid Image", False, f"Error: {str(e)}")

    def test_pixelify_no_image(self):
        """Test pixelify endpoint with no image"""
        try:
            payload = {
                "image_base64": ""
            }
            
            response = requests.post(f"{self.api_url}/pixelify", json=payload, timeout=30)
            
            # Should return 400 for no image
            if response.status_code == 400:
                self.log_test("Pixelify No Image", True, f"Correctly rejected empty image")
            else:
                self.log_test("Pixelify No Image", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Pixelify No Image", False, f"Error: {str(e)}")

    def test_history_endpoint(self):
        """Test the history endpoint"""
        try:
            response = requests.get(f"{self.api_url}/history", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("History Endpoint", True, 
                                f"Retrieved {len(data)} history items")
                else:
                    self.log_test("History Endpoint", False, 
                                f"Expected list, got {type(data)}")
            else:
                self.log_test("History Endpoint", False, 
                            f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("History Endpoint", False, f"Error: {str(e)}")

    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            response = requests.options(f"{self.api_url}/pixelify", timeout=10)
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            present_headers = [h for h in cors_headers if h in response.headers]
            
            if len(present_headers) >= 2:  # At least origin and methods
                self.log_test("CORS Configuration", True, 
                            f"CORS headers present: {len(present_headers)}")
            else:
                self.log_test("CORS Configuration", False, 
                            f"Missing CORS headers: {set(cors_headers) - set(present_headers)}")
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Pokemon Pixelizer Backend Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_api_root()
        
        # Test CORS
        self.test_cors_headers()
        
        # Test pixelify endpoint
        conversion_id = self.test_pixelify_valid_image()
        self.test_pixelify_invalid_image()
        self.test_pixelify_no_image()
        
        # Test history
        self.test_history_endpoint()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Return results for reporting
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run)*100,
            "test_details": self.test_results
        }

def main():
    """Main test execution"""
    tester = PokemonPixelizerTester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["success_rate"] >= 80:
        print("\n✅ Backend tests mostly successful!")
        return 0
    else:
        print("\n❌ Backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())