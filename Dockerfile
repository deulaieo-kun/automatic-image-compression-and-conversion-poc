FROM node:18

WORKDIR /usr/src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the wait-for-it.sh script from the src folder
COPY src/wait-for-it.sh ./

# Copy the rest of the application code
COPY . .

EXPOSE 3000

# Use wait-for-it to wait for MySQL to be ready, then start the app
CMD ["./wait-for-it.sh", "db:3306", "--", "npm", "start"]
