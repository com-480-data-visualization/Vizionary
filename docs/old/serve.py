#!/usr/bin/env python3
"""
Simple HTTP server for the Olympic Genetics Visualization with debugging features
"""

import os
import http.server
import socketserver
import json
import sys
import webbrowser
from urllib.parse import urlparse

PORT = 8080

class OlympicServerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # First, determine if the path is valid
        # We need to add CORS headers after sending the response
        
        # Check if requesting JSON data
        if self.path.endswith('.json') and self.path.startswith('/data/'):
            data_file = self.path[1:]  # Remove leading slash
            
            # Check if file exists
            if not os.path.exists(data_file):
                if not os.path.exists('data'):
                    os.makedirs('data')
                    
                # If files don't exist, suggest running prepare_simple_data.py
                self.send_response(404)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                self.wfile.write(b"""
                <html>
                <head><title>Data Files Missing</title></head>
                <body>
                    <h1>Data Files Not Found</h1>
                    <p>The required data files have not been generated yet.</p>
                    <p>Please run the following command in your terminal to prepare the data:</p>
                    <pre>python prepare_simple_data.py</pre>
                    <p>After the data is prepared, refresh this page.</p>
                </body>
                </html>
                """)
                return
            
            # Validate JSON before serving
            try:
                with open(data_file, 'r') as f:
                    data = json.load(f)
                    
                # Serve the valid JSON file
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                
                # Send the JSON directly
                self.wfile.write(json.dumps(data).encode('utf-8'))
                return
                
            except json.JSONDecodeError as e:
                # Invalid JSON - show error
                self.send_response(500)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                self.wfile.write(f"""
                <html>
                <head><title>Invalid JSON Data</title></head>
                <body>
                    <h1>Invalid JSON Data</h1>
                    <p>The JSON file <code>{data_file}</code> contains errors:</p>
                    <pre>{str(e)}</pre>
                    <p>Please fix the JSON file or regenerate it with:</p>
                    <pre>python prepare_simple_data.py</pre>
                </body>
                </html>
                """.encode('utf-8'))
                return
                
        # Special endpoint for generating test data
        if self.path == '/generate-test-data':
            try:
                # Run the prepare_simple_data.py script
                exec(open('prepare_simple_data.py').read())
                
                # Return success response
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'Test data generated successfully!')
                return
            except Exception as e:
                # Return error response
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(f'Error generating test data: {str(e)}'.encode('utf-8'))
                return
                
        # Default behavior for other paths
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def run_server():
    """Run the HTTP server and open a browser."""
    
    # Change to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if data files exist and generate them if needed
    data_files = [
        'data/olympic_bubbles.json',
        'data/olympic_genetics_data.json',
        'data/sport_summary.json'
    ]
    
    all_files_exist = all(os.path.exists(file) for file in data_files)
    
    if not all_files_exist:
        print("Some data files are missing. Generating simple test data...")
        try:
            exec(open('prepare_simple_data.py').read())
        except Exception as e:
            print(f"Error generating test data: {e}")
            print("Please run prepare_simple_data.py manually to fix any issues.")
    
    # Create the server with a custom handler
    handler = OlympicServerHandler
    
    # Use ThreadingTCPServer for better performance
    httpd = socketserver.ThreadingTCPServer(("", PORT), handler)
    
    print(f"Serving at: http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server.")
    
    # Open browser
    webbrowser.open(f"http://localhost:{PORT}")
    
    try:
        # Run the server
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()
        httpd.server_close()
        print("Server stopped.")

if __name__ == "__main__":
    run_server()