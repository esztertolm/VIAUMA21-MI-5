import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

# log könyvtár létrehozása
Path("logs").mkdir(exist_ok=True)

logger = logging.getLogger("myapp")
logger.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

log_filename = f"logs/app_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

# # File handler (rotating)
# file_handler = RotatingFileHandler(
#     "logs/app.log", maxBytes=5*1024*1024, backupCount=5
# )
file_handler = logging.FileHandler(log_filename)
file_handler.setFormatter(formatter)

# Dupla handler (console + file)
logger.addHandler(console_handler)
logger.addHandler(file_handler)
