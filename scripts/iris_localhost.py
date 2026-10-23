#!/usr/bin/env python3
"""
Iris Local Host Web Server
Serves the Iris Scientific Studio interface securely on localhost (127.0.0.1).
"""
import sys
import os
import json
import urllib.parse
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("IRIS_PORT", sys.argv[1] if len(sys.argv) > 1 else 4180))
ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"

def get_pkg_version() -> str:
    try:
        pkg = json.loads((ROOT_DIR / "package.json").read_text(encoding="utf-8"))
        return pkg.get("version", "5.2.0")
    except Exception:
        return "5.2.0"

APP_VERSION = get_pkg_version()

class IrisHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Strictly serve from DIST_DIR if it exists; never fall back to ROOT_DIR
        base_dir = DIST_DIR if DIST_DIR.exists() and DIST_DIR.is_dir() else ROOT_DIR / "public"
        super().__init__(*args, directory=str(base_dir), **kwargs)

    def is_loopback_host(self) -> bool:
        host = self.headers.get("Host", "").strip().split(":")[0]
        return host in ("127.0.0.1", "localhost", "::1")

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin.startswith(("http://127.0.0.1:", "http://localhost:", "tauri://localhost")):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if not self.is_loopback_host():
            self.send_error(403, "Forbidden: Host must be loopback (127.0.0.1 or localhost)")
            return

        clean_path = urllib.parse.unquote(self.path.split("?")[0])
        if ".." in clean_path or "\\" in clean_path:
            self.send_error(403, "Forbidden: Invalid traversal path")
            return

        if clean_path in ("/api/status", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status_data = {
                "status": "ok",
                "app": "Iris",
                "version": APP_VERSION,
                "localhost": True,
                "port": PORT,
                "url": f"http://127.0.0.1:{PORT}"
            }
            self.wfile.write(json.dumps(status_data).encode("utf-8"))
            return

        if not DIST_DIR.exists():
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"<!DOCTYPE html><html><body><h1>Iris Local Host</h1><p>Run 'npm run build' to compile and serve the web studio.</p></body></html>")
            return

        # Path verification: ensure resolved path is strictly within DIST_DIR
        rel_path = clean_path.lstrip("/") or "index.html"
        target = (DIST_DIR / rel_path).resolve()
        try:
            target.relative_to(DIST_DIR.resolve())
        except ValueError:
            self.send_error(403, "Forbidden: Path escapes distribution directory")
            return

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
    server = ThreadingHTTPServer(("127.0.0.1", PORT), IrisHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nIris Local Host stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
