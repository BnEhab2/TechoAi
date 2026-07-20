FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose HuggingFace Spaces default port
EXPOSE 7860

# Run the app
CMD ["python", "app.py"]
