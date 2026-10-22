#!/usr/bin/env python3
"""
Iris Local Host Web Server
Serves the Iris Scientific Studio interface and REST APIs on localhost (127.0.0.1).
"""
import sys
import os
import json
import mimetypes
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("IRIS_PORT", sys.argv[1] if len(sys.argv) > 1 else 4180))
ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"

class IrisHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR if DIST_DIR.exists() else ROOT_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if clean_path in ("/api/status", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status_data = {
                "status": "ok",
                "app": "Iris",
                "version": "5.2.0",
                "localhost": True,
                "port": PORT,
                "url": f"http://127.0.0.1:{PORT}"
            }
            self.wfile.write(json.dumps(status_data).encode("utf-8"))
            return

        # Single page application fallback: route non-existing files to index.html
        target = (DIST_DIR / clean_path.lstrip("/")).resolve()
        if not target.exists() or target.is_dir():
            index_file = DIST_DIR / "index.html"
            if index_file.exists():
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(index_file.read_bytes())
                return

        return super().do_GET()

def main():
    print(f"❀ Starting Iris Local Host on http://127.0.0.1:{PORT}")
    if not DIST_DIR.exists():
        print(f"Notice: Production build '{DIST_DIR}' not found. Run 'npm run build' for full studio UI.")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), IrisHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nIris Local Host stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
