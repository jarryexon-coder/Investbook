FROM python:3.11-slim

WORKDIR /app

# Copy backend files
COPY backend/ .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create start script
RUN echo '#!/bin/bash\npython app.py' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Start the application
CMD ["./start.sh"]
