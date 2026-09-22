import sys
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parent.parent
GRPC_DIR = SERVER_ROOT / "grpc_generated"

for p in (SERVER_ROOT, GRPC_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))