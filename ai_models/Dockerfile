FROM python:3.10-slim

WORKDIR /app

# Copy everything into Docker container
COPY . .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Expose Flask port
EXPOSE 5000

# Run your Flask app (note: entrypoint changed based on your file structure)
CMD ["python", "api/app.py"]