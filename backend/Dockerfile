FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway will provide the PORT environment variable
EXPOSE $PORT

# Start the application using Railway's PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info